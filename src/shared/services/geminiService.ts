
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { getFriendlyErrorMessage, fileToBase64, imageUrlToimageData } from "../utils/imageUtils";
import { EGEN_ANALYSIS_PROMPT, EGEN_STYLE_DEF_PROMPT, EGEN_COPYWRITING_PROMPT } from "../../prompts/eGen";
import { REELS_VIDEO_PROMPT, SOCIAL_COPY_PROMPT, CAMPAIGN_STRATEGY_PROMPT } from "../../prompts/marketing";
import { SCENE_ANALYSIS_PROMPT, buildSceneCompositionPrompt, DETAIL_TUNE_PROMPT } from "../../prompts/scene";
import { getGeminiClient, confirmPaidFeature, ensureAuthorized, getImagenUsage } from "./core/geminiClient";
import { buildApparelBasePrompt, PACKSHOT_SUFFIX, MODEL_FRONT_SUFFIX, MODEL_BACK_SUFFIX, ANALYZE_APPAREL_PROMPT } from "../../prompts/apparel";
import { buildSalonPrompt, STYLE_ANALYSIS_PROMPT, STYLIST_FEEDBACK_PROMPT } from "../../prompts/hair";
import { PCPE_DIAGNOSIS_PROMPT, PCPE_CARDS_PROMPT, PCPE_OPTIONS_PROMPT, buildPCPEPosterPrompt } from "../../prompts/pcpe";
import { buildOptimizationPrompt, REALISM_ANALYSIS_PROMPT } from "../../prompts/optimization";
import { PROMPT_ANALYSIS_PROMPT, ASSET_IDENTIFICATION_PROMPT, ASSET_EXTRACTION_IMAGE_PROMPT, HEAD_PORTRAIT_PROMPT } from "../../prompts/deconstruction";
import { CINEMATIC_ANALYSIS_PROMPT } from "../../prompts/cinematic";
import { MACRO_ANALYSIS_PROMPT, buildMacroCraftPrompt } from "../../prompts/macroCraft";
import { buildStyleAnchorPrompt } from "../../prompts/styleAnchor";
import { buildPromptV8 } from "../../prompts/fantasy";

import { 
    generateVideo, 
    extractVideoFrames, 
    constructDirectorPrompt, 
    generateVideoPromptFromImage, 
    analyzeImageForDirector,
    generateStoryboardFromScript, 
    generateImageAsset
} from "../../modules/directorMode/services/directorService";

export { 
    getFriendlyErrorMessage, 
    fileToBase64, 
    imageUrlToimageData, 
    confirmPaidFeature,
    generateVideo,
    extractVideoFrames,
    constructDirectorPrompt,
    generateVideoPromptFromImage,
    analyzeImageForDirector,
    generateStoryboardFromScript,
    generateImageAsset,
    buildPromptV8,
    getImagenUsage
};

const cleanJsonString = (str: string): string => {
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  const firstBracket = str.indexOf('[');
  const lastBracket = str.lastIndexOf(']');

  const starts = [firstBrace, firstBracket].filter(i => i !== -1);
  const ends = [lastBrace, lastBracket].filter(i => i !== -1);

  if (starts.length > 0 && ends.length > 0) {
    const start = Math.min(...starts);
    const end = Math.max(...ends);
    return str.substring(start, end + 1);
  }
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * 智能分析精品屬性 (用於 Luxury Visual 模組)
 * 強化了品類與材質的判斷邏輯
 */
export const analyzeLuxuryProduct = async (imageDatas: { data: string, mimeType: string } | { data: string, mimeType: string }[], views?: string[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const images = Array.isArray(imageDatas) ? imageDatas : [imageDatas];
    const viewLabels = views ? views.map((v, i) => `Image ${i}: ${v}`).join(', ') : 'Not provided';
    
    const prompt = `Analyze these luxury product images (potentially different angles of the same product) for high-end advertisement rendering. 
    
    [USER PROVIDED LABELS]: ${viewLabels}
    
    [CORE TASK]: Identify the exact physical characteristics to prevent category errors during generation.
    
    1. Category: Identify the product type strictly. 
       - If it is a shoe/sneaker/heel, return 'clothing' (subcategory shoes).
       - If it is a backpack/handbag/clutch, return 'bag'.
       - Options: 'clothing', 'bag', 'perfume', 'jewelry', 'beauty', 'watch'.
    2. Material: Detect surface texture (e.g., 'pebbled leather', 'polished glass', 'suede', 'brushed metal').
    3. Colors: Precise color palette for [COLOR LOCK].
    4. Brand: Detect any visible logos or text.
    5. Best Front View: Identify which image index (0 to ${images.length - 1}) provides the clearest, most iconic FRONT view of the product. Use the user-provided labels if available to help identify the front view.
    
    Return ONLY a valid JSON object in Traditional Chinese (繁體中文):
    {
      "category": "string (must be one of the options above)",
      "material": "string",
      "colors": "string",
      "brand": "string",
      "best_front_view_index": number
    }`;

    const parts = images.map(img => ({ inlineData: img }));
    parts.push({ text: prompt } as any);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });
    
    try {
        return JSON.parse(cleanJsonString(response.text || '{}'));
    } catch (e) {
        throw new Error("影像分析結果格式錯誤");
    }
};

