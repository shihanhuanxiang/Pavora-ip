
import { getGeminiClient } from "../../../shared/services/core/geminiClient";
import type { DirectorScene } from "../../../shared/types/types";
import { buildDirectorPrompt, VIDEO_PROMPT_ANALYSIS, SCRIPT_TO_STORYBOARD_PROMPT, IMAGE_VISUAL_ANALYSIS_PROMPT } from "../../../prompts/director";
import { GoogleGenAI, Modality } from "@google/genai";
import { fitImageToAspectRatio } from "../../../shared/utils/imageUtils";
import { withBackoff } from "../../../shared/services/retry";
import { runPromptPipeline } from "../../../promptPipeline";

// Preflight Check for Video Generation Parameters
function videoGenerationPreflight(params: any) {
    // 1. Aspect Ratio Guard
    if (!['16:9', '9:16', '1:1'].includes(params.aspectRatio)) {
        throw new Error(`Invalid Aspect Ratio: ${params.aspectRatio}. Must be '16:9', '9:16' or '1:1'.`);
    }

    // 2. Mode Exclusivity Guard
    // I2V (image), Reference (referenceImages), Extend (video)
    const hasImage = !!params.image;
    const hasRefs = Array.isArray(params.referenceImages) && params.referenceImages.length > 0;
    const hasVideo = !!params.video; // For extension

    // Count how many primary input modes are active
    const modeCount = [hasImage, hasRefs, hasVideo].filter(Boolean).length;
    
    // Ensure at least ONE source exists.
    if (modeCount === 0) {
        throw new Error('No input provided. Please provide a start image, reference images, or a video to extend.');
    }
    
    // 3. Resolution Guard
    if (!['720p', '1080p'].includes(params.resolution)) {
        throw new Error('Invalid Resolution. Must be 720p or 1080p.');
    }
}

