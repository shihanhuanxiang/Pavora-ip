import { Modality } from "@google/genai";
import { getGeminiClient } from "../../../shared/services/core/geminiClient";
import type { Model } from "../../../shared/types/types";
import { buildModelPrompt } from "../../../prompts/modelCreation";
import { runPromptPipeline } from "../../../promptPipeline";
import { ensureEnglishPrompt } from "../../../shared/services/promptTranslation";
import { CORE_VIBE_EN_MAP, TONE_OF_VOICE_EN_MAP } from "../../../shared/constants/personaPresets";

export const generateModels = async (params: any): Promise<Model[]> => {
    const hasFaceRef = params.faceReferences && params.faceReferences.length > 0;

    // T8 ZH→EN 前置（切 enforce 前的語意防線）：自由輸入欄位在此翻譯（無中文時
    // 零成本零延遲）。有限集合 preset（coreVibe/toneOfVoice）優先取確定性英文映射；
    // 但兩者都可能被 AI 生成、或自由輸入（ModelIdentityEditor 有 coreVibe 中文輸入框）
    // 覆寫成非 preset 中文，故未命中映射時防禦性翻譯——coreVibe 尤其會進不經
    // runPromptPipeline 的 systemInstruction（旁路），殘留中文會直送模型（T12 補洞）。
    // 翻譯失敗會 throw PROMPT_TRANSLATION_FAILED（fail loud，不偽裝成功）。
    const persona = params.persona;
    const [hairColorEn, professionEn, toneOfVoiceEn, customOutfitEn, coreVibeEn] = await Promise.all([
        ensureEnglishPrompt(params.hairColor, 'a hair color description for a virtual model'),
        ensureEnglishPrompt(persona?.profession, "the model's profession"),
        persona?.toneOfVoice && !TONE_OF_VOICE_EN_MAP[persona.toneOfVoice]
            ? ensureEnglishPrompt(persona.toneOfVoice, "the persona's tone of voice / expression style")
            : Promise.resolve(persona?.toneOfVoice ?? ''),
        ensureEnglishPrompt(params.customOutfitPrompt, 'a custom outfit description'),
        persona?.coreVibe
            ? (CORE_VIBE_EN_MAP[persona.coreVibe]
                ? Promise.resolve(CORE_VIBE_EN_MAP[persona.coreVibe])
                : ensureEnglishPrompt(persona.coreVibe, "the model's core vibe / personality essence"))
            : Promise.resolve('')
    ]);
    const effectiveParams = {
        ...params,
        hairColor: params.hairColor ? hairColorEn : params.hairColor,
        customOutfitPrompt: params.customOutfitPrompt ? customOutfitEn : params.customOutfitPrompt,
        persona: persona
            ? {
                ...persona,
                profession: persona.profession ? professionEn : persona.profession,
                toneOfVoice: persona.toneOfVoice ? toneOfVoiceEn : persona.toneOfVoice
              }
            : persona
    };

    const prompt = buildModelPrompt(effectiveParams);
    
    // Determine model name
    let modelName = 'gemini-2.5-flash-image';
    if (params.generationQuality === 'ultra' || params.generationQuality === 'high' || hasFaceRef) {
        modelName = 'gemini-3.1-flash-image-preview'; 
    }

    try {
        const genAI = await getGeminiClient(params.generationQuality === 'ultra' || hasFaceRef);
        
        const baseSystemInstruction = "You are a world-class fashion photographer and master of digital human realism. Your goal is to generate images that are indistinguishable from real high-end photography. You prioritize biometric accuracy above all aesthetic styles.";
        const identityInstruction = `[🚨 BIOMETRIC_ANCHOR_PROTOCOL: LEVEL_OMEGA 🚨]
The user has provided FACE REFERENCE IMAGES. These are the ABSOLUTE and EXCLUSIVE source for identity.
- GEOMETRIC MANDATE: Perform 1:1 Biometric Transfer of the Five Features (eyes, nose, lips, jawline, ears) from the photos. 
- MESH ALIGNMENT: You must align the generated character's facial mesh to the exact bone structure and feature placement of the reference.
- FORBIDDEN: Do NOT use generic AI datasets, beautification filters, standardized beauty presets, or invented facial marks. 
- PRIORITY: Biometric restoration (Weight: 5.0) overrides all background, lighting, and apparel prompts. 
- NO-NEW-FACIAL-MARK RULE: Do not infer or invent moles, freckles, beauty marks, dark facial spots, or birthmarks unless explicitly visible and confirmed in the source identity.
- FACIAL MARK POLICY: Do NOT invent new moles, beauty marks, freckles, birthmarks, dark facial spots, or skin marks. Preserve permanent facial marks ONLY when they are clearly visible in the reference photos AND explicitly part of the user's confirmed identity. If uncertain, keep the face clean and mark-free while preserving bone structure, eyes, nose, lips, jawline, and skin texture.
- EVIDENCE-BASED: Maximize confirmed facial geometry and stable identity traits from the source photos to ensure 95%+ identity match without adding unconfirmed facial marks.`;
        
        // P2① 2026-07-19: 三圍數字已移出 prompt（改語意化滑桿描述），此指令改為只指涉
        // 實際仍有提供的 Height／頭身比與語意體型描述，避免指涉不存在的量測數字。
        const physiqueInstruction = params.isExpertMode
            ? `STRICT PHYSIQUE ENFORCEMENT: The model's body MUST strictly follow the technical metrics provided (Height, head-to-body ratio) and the semantic physique descriptions in the prompt. These are hard physical constraints for the skeletal structure, not suggestions.`
            : "";
        
        const realismInstruction = "Focus on micro-details: skin pores, fine hair strands, realistic eye reflections (catchlights), and natural fabric textures. Avoid any 'plastic' or 'CG' look.";
        
        const brandInstruction = params.brandStyleAnchor && params.brandStyleAnchor !== 'none' 
            ? `Maintain strict brand visual consistency following the ${params.brandStyleAnchor} style guide.` 
            : "";
        
        // T8/T12: systemInstruction 不經 runPromptPipeline（enforce 管不到），coreVibe
        // 必須是英文，否則中文旁路直送模型（2026-07-11 審計發現的洩漏點）。coreVibeEn
        // 已在上方 Promise.all 取映射英文、或對非 preset 值（ModelIdentityEditor 自由
        // 輸入）防禦性翻譯，補上 `?? persona.coreVibe` fallback 會漏原始中文的缺口。
        const personaInstruction = persona
            ? `EMBODIMENT: The soul of this model is "${coreVibeEn}". Adhere to their unique micro-expressions and aura.`
            : "";
        
        // ② 2026-07-18: 無參考圖路徑補臉部標記禁令。identityInstruction 只在
        // hasFaceRef 時附加，導致無參考圖生成缺少「禁止臆造痣/斑」的底線（CLAUDE.md
        // 鐵則第 4 節），且冒出的標記會被 generateFacialDescriptor 反推鎖進
        // locked_descriptor 污染下游（T8c 污染鏈同族）。此常數僅在無參考圖時生效，
        // 有參考圖路徑（identityInstruction）完全不動。措辭刻意區分「膚質紋理保留」
        // 與「禁止離散色斑」，避免與 realismInstruction 的毛孔寫實條款衝突。
        const noRefFacialMarkInstruction = `[FACIAL MARK POLICY — NO FACE REFERENCE PROVIDED]
No face reference image was provided for this generation. Do NOT invent, infer, or add any moles, freckles, beauty marks, birthmarks, dark facial spots, skin marks, patches, or blemishes. Keep the facial skin clean and mark-free. Natural skin texture (visible pores, fine detail) is required, but no discrete pigmented or dark marks of any kind.`;

        const instructions = [
            hasFaceRef ? identityInstruction : noRefFacialMarkInstruction,
            baseSystemInstruction,
            physiqueInstruction,
            realismInstruction,
            brandInstruction, 
            personaInstruction
        ].filter(Boolean).join("\n\n");

        const aspectRatio = params.isMultiAngle ? "16:9" : (params.ratio || "1:1");
        const imageConfig: any = { aspectRatio };
        
        if (params.generationQuality === 'ultra') {
            imageConfig.imageSize = '4K';
        }

        const isExpectedMale = params.gender === 'male' || params.gender === 'M';
        const pipelinedPrompt = runPromptPipeline(prompt, { source: 'modelCreation:generateModels', expectMale: isExpectedMale }).prompt;

        let contents: any;
        if (hasFaceRef) {
            const imageParts = params.faceReferences.map((ref: any) => ({ inlineData: ref }));
            contents = {
                parts: [
                    ...imageParts,
                    { text: pipelinedPrompt }
                ]
            };
        } else {
            contents = {
                parts: [{ text: pipelinedPrompt }]
            };
        }

        const response = await (genAI as any).models.generateContent({
            model: modelName,
            contents: contents,
            config: {
                imageConfig,
                systemInstruction: instructions,
                numberOfCandidates: params.numberOfModels || 1,
                responseModalities: [Modality.IMAGE]
            } as any
        });
        
        const candidates = response.candidates || [];
        const models: Model[] = [];

        if (candidates.length === 0) {
            throw new Error("模型未回傳任何結果，可能觸發了安全過濾。");
        }

        for (let i = 0; i < candidates.length; i++) {
            const parts = candidates[i].content?.parts || [];
            const imagePart = parts.find((p: any) => p.inlineData);
            const textPart = parts.find((p: any) => p.text);

            if (imagePart?.inlineData) {
                const imageData = imagePart.inlineData;
                models.push({
                    id: `gen-${Date.now()}-${i}`,
                    name: params.name || `Pavora Model ${i+1}`,
                    imageUrl: `data:${imageData.mimeType};base64,${imageData.data}`,
                    type: 'custom',
                    gender: params.gender,
                    age: params.age,
                    persona: params.persona,
                    visualIdentityHint: params.visualIdentityHint,
                    lifeCircuit: params.lifeCircuit,
                    worldAnchors: params.worldAnchors,
                    stats: {
                        height: params.height,
                        bust: params.bust,
                        waist: params.waist,
                        hip: params.hip,
                        hair: params.hairColor,
                        eyes: params.eyeShape
                    },
                    advancedStats: {
                        bustTension: params.bustTension,
                        physiqueCurvature: params.physiqueCurvature,
                        muscularDensity: params.muscularDensity,
                        vTaperScale: params.vTaperScale
                    }
                });
            } else if (textPart?.text) {
                throw new Error(`AI 拒絕生成內容：${textPart.text}`);
            }
        }

        // A7: 為每個生成的模特兒自動產生 locked_descriptor
        try {
            const { generateFacialDescriptor } = await import("./personaService");
            for (const model of models) {
                if (!model.imageUrl || !model.imageUrl.startsWith("data:")) continue;
                const matched = model.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (!matched) continue;
                const mimeType = matched[1];
                const base64Data = matched[2];

                const descriptor = await generateFacialDescriptor({
                    name: model.name,
                    gender: model.gender,
                    age: model.age,
                    imageBase64: base64Data,
                    mimeType: mimeType
                });

                if (model.persona) {
                    (model.persona as any).locked_descriptor = descriptor;
                } else {
                    model.persona = { coreVibe: '', locked_descriptor: descriptor } as any;
                }
            }
        } catch (descriptorError) {
            console.error("Locked descriptor auto-generation failed (non-blocking):", descriptorError);
            // 失敗不阻擋整個流程,使用者可後續手動補填
        }

        if (models.length === 0) {
            throw new Error("生成失敗：未能在回應中找到影像數據。");
        }
        return models;
    } catch (error) {
        console.error("Critical error in model generation:", error);
        throw error;
    }
};
