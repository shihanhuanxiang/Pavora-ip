import { Modality } from "@google/genai";
import { getGeminiClient } from "../../../shared/services/core/geminiClient";
import { imageUrlToimageData } from "../../../shared/utils/imageUtils";
import type { ProgressFn } from "../../../shared/types/types";
import { buildFittingPrompt, buildStylingPlanPrompt, buildIdentityFixPrompt } from "../../../prompts/fittingRoom";

import { imageDB } from "../../../shared/services/imageDB";

/**
 * 獲取圖片的實際長寬比
 */
const getAspectRatioFromUrl = async (url: string): Promise<string> => {
    let finalUrl = url;
    if (url.startsWith('idb://')) {
        const blobUrl = await imageDB.getUrl(url);
        if (blobUrl) finalUrl = blobUrl;
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            if (url.startsWith('idb://') && finalUrl.startsWith('blob:')) {
                URL.revokeObjectURL(finalUrl);
            }
            if (ratio > 1.2) resolve("16:9");
            else if (ratio > 0.8) resolve("1:1");
            else if (ratio > 0.6) resolve("3:4");
            else resolve("9:16");
        };
        img.onerror = () => {
            if (url.startsWith('idb://') && finalUrl.startsWith('blob:')) {
                URL.revokeObjectURL(finalUrl);
            }
            resolve("3:4"); // Fallback
        };
        img.src = finalUrl;
    });
};

/**
 * 根據分類判斷需要「保護」的區域
 * 加強正則表達式，支援包含特定關鍵字的品類名稱
 */
const getProtectionInstruction = (category: string): string => {
    const cat = category.toLowerCase();
    
    // 如果是下身類（包含任何有「褲」或「裙」的名稱）
    if (cat.match(/bottom|pants|shorts|skirt|jeans|leggings|褲|裙|下身/)) {
        return `
        [🛡️ ZONAL PROTECTION - UPPER SECTION]: 
        STRICTLY PRESERVE the pixels of the UPPER SECTION (torso, existing top garment, neck) from Asset 3. 
        DO NOT alter the existing upper attire. Focus changes ONLY on the lower section from waist down.`;
    }
    
    // 如果是上身類（包含任何有「衣」、「衫」、「外套」的名稱）
    if (cat.match(/top|shirt|blouse|tee|jacket|outerwear|blazer|vest|cardigan|衣|衫|外套|夾克|背心|上身/)) {
        return `
        [🛡️ ZONAL PROTECTION - LOWER SECTION]: 
        STRICTLY PRESERVE the pixels of the LOWER SECTION (waist down, existing bottom garment, legs, footwear) from Asset 3. 
        DO NOT alter the existing lower attire. Focus changes ONLY on the upper section.`;
    }

    // 如果是配件類（包包、鞋子、飾品）
    if (cat.match(/bag|shoe|accessory|hat|glass|包|鞋|飾|帽|鏡/)) {
        return `
        [🛡️ FULL BODY PROTECTION]: 
        STRICTLY PRESERVE the model's entire body and existing clothing from Asset 3. 
        ADD the accessory from Asset 2 to the appropriate location (e.g., hand for bag, feet for shoes, head for hat). 
        Ensure natural interaction, shadows, and occlusion with the existing scene.`;
    }

    return "";
};

// Remove Apparel Background using Gemini Vision
export const removeApparelBackground = async (apparelImage: {data: string, mimeType: string}): Promise<{data: string, mimeType: string}> => {
    const client = await getGeminiClient(false); // Use Flash for speed
    const prompt = `
    [TASK: BACKGROUND REMOVAL & ASSET EXTRACTION]
    Extract the garment from the provided image. 
    Output the garment isolated on a clean, solid white background. 
    Maintain all original textures, colors, and details of the garment. 
    Do not include any hangers, mannequins, or background elements.
    `;

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [
            { inlineData: apparelImage },
            { text: prompt }
        ],
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    const resultPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (resultPart && resultPart.inlineData) {
        return {
            data: resultPart.inlineData.data,
            mimeType: resultPart.inlineData.mimeType
        };
    }
    
    return apparelImage; // Fallback to original if failed
};