// Director Mode
export const generateVideo = async (params: any, onProgress: any) => {
    onProgress('正在初始化影片生成服務...');
    
    // Video is always a paid feature
    const client = await getGeminiClient(true);

    // 1. Determine Task Complexity & Configuration
    let hasReferences = (params.referenceImages && params.referenceImages.length > 0) || !!params.faceReference;
    const hasLastFrame = !!params.lastFrame;
    const isExtension = !!params.previousVideo;
    const userRequestedHighRes = params.resolution === '1080p';

    // --- SMART CONFLICT RESOLUTION (VEO 3.1 RULES) ---
    // Rule: Timeline Control (LastFrame/Extension) is MUTUALLY EXCLUSIVE with Asset Control (References/FaceAnchor)
    
    if (hasLastFrame && hasReferences) {
        onProgress('⚠️ API 限制：[起訖幀模式] 不支援同時使用 [臉部錨定/參考圖]。已自動移除參考圖以確保生成。');
        hasReferences = false;
        params.referenceImages = undefined;
        params.faceReference = undefined;
    }

    if (isExtension && hasReferences) {
         onProgress('⚠️ API 限制：[影片延長模式] 不支援同時使用 [臉部錨定/參考圖]。已自動移除參考圖。');
         hasReferences = false;
         params.referenceImages = undefined;
         params.faceReference = undefined;
    }

    // Model Selection
    // Rule: Extension and Multi-Reference MUST use veo-3.1-generate-preview.
    // Rule: 1080p/4K MUST use veo-3.1-generate-preview.
    // Rule: lastFrame (start-to-end) CAN use lite.
    let model = 'veo-3.1-lite-generate-preview'; 
    if (hasReferences || isExtension || userRequestedHighRes) {
        model = 'veo-3.1-generate-preview';
    }

    // Configuration Construction
    const config: any = {
        numberOfVideos: 1,
        resolution: params.resolution || '720p',
        aspectRatio: params.aspectRatio || '16:9'
    };

    // CRITICAL FIX: Veo API Constraints Enforcement
    // API restricts resolution/AR for advanced modes.
    if (hasReferences || hasLastFrame || isExtension) {
        if (config.resolution !== '720p') {
            config.resolution = '720p'; 
            onProgress('提示：進階模式 (參考圖/延長/起訖幀) 僅支援 720p，已自動調整。');
        }
        
        // Strict AR check for references
        // If references are present, AR MUST be 16:9 or 9:16 or 1:1. 
        // Note: Veo 3.1 actually supports 1:1, but some early versions of the API might have restricted it.
        // We will allow 1:1 here.
        if (hasReferences) {
            // No forced 16:9 anymore if we want to support other ratios in reference mode
            // However, the API might still have some constraints. 
            // We'll keep the logic but allow 1:1 and 9:16 if they are explicitly requested.
        }
    }

    // Capture the FINAL target ratio after all adjustments
    const targetRatio = config.aspectRatio;

    // Run Preflight Check
    try {
        videoGenerationPreflight({ ...params, aspectRatio: targetRatio, resolution: config.resolution });
    } catch (e: any) {
        throw new Error(`Preflight Check Failed: ${e.message}`);
    }

    // --- SMART PRE-PROCESSING: Anti-Squash (防止變形) ---
    // Ensure all input images match the target aspect ratio by adding strict padding (pillarbox/letterbox)
    onProgress(`正在優化影像比例 (${targetRatio}) 以防止變形...`);

    // Helper to process and pad image
    const processImage = async (img: {data: string, mimeType: string}) => {
        return await fitImageToAspectRatio(img, targetRatio);
    };

    // 1. Process Start Image (if exists)
    let processedStartImage = undefined;
    if (params.image) {
        processedStartImage = await processImage(params.image);
    }

    // 2. Process Reference Images (if allowed)
    const referenceImagesPayload: any[] = [];
    
    // If we have references, we should consider if we can also have a start image.
    // The API documentation for referenceImages (Asset Control) does not show a top-level 'image' field.
    // To be safe, if we have references, we will treat the start image as a reference if it's not already there.
    if (hasReferences) {
        // Add start image as a reference if it exists
        if (processedStartImage) {
            referenceImagesPayload.push({
                image: {
                    imageBytes: processedStartImage.data,
                    mimeType: processedStartImage.mimeType,
                },
                referenceType: 'ASSET', 
            });
        }

        // Add other reference images
        if (params.referenceImages && params.referenceImages.length > 0) {
            for (const img of params.referenceImages) {
                const processed = await processImage(img);
                referenceImagesPayload.push({
                    image: {
                        imageBytes: processed.data,
                        mimeType: processed.mimeType,
                    },
                    referenceType: 'ASSET', 
                });
            }
        }

        // Add Face Anchor to refs
        if (params.faceReference) {
            const processedFaceRef = await processImage(params.faceReference);
            referenceImagesPayload.push({
                image: {
                    imageBytes: processedFaceRef.data,
                    mimeType: processedFaceRef.mimeType,
                },
                referenceType: 'ASSET', 
            });
        }
    }

    // 3. Attach Configs
    if (hasReferences && referenceImagesPayload.length > 0) {
        // Double check limitation: Max 3 references
        const safeRefs = referenceImagesPayload.slice(0, 3);
        if (referenceImagesPayload.length > 3) {
            onProgress('提示：參考圖過多，已自動選取前 3 張（含初始圖與臉部錨定）。');
        }
        config.referenceImages = safeRefs;
    }
    
    if (hasLastFrame) {
        // Also process last frame
        const processedLast = await processImage(params.lastFrame);
        config.lastFrame = {
             imageBytes: processedLast.data,
             mimeType: processedLast.mimeType
        };
    }

    const request: any = { model, prompt: params.prompt, config };
    
    // Only pass top-level 'image' if NOT using referenceImages (Asset Control)
    // or if specifically in start-to-end mode which supports it.
    if (processedStartImage && !hasReferences) {
        request.image = { imageBytes: processedStartImage.data, mimeType: processedStartImage.mimeType };
    }
    
    // In start-to-end mode, we MUST pass 'image' as the starting frame
    if (hasLastFrame && processedStartImage) {
        request.image = { imageBytes: processedStartImage.data, mimeType: processedStartImage.mimeType };
    }
    
    if (isExtension) {
        request.video = params.previousVideo;
    }

    onProgress(`正在發送生成請求 (${model} @ ${config.resolution} ${config.aspectRatio})...`);
    
    let operation;
    try {
        // Wrap in withBackoff to handle 429 Resource Exhausted errors
        operation = await withBackoff(async () => {
            return await client.models.generateVideos(request);
        }, (delay) => {
            onProgress(`API 請求繁忙 (429)，將於 ${Math.ceil(delay/1000)} 秒後重試...`);
        });
    } catch (e: any) {
        console.error("Generate Video Request Failed:", e);
        let errorMsg = e.message || '未知錯誤';
        
        if (errorMsg.includes('400') || errorMsg.includes('INVALID_ARGUMENT')) {
             // Fallback suggestion logic if our auto-fix didn't catch it
             if (hasReferences && hasLastFrame) {
                 errorMsg = '參數衝突 (400)：無法同時使用「參考圖/臉部錨定」與「結束畫面」。請嘗試移除其中一項。';
             } else if (hasReferences && config.aspectRatio !== '16:9') {
                 errorMsg = '參數衝突 (400)：參考圖模式強制要求 16:9 比例。';
             } else {
                 errorMsg = '參數組合不被支援 (400)。可能是提示詞過於複雜，或同時使用了互斥的功能（如起訖幀+參考圖）。';
             }
        } else if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
             errorMsg = '目前 API 配額已滿 (429)。請稍後再試，或檢查您的計費方案。';
        }
        throw new Error(`影片請求失敗：${errorMsg}`);
    }

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      try {
          // CORRECTED: use client.operations instead of client.models
          operation = await client.operations.getVideosOperation({operation: operation});
          onProgress('AI 正在渲染影片中 (Rendering)... 這可能需要幾分鐘');
      } catch (e) {
          console.warn("Polling warning:", e);
      }
    }
    
    if (operation.error) {
        console.error("Video Generation Operation Error:", operation.error);
        throw new Error(`影片生成發生錯誤：${operation.error.message || '伺服器回傳錯誤'}`);
    }

    const videoResult = operation.response?.generatedVideos?.[0]?.video;
    const downloadLink = videoResult?.uri;
    
    if (!downloadLink) {
        console.warn("Video generation completed but no URI was returned. This usually indicates a safety filter block.", operation.response);
        throw new Error("影片生成失敗。內容可能未通過 AI 安全審查機制，請嘗試調整商品描述或更換圖片。");
    }
    
    return { videoUrl: downloadLink, operation };
};