/**
 * 生成社群媒體行銷文案 (Instagram/TikTok/Facebook)
 */
export const generateSocialCopy = async (analysisJson: string, platform: 'Instagram' | 'TikTok' | 'Facebook') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const analysis = JSON.parse(analysisJson);
    const prompt = SOCIAL_COPY_PROMPT(analysis, platform);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
    });
    return response.text || "";
};

/**
 * 生成 3 日行銷活動策略
 */
export const generateCampaignStrategy = async (analysisJson: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const analysis = JSON.parse(analysisJson);
    const prompt = CAMPAIGN_STRATEGY_PROMPT(analysis);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    try {
        return JSON.parse(cleanJsonString(response.text || '{}'));
    } catch (e) {
        throw new Error("行銷策略格式錯誤");
    }
};

/**
 * AI 自動去背服務
 * 使用 Gemini 影像生成能力將主體提取並置於純白背景，便於後續合成
 */
export const removeBackground = async (imageData: { data: string, mimeType: string }, onProgress?: (msg: string) => void) => {
    const prompt = "Extract the main product/subject from this image and place it on a clean, solid white background. Remove all shadows, reflections, and existing background elements. Ensure the subject's edges are sharp and clean. [OUTPUT]: Only the subject on pure white #FFFFFF.";
    return transformImage(imageData, prompt, [], onProgress, { usePro: false });
};

export const cleanupSubject = removeBackground;

/**
 * 通用圖像生成服務
 */
export const transformImage = async (
    primaryImageData: { data: string; mimeType: string } | { data: string; mimeType: string }[],
    prompt: string,
    references: { data: string; mimeType: string }[] = [],
    onProgress?: (msg: string) => void,
    config: any = {}
) => {
    const usePro = config.usePro || false;
    await ensureAuthorized(usePro);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = usePro ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
    
    if (onProgress) onProgress("正在調度 AI 算力渲染影像...");

    const parts: any[] = references.map(ref => ({ inlineData: ref }));
    
    if (Array.isArray(primaryImageData)) {
        primaryImageData.forEach(img => parts.push({ inlineData: img }));
    } else {
        parts.push({ inlineData: primaryImageData });
    }
    
    // 強化 Pro 模式的提示詞品質，優先考慮還原度與細節紋理
    const qualityPrompt = usePro 
        ? `[PRO_FIDELITY_MODE]: Ultra-high fidelity reconstruction, 8K micro-texture details, professional metallic reflections, realistic skin pores, professional color accuracy, 100% identity preservation. Focus on realistic skin pores and fabric weave. ${prompt}`
        : prompt;

    parts.push({ text: qualityPrompt });

    const genConfig: any = { 
        imageConfig: {}
    };

    if (!config.isTextOnly) {
        genConfig.responseModalities = [Modality.IMAGE];
    }

    // Mapping resolution/imageSize correctly
    if (config.imageConfig) {
        if (config.imageConfig.aspectRatio && config.imageConfig.aspectRatio !== 'original') {
            genConfig.imageConfig.aspectRatio = config.imageConfig.aspectRatio;
        }
        if (config.imageConfig.imageSize) {
            genConfig.imageConfig.imageSize = config.imageConfig.imageSize;
        }
        if (config.imageConfig.seed !== undefined) {
            genConfig.imageConfig.seed = config.imageConfig.seed;
        }
    }

    // Handle top-level resolution property from SceneGeneration
    if (config.resolution && !genConfig.imageConfig.imageSize) {
        genConfig.imageConfig.imageSize = config.resolution;
    }

    if (usePro && !genConfig.imageConfig.imageSize) {
        genConfig.imageConfig.imageSize = "1K";
    }

    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: genConfig
    }) as GenerateContentResponse;

    for (const candidate of response.candidates || []) {
        let refusalText = "";
        for (const part of candidate.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            if (part.text) {
                if (config.isTextOnly) return part.text;
                refusalText = part.text;
            }
        }
        if (refusalText) {
            console.warn("AI 拒絕生成內容:", refusalText);
            throw new Error(`AI 安全過濾攔截：${refusalText}`);
        }
    }
    
    throw new Error("模型未回傳影像資料，可能觸發了安全過濾。");
};