// Analyze Apparel Features using Gemini Vision
export const analyzeApparel = async (apparelImage: {data: string, mimeType: string}): Promise<string> => {
    const client = await getGeminiClient(false); // Use Flash for analysis
    const prompt = `
    [AI APPAREL ANALYZER - TEXTURE PROTECTION 2.0]
    Analyze the provided apparel image with extreme precision for high-fidelity rendering. 
    Identify and describe the following for pixel-perfect replication:
    1. MATERIAL DNA: (e.g., "Heavyweight 14oz raw denim", "19mm mulberry silk satin", "3-gauge chunky cable knit")
    2. LIGHT INTERACTION: (e.g., "High specular highlights on silk", "Matte light absorption on cotton", "Metallic shimmer on sequins")
    3. MICRO-TEXTURE: (e.g., "Visible twill weave", "Fuzzy mohair surface", "Grainy leather pebble")
    4. PATTERN SCALE: (e.g., "Large scale floral print", "Micro-pinstripe 2mm apart")
    5. CONSTRUCTION: (e.g., "Double-needle topstitching", "Raw distressed edges", "Hidden placket")

    Output a detailed, comma-separated list of these features in English.
    Focus on descriptors that will help an AI image generator maintain the EXACT material feel.
    `;

    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { inlineData: apparelImage },
            { text: prompt }
        ]
    });

    return response.text || "standard apparel";
};