export const extractVideoFrames = async (videoUrl: string, type: 'first' | 'last'): Promise<string> => {
    let blobUrl = videoUrl;
    let revoke = false;

    if (videoUrl.startsWith('http')) {
        try {
            // E0: video bytes 一律走 server-side proxy，key 不出 server（見 PAVORA_E_SECURITY_PLAN.md E0）
            const resp = await fetch(`/api/gemini-video?fileUri=${encodeURIComponent(videoUrl)}`);
            if (resp.ok) {
                const blob = await resp.blob();
                blobUrl = URL.createObjectURL(blob);
                revoke = true;
            }
        } catch (e) {
            console.warn("Failed to fetch video for frame extraction", e);
        }
    }

    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = blobUrl;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true; 

        const timeout = setTimeout(() => {
            reject(new Error("影片載入逾時"));
            video.remove();
            if (revoke) URL.revokeObjectURL(blobUrl);
        }, 15000);

        video.onloadedmetadata = () => {
            if (type === 'first') {
                video.currentTime = 0.01; 
            } else {
                video.currentTime = Math.max(0, video.duration - 0.1); 
            }
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                clearTimeout(timeout);
                resolve(dataUrl);
            } else {
                clearTimeout(timeout);
                reject(new Error("畫布建立失敗"));
            }
            video.remove();
            if (revoke) URL.revokeObjectURL(blobUrl);
        };

        video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("無法載入影片進行擷圖"));
            video.remove();
            if (revoke) URL.revokeObjectURL(blobUrl);
        };
    });
};

export const constructDirectorPrompt = (scene: DirectorScene) => {
    return buildDirectorPrompt(scene);
};

export const generateVideoPromptFromImage = async (imageDatas: {data: string, mimeType: string} | {data: string, mimeType: string}[]) => {
    const client = await getGeminiClient(false);
    const images = Array.isArray(imageDatas) ? imageDatas : [imageDatas];
    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...images.map(img => ({inlineData: img})), {text: VIDEO_PROMPT_ANALYSIS}] },
        config: { responseMimeType: 'application/json' }
    });
    const text = response.text || '{}';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
};

export const analyzeImageForDirector = async (imageDatas: {data: string, mimeType: string} | {data: string, mimeType: string}[]) => {
    const client = await getGeminiClient(false);
    const images = Array.isArray(imageDatas) ? imageDatas : [imageDatas];
    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...images.map(img => ({inlineData: img})), {text: IMAGE_VISUAL_ANALYSIS_PROMPT}] },
        config: { responseMimeType: 'application/json' }
    });
    const text = response.text || '{}';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
};

export const generateStoryboardFromScript = async (script: string): Promise<DirectorScene[]> => {
    const client = await getGeminiClient(false);
    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: SCRIPT_TO_STORYBOARD_PROMPT(script),
        config: { responseMimeType: 'application/json' }
    });
    
    const text = response.text || '[]';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const scenesData = JSON.parse(cleanText);
    
    return scenesData.map((s: any, i: number) => ({
        id: `scene-ai-${Date.now()}-${i}`,
        directorStyle: s.directorStyle || 'film',
        lensLanguage: s.lensLanguage || 'standard',
        actionRhythm: s.actionRhythm || 'natural',
        lightingVibe: s.lightingVibe || 'natural',
        compositionFocus: s.compositionFocus || 'rule_of_thirds',
        cameraMovement: s.cameraMovement || 'static',
        subjectAction: s.subjectAction || 'acting',
        customPrompt: s.customPrompt || '',
        generationMode: 'single',
        resolution: '720p',
        aspectRatio: '16:9', // Default to 16:9 for scripts
        prompt: s.prompt || '',
        promptExplanation: s.explanation || '',
    }));
};

export const generateImageAsset = async (
    prompt: string, 
    aspectRatio: string = '16:9',
    primaryImage?: { data: string; mimeType: string },
    references?: { data: string; mimeType: string }[]
): Promise<string> => {
    const client = await getGeminiClient(false);
    
    const parts: any[] = [];
    if (references && references.length > 0) {
        references.forEach(ref => parts.push({ inlineData: ref }));
    }
    if (primaryImage) {
        parts.push({ inlineData: primaryImage });
    }
    const pipelinedPrompt = runPromptPipeline(prompt, { source: 'directorService:generateImageAsset', mode: 'dryrun' }).prompt;
    parts.push({ text: pipelinedPrompt });

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { 
            responseModalities: [Modality.IMAGE],
            imageConfig: { aspectRatio: aspectRatio as any }
        }
    });
    
    const resultPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (resultPart && resultPart.inlineData) {
        return `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
    }
    thr