// ...其餘代碼保持不變...
export const analyzeSceneAndSubject = async (personData: any, bgData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: personData }, { inlineData: bgData }, { text: SCENE_ANALYSIS_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    try {
        return JSON.parse(cleanJsonString(response.text || '{}'));
    } catch (e) {
        return { analysis: { spatial: { horizon_y: 650, suggested_scale: "Full body" } } };
    }
};

export const generateScene = async (personData: any | { label: string; fileData: any }[], bgData: any | null, options: any, config: any, onProgress: any, identityRef?: any) => {
    const hasBgImage = !!bgData;
    let spatialData = null;
    
    const isMultiAngle = Array.isArray(personData) && personData.length > 0 && typeof personData[0] === 'object' && 'label' in personData[0];
    const primaryPerson = isMultiAngle 
        ? (personData.find((p: any) => p.label.includes('正面') || p.label.toLowerCase().includes('front'))?.fileData || personData[0].fileData)
        : (Array.isArray(personData) ? personData[0] : personData);

    if (hasBgImage) {
        onProgress("正在進行空間透視與消失點分析...");
        try {
            const analysis = await analyzeSceneAndSubject(primaryPerson, bgData);
            spatialData = analysis.analysis?.spatial;
        } catch (e) {
            console.warn("Spatial analysis failed, using defaults");
        }
    }
    onProgress(hasBgImage ? "正在進行物理材質匹配與光影融合..." : "正在根據描述生成新環境...");
    
    const multiAngleData = isMultiAngle ? personData.map((p: any) => p.label) : (Array.isArray(personData) && personData.length > 1);

    const prompt = buildSceneCompositionPrompt(
        options.poseExpression.customPoseText || options.poseExpression.posePreset, 
        options.poseExpression.customExpressionText || options.poseExpression.expressionPreset,
        options.physics,
        options.backgroundPreset, 
        hasBgImage,
        options.backgroundSupplement,
        options.gender,
        spatialData,
        options.framing,
        options.poseExpression.supermodelPose,
        options.poseExpression.poseIntensity,
        options.physics.lightHardness,
        options.physics.colorTemperature,
        options.physics.lensFocalLength,
        options.physics.dofIntensity,
        options.fantasyRace,
        options.fantasyJob,
        options.battleDamage,
        options.companion,
        multiAngleData,
        config.imageConfig?.seed
    );
    const refs = [];
    if (hasBgImage) refs.push(bgData);
    if (identityRef) refs.push(identityRef);
    
    if (isMultiAngle) {
        personData.forEach((p: any) => refs.push(p.fileData));
    } else if (Array.isArray(personData)) {
        // Add all angles as references
        personData.forEach(p => refs.push(p));
    } else {
        refs.push(personData);
    }

    return await transformImage(primaryPerson, prompt, refs, onProgress, config);
};