// Apply Apparel
export const applyApparel = async (
    currentImageUrl: string, 
    apparelImage: {data: string, mimeType: string}, 
    category: string, 
    safeMode: boolean, 
    onProgress: ProgressFn, 
    identityRef?: {data: string, mimeType: string},
    config?: { 
        usePro?: boolean; 
        resolution?: '2K'|'4K', 
        isFirstTime?: boolean, 
        skipBgRemoval?: boolean, 
        tuckStatus?: 'tucked' | 'untucked',
        lightingPreset?: string,
        isGhostMode?: boolean,
        customInstruction?: string
    }
): Promise<string> => {
    onProgress('正在進行服飾素材預處理...');
    const processedApparel = config?.skipBgRemoval ? apparelImage : await removeApparelBackground(apparelImage);
    
    onProgress('正在進行 AI 素材分析與特徵提取...');
    const apparelFeatures = await analyzeApparel(processedApparel);
    
    onProgress(config?.isFirstTime ? '正在清理原始衣物區域...' : '正在融合穿搭設計...');
    
    // 預先轉換數據，若失敗即拋出錯誤
    let currentCanvasData;
    try {
        currentCanvasData = await imageUrlToimageData(currentImageUrl);
    } catch (e) {
        throw new Error("無法讀取畫布數據，請重置後再試。");
    }

    const targetRatio = await getAspectRatioFromUrl(currentImageUrl);
    const usePro = config?.usePro || false;
    
    const parts: any[] = [];
    
    // 0. 提示詞 (Prompt) - 放在最前面，讓模型優先理解指令
    let prompt = buildFittingPrompt(category);
    
    // Add custom instruction if provided
    if (config?.customInstruction) {
        prompt += `\n\n${config.customInstruction}`;
    }

    // Add protection instructions
    const protection = getProtectionInstruction(category);
    if (protection) {
        prompt += `\n\n${protection}`;
    }

    if (config?.tuckStatus) {
        prompt += `\n\n[STYLING - TUCK STATUS]: 
        The top garment should be ${config.tuckStatus === 'tucked' ? 'STRICTLY TUCKED into the bottom garment (pants/skirt)' : 'LEFT UNTUCKED, hanging naturally over the bottom garment'}. 
        Ensure a clean and realistic waistline transition.`;
    }

    if (config?.lightingPreset && config.lightingPreset !== 'original') {
        const lightingMap: Record<string, string> = {
            'studio': 'Professional studio lighting with soft shadows and neutral color temperature.',
            'sunlight': 'Warm afternoon sunlight with long, soft shadows and golden hour glow.',
            'cinematic': 'Cinematic lighting with high contrast, dramatic shadows, and teal-orange color grading.',
            'neon': 'Urban neon lighting with vibrant pink and blue highlights and deep, colorful shadows.'
        };
        prompt += `\n\n[ENVIRONMENTAL LIGHTING]: 
        Apply the following lighting style to the entire scene: ${lightingMap[config.lightingPreset] || config.lightingPreset}. 
        Ensure the garment's highlights and shadows match this lighting perfectly.`;
    }

    if (config?.isGhostMode) {
        prompt += `\n\n[GHOST MANNEQUIN MODE]: 
        STRICTLY REMOVE the model's body, skin, and head. 
        The final output should ONLY show the garments as if they are being worn by an invisible person. 
        Maintain the 3D volume and shape of the garments. Output on a clean, solid white background.`;
    }
    
    // Add specific garment features (sanitized)
    const sanitizedFeatures = apparelFeatures
        .replace(/sheer|transparent|see-through|nude|skin|body|sexy|hot|revealing/gi, "fashionable")
        .replace(/leather/gi, "premium material");

    prompt += `\n\nSpecific Garment Details:
The garment from Asset 2 has these key features to replicate:
${sanitizedFeatures}
Please ensure these details are clearly visible in the final result.`;

    if (config?.isFirstTime) {
        prompt += `\n\nInitial Application:
Transfer the design from Asset 2 onto the model in Asset 3. Ensure a natural fit and professional presentation.`;
    } else {
        prompt += `\n\nLayer Update:
Update the existing ${category} in Asset 3 with the new design from Asset 2. Maintain all other scene elements.`;
    }

    // Natural language instructions
    prompt += `\n\nNote: Maintain the model's appearance and the scene's composition. 
    IMPORTANT: Maintain the EXACT framing of Asset 3. If Asset 3 is a full-body shot, the output MUST also be a full-body shot. Do not crop. Ensure the entire subject is visible within the frame.`;

    parts.push({ text: prompt });
    
    // 1. 身份參考 (Identity Anchor) - 優先使用臉部錨點，否則使用目前影像
    parts.push({ inlineData: identityRef || currentCanvasData });
    
    // 2. 服飾素材影像 (New Garment)
    parts.push({ inlineData: processedApparel });
    
    // 3. 模特兒原始影像 (Current Canvas / Base)
    parts.push({ inlineData: currentCanvasData });

    const client = await getGeminiClient(usePro);
    const modelName = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const finalGenConfig: any = {
        responseModalities: [Modality.IMAGE],
        temperature: 0.1, // 降低隨機性，提高穩定性
        topP: 0.95,
        imageConfig: {
            aspectRatio: targetRatio,
            ...(usePro ? { imageSize: config?.resolution === '4K' ? '4K' : '2K' } : {})
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH' }
        ]
    };

    try {
        const response = await client.models.generateContent({
            model: modelName,
            contents: { parts },
            config: finalGenConfig
        });

        // 檢查是否有候選內容
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("SAFETY_BLOCK");
        }

        const candidate = response.candidates[0];
        
        // 檢查完成原因
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`SAFETY_BLOCK_${candidate.finishReason}`);
        }

        const resultPart = candidate.content?.parts?.find(p => p.inlineData);
        if (resultPart && resultPart.inlineData) {
            return `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
        }
        
        throw new Error("NO_IMAGE_DATA");
    } catch (err: any) {
        // 如果是安全過濾攔截，嘗試使用極簡化提示詞重試一次
        const isSafetyError = err.message?.includes("SAFETY_BLOCK") || 
                             err.message?.includes("IMAGE_OTHER") || 
                             err.message?.includes("IMAGE_SAFETY");

        if (isSafetyError) {
            console.warn("VTO: First attempt blocked by safety filters. Retrying with simplified prompt...");
            
            const retryPrompt = `Fashion catalog production: Transfer garment from Asset 2 to model in Asset 3. Maintain model characteristics from Asset 1. High-end studio photography.`;
            const retryParts = [
                { text: retryPrompt },
                { inlineData: identityRef || currentCanvasData },
                { inlineData: processedApparel },
                { inlineData: currentCanvasData }
            ];

            try {
                const retryResponse = await client.models.generateContent({
                    model: modelName,
                    contents: { parts: retryParts },
                    config: finalGenConfig
                });

                if (retryResponse.candidates && retryResponse.candidates.length > 0) {
                    const retryCandidate = retryResponse.candidates[0];
                    const retryResultPart = retryCandidate.content?.parts?.find(p => p.inlineData);
                    if (retryResultPart && retryResultPart.inlineData) {
                        return `data:${retryResultPart.inlineData.mimeType};base64,${retryResultPart.inlineData.data}`;
                    }
                }
            } catch (retryErr) {
                console.error("VTO: Retry also failed:", retryErr);
            }
        }
        
        // 如果重試也失敗，或者不是安全錯誤，拋出友善的錯誤訊息
        if (err.message?.includes("SAFETY_BLOCK_IMAGE_OTHER") || err.message?.includes("IMAGE_OTHER")) {
            throw new Error("生成中斷，原因：IMAGE_OTHER (AI 安全過濾器觸發)。請嘗試更換服飾圖片或模特兒姿勢。");
        }
        if (err.message?.includes("SAFETY_BLOCK_IMAGE_SAFETY") || err.message?.includes("IMAGE_SAFETY")) {
            throw new Error("生成中斷，原因：IMAGE_SAFETY (內容可能違反安全政策)。請確保上傳的圖片符合規範。");
        }
        
        throw err;
    }
};

// Restore Identity (Face & Hair Alignment)
export const restoreIdentity = async (
    currentImageUrl: string,
    faceAnchorData: {data: string, mimeType: string},
    onProgress: ProgressFn,
    usePro: boolean = false
): Promise<string> => {
    onProgress(usePro ? '正在執行 Pro 級別身份精密重塑...' : '正在執行標準身份對齊...');
    
    const currentCanvasData = await imageUrlToimageData(currentImageUrl);
    const targetRatio = await getAspectRatioFromUrl(currentImageUrl);
    
    let fixPrompt = buildIdentityFixPrompt();
    
    if (usePro) {
        fixPrompt += `\n[💎 PRO_PRECISION_OVERRIDE]:
        - Perform high-fidelity alignment of visual characteristics from Asset 1.
        - Restore specific features and textures with 100% fidelity.
        - Ensure micro-texture and appearance consistency match Asset 1.
        - Re-render the hair characteristics and color tone to be an EXACT copy of Asset 1.
        - Treat the background and garment in Asset 2 as protected layers; DO NOT alter them.
        - Output resolution must be extremely high with clean edges.`;
    }

    const parts: any[] = [
        { inlineData: faceAnchorData }, 
        { inlineData: currentCanvasData }, 
        { text: fixPrompt }
    ];

    const client = await getGeminiClient(usePro);
    const modelName = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const config: any = {
        responseModalities: [Modality.IMAGE],
        temperature: 0.02,
        imageConfig: { 
            aspectRatio: targetRatio,
            ...(usePro ? { imageSize: "2K" } : {})
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH' }
        ]
    };

    const response = await client.models.generateContent({
        model: modelName,
        contents: { parts },
        config: config
    });

    const resultPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (resultPart && resultPart.inlineData) {
        return `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
    }
    throw new Error("身份修復失敗，可能觸發安全過濾或連線中斷。");
};

