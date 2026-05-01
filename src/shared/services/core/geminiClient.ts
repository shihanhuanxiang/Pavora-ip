import { GoogleGenAI } from "@google/genai";

/**
 * 核心授權檢查：針對 Pro/Veo 等付費模型
 * 依照規範，必須使用 window.aistudio 提供的方法
 */
export const ensureAuthorized = async (isPaidModel: boolean): Promise<void> => {
    if (!isPaidModel) return;

    if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
            // 規範要求：觸發 openSelectKey 後應直接視為成功，不需額外延遲
        }
    }
};

/**
 * 取得 Gemini 客戶端實例
 * 規範要求：每次 API 呼叫前才建立實例，且必須命名為 apiKey
 */
export const getGeminiClient = async (isPaidModel: boolean = false) => {
    await ensureAuthorized(isPaidModel);
    
    // API Key 優先使用 process.env.API_KEY (用戶選取)，次之使用 process.env.GEMINI_API_KEY (系統預設)
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    return new GoogleGenAI({ apiKey: apiKey as string });
};

/**
 * 確認付費功能的使用意願 (UI 觸發事件)
 */
export const confirmPaidFeature = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        const event = new CustomEvent('PAVORA_CONFIRM_PAID', {
            detail: { resolve }
        });
        window.dispatchEvent(event);
    });
};

export const getImagenUsage = () => 0; // 用量追蹤目前由環境處理