export const generateBurstImages = async (baseImageData: any, pairs: any[], lock: number, onProgress: any, faceRef: any, onStep: (idx: number, url: string) => void, config: any) => {
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const prompt = `Generate a portrait with pose: ${pair.pose} and expression: ${pair.expression}. Identity lock level: ${lock}.`;
        const refs = faceRef ? [faceRef] : [];
        try {
            const url = await transformImage(baseImageData, prompt, refs, onProgress, config);
            onStep(i, url);
        } catch (e) {
            console.error(`Burst generation failed for cell ${i}`, e);
            onStep(i, '');
        }
    }
};

export const getAISmartLayout = async (images: any[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...images.map(img => ({ inlineData: img })), { text: "Suggest layout templateId, themeColor (hex), fontTheme (CSS font-family) for a model composite card based on these images." }] },
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    templateId: { type: Type.STRING },
                    themeColor: { type: Type.STRING },
                    fontTheme: { type: Type.STRING }
                },
                required: ['templateId', 'themeColor', 'fontTheme']
            }
        }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const generateApparelDesignSequence = async (params: any, config: any, onProgress: any) => {
    const basePrompt = buildApparelBasePrompt(params);
    const refs = params.faceReferences || [];
    
    const generateOne = async (suffix: string, faceRefs: any[]) => {
        const prompt = `${basePrompt} ${suffix}`;
        const finalRefs = [...faceRefs];
        if (params.referenceImage && params.referenceImage.data) {
            return await transformImage(params.referenceImage, prompt, finalRefs, onProgress, config);
        } else {
            // Text-to-image case
            const usePro = config.usePro || false;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = usePro ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
            
            if (onProgress) onProgress("正在調度 AI 算力渲染影像...");
            
            const parts: any[] = finalRefs.map(ref => ({ inlineData: ref }));
            parts.push({ text: prompt });
            
            const genConfig: any = { 
                responseModalities: [Modality.IMAGE],
                imageConfig: {
                    aspectRatio: config.imageConfig?.aspectRatio || "1:1"
                }
            };
            if (usePro) genConfig.imageConfig.imageSize = config.imageConfig?.imageSize || "1K";
            
            const response = await ai.models.generateContent({
                model,
                contents: { parts },
                config: genConfig
            }) as GenerateContentResponse;
            
            for (const candidate of response.candidates || []) {
                for (const part of candidate.content?.parts || []) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            throw new Error("模型未回傳影像資料");
        }
    };

    const tasks = [
        () => generateOne(PACKSHOT_SUFFIX, []),
        () => generateOne(MODEL_FRONT_SUFFIX, refs),
        () => generateOne(MODEL_BACK_SUFFIX, refs),
    ];
    return await Promise.all(tasks.map(t => t()));
};

export const getFashionTrends = async (query: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
        .filter((c: any) => c.web)
        .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
    return { text: response.text || '', sources };
};

export const transformHairAndMakeup = async (baseData: any, identityRef: any, prompt: string, config: any, onProgress: any, refImage?: any) => {
    const refs = [identityRef];
    if (refImage) refs.push(refImage);
    
    // Performance Optimization: Add a hint for local transformation
    const optimizedPrompt = `[LOCAL_EDIT_MODE] ${prompt}`;
    
    return await transformImage(baseData, optimizedPrompt, refs, onProgress, config);
};

export const getAIStyleAnalysis = async (imageData: any, gender: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: imageData }, { text: STYLE_ANALYSIS_PROMPT(gender) }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const getStylistFeedback = async (imageData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: imageData }, { text: STYLIST_FEEDBACK_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const extractAssetsFromImage = async (imageData: any, options: any, onProgress: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (onProgress) onProgress("正在識別圖片中的時尚元素...");
    const idResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: imageData }, { text: ASSET_IDENTIFICATION_PROMPT(options.target || 'all fashion items') }] },
        config: { responseMimeType: 'application/json' }
    });
    const items = JSON.parse(cleanJsonString(idResponse.text || '[]'));
    if (onProgress) onProgress(`正在提取 ${items.length} 個素材...`);
    const extractedAssets = await Promise.all(items.map(async (item: any) => {
        let prompt;
        if (item.category === 'head' && options.portraitHead) {
            prompt = HEAD_PORTRAIT_PROMPT(item.description);
        } else {
            prompt = ASSET_EXTRACTION_IMAGE_PROMPT(item.name, item.description);
        }
        const url = await transformImage(imageData, prompt, [], undefined, { usePro: options.usePro });
        return { ...item, pngTransparentUrl: url };
    }));
    return { assets: extractedAssets, notes: {}, spriteUrl: null };
};

