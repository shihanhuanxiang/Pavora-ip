// PAVORA Stage 1b-T: ZH→EN 前置翻譯（送生圖前把使用者中文輸入翻成英文）。
//
// 動機：promptPipeline enforce 模式會剝除中文字元（刪字、不翻譯）。含使用者
// 自由輸入的生圖出口若直接切 enforce，中文語意會整段消失。因此這些出口在
// 組 prompt 之前先呼叫本 helper 把偵測到中文的欄位翻成英文；enforce 的
// 中文剝除從此只是最後安全網，不再承擔語意轉換。
//
// 原則：
// - 純英文／空白輸入直接原樣返回：不發 API 呼叫、零成本零延遲。
// - 翻譯失敗或輸出仍含中文 → throw（鐵則：fallback 不可偽裝成功），由呼叫端
//   既有 catch → getFriendlyErrorMessage 流程顯示中文錯誤訊息。
// - 走既有 getGeminiClient proxy 路徑，不引入新的 key / endpoint。
import { getGeminiClient } from './core/geminiClient';

const CHINESE_CHARACTER_PATTERN = /[一-鿿]/;

export const PROMPT_TRANSLATION_FAILED = 'PROMPT_TRANSLATION_FAILED';

/**
 * 若輸入含中文，翻譯成適合生圖 prompt 的精簡英文；否則原樣返回。
 * @param text 使用者自由輸入欄位值
 * @param context 一句英文說明該欄位用途，幫助翻譯貼近語境（可省略）
 */
export const ensureEnglishPrompt = async (
    text: string | undefined | null,
    context?: string
): Promise<string> => {
    const trimmed = (text ?? '').trim();
    if (!trimmed || !CHINESE_CHARACTER_PATTERN.test(trimmed)) {
        return trimmed;
    }

    const client = await getGeminiClient(false) as any;
    const instruction = [
        'You are a translation engine inside an image-generation workflow.',
        'Translate the user input below into concise, natural English suitable for inclusion in an image-generation prompt.',
        context ? `The input is used as: ${context}.` : '',
        'Preserve every concrete visual detail (colors, materials, styles, moods, quantities).',
        'Output ONLY the English translation. No quotes, no explanations, no Chinese characters.',
        '',
        'User input:',
        trimmed
    ].filter(Boolean).join('\n');

    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: instruction
    });
    const translated = (response.text || '').trim();

    if (!translated || CHINESE_CHARACTER_PATTERN.test(translated)) {
        throw new Error(PROMPT_TRANSLATION_FAILED);
    }
    return translated;
};
