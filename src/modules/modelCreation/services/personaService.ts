import { getGeminiClient } from "../../../shared/services/core/geminiClient";
import type { GoogleGenAI } from "@google/genai";

export interface PersonaSeed {
    name: string;
    gender: string;
    age?: number;
    profession?: string;
    coreVibe?: string;
    location?: string;
}

export const generatePersonaTraits = async (seed: PersonaSeed) => {
    try {
        const ai = await getGeminiClient(false) as any;
        
        const prompt = `
            你是一位專業的數位偶像(Digital Human)與 IP 經紀人。
            請根據以下基本資訊，為這位 IP 角色生成一個 JSON 格式的人格特質。
            
            基本資訊：
            - 姓名：${seed.name}
            - 性別：${seed.gender}
            - 核心氛圍：${seed.coreVibe || '未指定'}
            - 職業：${seed.profession || '未指定'}
            - 所在地：${seed.location || '台灣'}

            輸出格式應嚴格遵守以下 JSON 結構：
            {
                "catchphrase": "一句具有代表性的台灣在地化短句",
                "postingHabit": "描述社群發文習慣與風格",
                "toneOfVoice": "溝通語氣類型",
                "mbti": "4位MBTI代碼",
                "interests": ["興趣1", "興趣2", "興趣3"]
            }
            不要輸出任何 Markdown 語法或多餘文字。
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const text = response.text || "";
        
        // 嘗試提取 JSON 部分
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    catchphrase: parsed.catchphrase || "保持真實，成就卓越。",
                    postingHabit: parsed.postingHabit || "精簡且優雅，少量使用 Emoji。",
                    toneOfVoice: parsed.toneOfVoice || "專業且溫和",
                    mbti: parsed.mbti || "INTJ",
                    interests: Array.isArray(parsed.interests) ? parsed.interests : ["時尚", "生活"]
                };
            } catch (parseError) {
                console.error("JSON parse error in persona generation:", parseError);
            }
        }
    } catch (e) {
        console.error("Critical error in persona generation:", e);
    }
    
    // 如果過程中有任何失敗，回傳穩定的預設值
    return {
        catchphrase: seed.gender === 'male' ? "保持真實，成就卓越。" : "優雅是唯一的信仰。",
        postingHabit: "精簡且優雅，少量使用 Emoji。",
        toneOfVoice: "專業且溫和",
        mbti: "INTJ",
        interests: ["攝影", "時尚", "旅行"]
    };
};

export interface FacialDescriptorSeed {
    name: string;
    gender: string;
    age?: number;
    imageBase64: string;
    mimeType: string;
}

export const generateFacialDescriptor = async (seed: FacialDescriptorSeed): Promise<string> => {
    try {
        const ai = await getGeminiClient(false) as any;

        const prompt = `
You are a forensic portrait analyst. Analyze the provided face photo and produce a precise English locked_descriptor string for AI image generation.

Subject metadata:
- Name: ${seed.name}
- Gender: ${seed.gender === 'M' ? 'male virtual IP model' : 'female virtual IP model'}
- Age: ${seed.age || 25} years old

Output requirements:
1. Single-line English string (no line breaks, no markdown).
2. Start with: "${seed.name}, ${seed.gender === 'M' ? 'male virtual IP model' : 'female virtual IP model'}, ${seed.age || 25} years old, "
3. Then describe ONLY observable distinguishing features in this order:
   - Hair: color, length, texture, bangs style (if any), root color contrast (if visible)
   - Eyes: shape, double/single eyelid, size, expression character
   - Face shape: round / oval / heart / square + jaw definition
   - Nose: bridge height, nose tip shape
   - Lips: size, thickness, natural color tone
   - Skin: texture quality, undertone
   - Confirmed facial traits: dimples or other permanent facial traits ONLY if clearly visible and explicitly confirmed by the source identity. Do not infer or invent moles, freckles, beauty marks, dark facial spots, birthmarks, or skin marks. If uncertain, keep the face clean and mark-free.
4. Use specific descriptive vocabulary (e.g. "almond-shaped eyes with prominent double eyelids", NOT "pretty eyes").
5. Total length: 80-150 words, comma-separated phrases.
6. NO subjective beauty words like "pretty", "beautiful", "stunning". Only objective features.
7. NO clothing, accessories, background descriptions. Face only.

Output the string directly, nothing else.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: seed.mimeType,
                                data: seed.imageBase64
                            }
                        }
                    ]
                }
            ]
        });

        const text = (response.text || "").trim();

        // 基本清理:移除可能的 markdown 標記與前後引號
        const cleaned = text
            .replace(/^```[a-z]*\n?/i, "")
            .replace(/\n?```$/i, "")
            .replace(/^["']|["']$/g, "")
            .trim();

        // 驗證:必須以 name + gender + age 開頭,長度合理
        if (cleaned.length >= 50 && cleaned.length <= 800 && cleaned.includes(seed.name)) {
            return cleaned;
        }

        console.warn("generateFacialDescriptor returned invalid format, using fallback");
    } catch (e) {
        console.error("Critical error in facial descriptor generation:", e);
    }

    // 失敗時回傳通用 fallback
    return `${seed.name}, ${seed.gender === 'M' ? 'male virtual IP model' : 'female virtual IP model'}, ${seed.age || 25} years old, East Asian facial features, expressive eyes with double eyelids, balanced facial proportions, healthy dewy skin, natural lip color`;
};
