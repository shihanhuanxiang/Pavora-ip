import { GoogleGenAI } from "@google/genai";

export const ensureAuthorized = async (isPaidModel: boolean): Promise<void> => {
    if (!isPaidModel) return;
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
    }
};

export const getGeminiClient = async (isPaidModel: boolean = false) => {
    await ensureAuthorized(isPaidModel);
    const baseUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/gemini-proxy`
        : 'http://localhost:3000/api/gemini-proxy';
    return new GoogleGenAI({
        apiKey: 'proxy',
        httpOptions: {
            baseUrl,
        },
    });
};

export const confirmPaidFeature = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        const event = new CustomEvent('PAVORA_CONFIRM_PAID', {
            detail: { resolve }
        });
        window.dispatchEvent(event);
    });
};

export const getImagenUsage = () => 0;