export const tuneImageDetail = async (baseData: any, maskData: any, instruction: string, refImages: any[], onProgress: any, config: any = {}) => {
    if (onProgress) onProgress("正在執行局部重繪...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = DETAIL_TUNE_PROMPT(instruction);
    
    // 強化局部重繪的品質提示詞
    const qualityPrompt = config.usePro 
        ? `[PRECISION_REPAINT_MODE]: Maintain extreme texture consistency, seamless blending, high-fidelity reconstruction. ${prompt}`
        : prompt;

    const parts = [{ inlineData: baseData }, { inlineData: maskData }, ...refImages.map(img => ({ inlineData: img })), { text: qualityPrompt }];
    
    const genConfig: any = { 
        responseModalities: [Modality.IMAGE],
        imageConfig: {}
    };

    if (config.usePro) {
        genConfig.imageConfig.imageSize = config.resolution || "1K";
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: genConfig
    });
    const resultPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (resultPart && resultPart.inlineData) {
        return `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
    }
    throw new Error("微調失敗");
};

export const analyzeApparelItem = async (imageData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: imageData }, { text: ANALYZE_APPAREL_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const optimizeAndReangleImage = async (imageData: any, params: any, onProgress: any) => {
    if (onProgress) onProgress("正在進行影像重塑與質感優化...");
    const prompt = buildOptimizationPrompt(params);
    
    const imageConfig: any = {};
    if (params.aspectRatio && params.aspectRatio !== 'original') {
        imageConfig.aspectRatio = params.aspectRatio;
    }
    if (params.resolution === '2K') imageConfig.imageSize = '2K';
    if (params.resolution === '4K') imageConfig.imageSize = '4K';

    return await transformImage(imageData, prompt, [], onProgress, { 
        usePro: true,
        imageConfig
    });
};

export const getRealismAnalysis = async (imageData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: imageData }, { text: REALISM_ANALYSIS_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const analyzeImageForPrompt = async (imageData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: imageData }, { text: PROMPT_ANALYSIS_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const getAIDiagnosis = async (subjectImages: any | any[], isModel: boolean) => {
    const images = Array.isArray(subjectImages) ? subjectImages : [subjectImages];
    const imageParts = await Promise.all(images.map(async (img) => {
        if (typeof img === 'object' && 'data' in img && 'mimeType' in img) {
            return { inlineData: img };
        } else {
            const data = await fileToBase64(img);
            return { inlineData: data };
        }
    }));

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { 
            parts: [
                ...imageParts, 
                { text: `Analyze these images (potentially different angles of the same ${isModel ? 'person' : 'product'}) for high-end advertisement rendering. ${PCPE_DIAGNOSIS_PROMPT(isModel)}` }
            ] 
        },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const getBackgroundCards = async (diagnosis: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: PCPE_CARDS_PROMPT(JSON.stringify(diagnosis)),
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '[]'));
};

export const getAllControlOptions = async (diagnosis: any, card: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: PCPE_OPTIONS_PROMPT(JSON.stringify(diagnosis), JSON.stringify(card)),
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const generateProductPoster = async (
    form: any, 
    diagnosis: any, 
    card: any, 
    overrides: any, 
    onProgress: any, 
    faceAnchor?: any,
    colorLock?: string,
    subjectDataOverride?: any
) => {
    let subjectData = subjectDataOverride;
    if (!subjectData && form.subjectImage) {
        if (typeof form.subjectImage === 'object' && 'data' in form.subjectImage && 'mimeType' in form.subjectImage) {
            subjectData = form.subjectImage;
        } else {
            subjectData = await fileToBase64(form.subjectImage);
        }
    }

    if (!subjectData) throw new Error("Missing subject image data");

    const prompt = buildPCPEPosterPrompt(overrides, form.ratio, form.quality, colorLock);
    const refs = faceAnchor ? [faceAnchor] : [];
    const url = await transformImage(subjectData, prompt, refs, onProgress, { usePro: form.quality === 'high', imageConfig: { aspectRatio: form.ratio } });
    return { url };
};

export const analyzeEGenProduct = async (images: any[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...images.map(img => ({ inlineData: img })), { text: EGEN_ANALYSIS_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const defineEGenStyle = async (analysisJson: string, atmosphere: string = 'default') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = atmosphere !== 'default' 
        ? `${EGEN_STYLE_DEF_PROMPT(analysisJson)}\n\n[USER PREFERENCE]: Force the visual atmosphere to be: ${atmosphere}.`
        : EGEN_STYLE_DEF_PROMPT(analysisJson);

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const generateEGenCopy = async (analysisJson: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: EGEN_COPYWRITING_PROMPT(analysisJson),
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const processFashionItem = async (
    item: any, 
    onProgress: any, 
    resolution: string, 
    lightingContext?: { direction: string; temperature: string },
    styleRef?: { data: string; mimeType: string }
) => {
    if (onProgress) onProgress(`正在融合影像：${item.name}...`);
    
    const lightingNote = lightingContext 
        ? `Match lighting direction: ${lightingContext.direction}. Synchronize color temperature to ${lightingContext.temperature}. Add subtle contact shadows at the base of the object to ground it.` 
        : "Add subtle contact shadows to ground the object.";
    const styleNote = styleRef ? "Match the photographic style, film grain, contrast, and color grading of the provided reference image. Ensure the item looks like it was shot in the same session." : "";
    
    const cleanPrompt = `${CLEAN_SHOT_PROMPT} ${lightingNote} ${styleNote} Ensure clean edges and professional studio quality.`;
    const macroPrompt = `${MACRO_SHOT_PROMPT} ${styleNote} Focus on texture and material detail.`;
    
    const refs = styleRef ? [styleRef] : [];
    
    const cleanUrl = await transformImage(item.fileData, cleanPrompt, refs, undefined, { usePro: resolution !== 'HD' });
    const macroUrl = await transformImage(item.fileData, macroPrompt, refs, undefined, { usePro: resolution !== 'HD' });
    return { ...item, processedUrl: cleanUrl, macroUrl: macroUrl };
};

export const refineFullBody = async (
    imageData: any, 
    notes: string, 
    onProgress: any, 
    resolution: string,
    styleRef?: { data: string; mimeType: string }
) => {
    if (onProgress) onProgress("正在優化全身影像品質與風格同步...");
    const styleNote = styleRef ? "Match the photographic style, grain, and color grading of the provided reference image." : "";
    const prompt = `${REFINE_BODY_PROMPT(notes)} ${styleNote}`;
    const refs = styleRef ? [styleRef] : [];
    return await transformImage(imageData, prompt, refs, onProgress, { usePro: resolution !== 'HD' });
};

export const analyzeFashionLayout = async (personData: any, itemDataList: any[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts = [{ inlineData: personData }, ...itemDataList.map(i => ({ inlineData: i })), { text: LAYOUT_ANALYSIS_PROMPT }];
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const analyzeCinematicShot = async (fileData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: fileData }, { text: CINEMATIC_ANALYSIS_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const analyzeMacroProduct = async (fileData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: fileData }, { text: MACRO_ANALYSIS_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

export const generateMacroCraftScene = async (fileData: any, params: any, analysis: any, onProgress: any) => {
    const prompt = buildMacroCraftPrompt(params, analysis);
    return await transformImage(fileData, prompt, [], onProgress, { usePro: params.quality === 'high' });
};

export const generateStyleAnchorImage = async (params: any, onProgress: any) => {
    const prompt = buildStyleAnchorPrompt(params);
    const refs = [];
    if (params.identityImage) refs.push(params.identityImage);
    if (params.outfitImage) refs.push(params.outfitImage);
    return await transformImage(params.identityImage || {data:'', mimeType:'image/jpeg'}, prompt, refs, onProgress, { usePro: params.quality === 'high', imageConfig: { aspectRatio: params.ratio } });
};

import { STORYBOARD_ANALYSIS_PROMPT } from "../../prompts/character";

export const analyzeStoryboard = async (imageData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: imageData }, { text: STORYBOARD_ANALYSIS_PROMPT }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};

/**
 * 偵測多角度佈局 (用於多角度矩陣生成)
 * 識別大圖中的多個人物及其對應的角度
 */
export const detectMultiAngleLayout = async (imageData: { data: string, mimeType: string }) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze this image which contains multiple views/angles of the same person (common in e-commerce photography). 
    The image is likely a horizontal quad-view (4 views side-by-side) or a triptych (3 views).
    
    [TASK]: Identify each distinct person/view and return their bounding boxes and the angle they represent.
    [ANGLES]: 'front', 'side', 'angle', 'back'.
    
    [PRECISION]: Ensure the bounding boxes are tight around each person, from head to toe, without overlapping other views.
    
    Return ONLY a valid JSON array of objects:
    [
      {
        "angle": "string (one of the options above)",
        "box_2d": [ymin, xmin, ymax, xmax], // Normalized coordinates 0-1000
        "confidence": number
      }
    ]`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: imageData }, { text: prompt }] },
        config: { responseMimeType: 'application/json' }
    });
    
    try {
        return JSON.parse(cleanJsonString(response.text || '[]'));
    } catch (e) {
        console.error("Layout detection failed:", e);
        return [];
    }
};

