import { Modality } from "@google/genai";
import { getGeminiClient } from "../../../shared/services/core/geminiClient";
import type { Model } from "../../../shared/types/types";
import { buildModelPrompt } from "../../../prompts/modelCreation";

export const generateModels = async (params: any): Promise<Model[]> => {
    const hasFaceRef = params.faceReferences && params.faceReferences.length > 0;
    const prompt = buildModelPrompt(params);
    
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
        
        const physiqueInstruction = params.isExpertMode 
            ? `STRICT PHYSIQUE ENFORCEMENT: The model's body MUST strictly follow the technical metrics provided (Height, Bust, Waist, Hips). These are hard physical constraints for the skeletal structure, not suggestions.` 
            : "";
        
        const realismInstruction = "Focus on micro-details: skin pores, fine hair strands, realistic eye reflections (catchlights), and natural fabric textures. Avoid any 'plastic' or 'CG' look.";
        
        const brandInstruction = params.brandStyleAnchor && params.brandStyleAnchor !== 'none' 
            ? `Maintain strict brand visual consistency following the ${params.brandStyleAnchor} style guide.` 
            : "";
        
        const personaInstruction = params.persona 
            ? `EMBODIMENT: The soul of this model is "${params.persona.coreVibe}". Adhere to their unique micro-expressions and aura.` 
            : "";
        
        const physicsInstruction = (params.bustTension > 80 || params.vTaperScale > 80)
            ? `[PHYSICS_ENFORCEMENT: ULTRA_TENSION]
The body proportions are extreme (Bust:${params.bust}, Waist:${params.waist}). You MUST render visible structural fabric tension. The clothing MUST appear to be significantly stretched across the chest and shoulders. Add realistic pulling creases at the seams.`
            : "";

        const instructions = [
            hasFaceRef ? identityInstruction : "",
            baseSystemInstruction, 
            physiqueInstruction,
            physicsInstruction,
            realismInstruction, 
            brandInstruction, 
            personaInstruction
        ].filter(Boolean).join("\n\n");

        const aspectRatio = params.isMultiAngle ? "16:9" : (params.ratio || "1:1");
        const imageConfig: any = { aspectRatio };
        
        if (params.generationQuality === 'ultra') {
            imageConfig.imageSize = '4K';
        }

        let contents: any;
        if (hasFaceRef) {
            const imageParts = params.faceReferences.map((ref: any) => ({ inlineData: ref }));
            contents = {
                parts: [
                    ...imageParts,
                    { text: prompt }
                ]
            };
        } else {
            contents = {
                parts: [{ text: prompt }]
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