// Refine Garment Details (Super-Resolution & Texture Enhancement)
export const refineGarmentDetails = async (
    currentImageUrl: string,
    apparelImage: {data: string, mimeType: string},
    onProgress: ProgressFn,
    usePro: boolean = true
): Promise<string> => {
    onProgress('正在執行服飾細節增強與紋理修復...');
    
    const currentCanvasData = await imageUrlToimageData(currentImageUrl);
    const targetRatio = await getAspectRatioFromUrl(currentImageUrl);
    
    const prompt = `
    [TASK: HIGH-FIDELITY TEXTURE REFINEMENT]
    You are a professional fashion retoucher. 
    Analyze the garment in Asset 2 and the model in Asset 3. 
    Your goal is to enhance the textures, patterns, and construction details of the garment on the model.
    
    ### Requirements:
    1. **Texture Enhancement**: Sharpen the fabric weave, embroidery, or print details from Asset 2 onto the model's garment in Asset 3.
    2. **Edge Refinement**: Clean up the edges where the garment meets the model's body or background.
    3. **Lighting Consistency**: Ensure the highlights and shadows on the refined textures match the scene lighting in Asset 3.
    4. **Preservation**: Do NOT change the model's identity, pose, or background.
    
    Output the refined image with extremely high detail and professional studio quality.
    `.trim();

    const parts: any[] = [
        { text: prompt },
        { inlineData: apparelImage },
        { inlineData: currentCanvasData }
    ];

    const client = await getGeminiClient(usePro);
    const modelName = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const config: any = {
        responseModalities: [Modality.IMAGE],
        temperature: 0.05,
        imageConfig: { 
            aspectRatio: targetRatio,
            imageSize: "4K" // Always use high res for refinement
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH' }
        ]
    };

    const response = await client.models.generateContent({
        model: modelName,
        contents: { parts },
        config: config
    });

    const resultPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (resultPart && resultPart.inlineData) {
        return `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
    }
    
    throw new Error("細節增強失敗，可能觸發安全過濾或連線中斷。");
};

// Apply Multi-Angle Matrix
export const applyMultiAngleMatrix = async (
    matrix: {
        angleId: string;
        modelImage: { url: string; fileData: { data: string; mimeType: string } };
        apparelImage: { data: string; mimeType: string } | null;
    }[],
    category: string,
    onProgress: (angleId: string, msg: string) => void,
    config?: { usePro?: boolean; resolution?: '2K'|'4K' }
): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};
    
    const tasks = matrix.map(item => async () => {
        const { angleId, modelImage, apparelImage } = item;
        
        // If no apparel for this angle, we might use the front apparel as fallback or skip
        // For now, if no apparel provided for specific angle, we skip or use a default if available
        if (!apparelImage) return;

        onProgress(angleId, `正在生成 ${angleId} 角度...`);

        // Custom prompt enhancement for weights
        let weightInstruction = "";
        if (angleId === 'side' || angleId === 'angle' || angleId === 'back') {
            weightInstruction = `
            [🔥 HIGH WEIGHT ANGLE]: This is a ${angleId} view. 
            STRICTLY FOCUS on the garment's silhouette, ${angleId === 'back' ? 'rear details (back of the garment)' : 'side profile'}, and structural drape from Asset 2. 
            Ensure the transition between different views of the garment is seamless and matches the 3D structure of the model.`;
        }

        // We can call applyApparel but we need to inject the weightInstruction
        // Or we can duplicate the logic here for more control
        const result = await applyApparel(
            modelImage.url,
            apparelImage,
            category,
            true, // safeMode
            (msg) => onProgress(angleId, msg),
            undefined, // identityRef
            {
                ...config,
                skipBgRemoval: false,
                isFirstTime: true,
                customInstruction: weightInstruction
            }
        );
        
        results[angleId] = result;
    });

    // Execute in parallel
    await Promise.all(tasks.map(t => t()));
    
    return results;
};

// Styling Plan
export const getStylingPlan = async (params: { stylingNote: string, preferredIntensity: string }) => {
    const prompt = buildStylingPlanPrompt(params.stylingNote, params.preferredIntensity);
    const client = await getGeminiClient(false);
    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};