export const processTasksInParallel = async <T>(
    tasks: (() => Promise<T>)[], 
    concurrency: number = 2, 
    delayMs: number = 2000, 
    onProgress?: (msg: string) => void
): Promise<T[]> => {
    const results: T[] = [];
    
    const runWithRetry = async (task: () => Promise<T>, maxRetries: number = 2): Promise<T> => {
        let lastError: any;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await task();
            } catch (e) {
                lastError = e;
                console.warn(`Task failed (attempt ${attempt}/${maxRetries}):`, e);
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 3000 * attempt)); // Exponential backoff
                }
            }
        }
        throw lastError;
    };

    for (let i = 0; i < tasks.length; i += concurrency) {
        const chunk = tasks.slice(i, i + concurrency);
        if (onProgress) onProgress(`正在處理批次 ${Math.floor(i/concurrency) + 1}/${Math.ceil(tasks.length/concurrency)}...`);
        
        const chunkResults = await Promise.all(chunk.map(t => runWithRetry(t)));
        results.push(...chunkResults);
        
        if (i + concurrency < tasks.length) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    return results;
};

const CLEAN_SHOT_PROMPT = "Generate a clean, professional e-commerce product shot of THIS exact item on a pure white background. Ensure the subject is extracted perfectly.";
const MACRO_SHOT_PROMPT = "Simulate a macro lens zoom into the details. Maintain strict texture fidelity and realistic lighting.";
const REFINE_BODY_PROMPT = (notes: string) => `Refine this image into a high-end editorial fashion portrait. Preserve outfit and identity. Style Notes: ${notes}.`;
const LAYOUT_ANALYSIS_PROMPT = `Analyze these images for a professional fashion layout. 
The first image is the main subject (person). The following images are individual fashion items.
Return JSON: { 
  backgroundColor, 
  fontColor, 
  accentColor, 
  layoutStyle, 
  lighting: { direction, temperature },
  colorPalette: [ { hex, name } ],
  itemAnchors: [ { partName, x, y } ]
}. 
'itemAnchors' should contain suggested connection points on the main subject's body for each of the provided fashion items (in order). 
x and y are percentages (0-100) relative to the main subject image. 
'direction' should be like 'top-left', 'right', etc. 
'temperature' should be like 'warm', 'cool', 'neutral'.`;
