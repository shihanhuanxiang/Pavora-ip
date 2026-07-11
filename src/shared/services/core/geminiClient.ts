import { GoogleGenAI } from "@google/genai";
import { getUsageSummary } from "../../../domains/ipContent/usageRecorder";
import { auth } from "../firebase/firebaseConfig";

// Stage 28-1: 全站唯一的 Gemini 請求入口在這裡，登入 token 只需在此注入一次。
// 未登入時不帶 header——server 端依 REQUIRE_AUTH 決定放行（開發模式）或 401（部署模式）。
const getAuthHeaders = async (): Promise<Record<string, string> | undefined> => {
    try {
        const token = await auth.currentUser?.getIdToken();
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    } catch {
        return undefined;
    }
};

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
    const headers = await getAuthHeaders();
    return new GoogleGenAI({
        apiKey: 'proxy',
        httpOptions: {
            baseUrl,
            ...(headers ? { headers } : {}),
        },
    });
};

// P0 2026-07-11: /api/gemini-video 掛 authGuard 後，前端 fetch 需帶同一份 Firebase token。
// REQUIRE_AUTH 未開（本地開發）時 headers 為空，行為不變。
export const fetchWithAuth = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const headers = await getAuthHeaders();
    return fetch(input, {
        ...init,
        headers: { ...((init.headers as Record<string, string>) || {}), ...(headers || {}) },
    });
};

// Stage 28-1: 供各模組 catch 區辨識 server 端 quota 拒絕（429 + code: QUOTA_EXCEEDED），
// 命中時 dispatch 'imagenQuotaExceeded' 事件觸發既有 QuotaErrorModal。
export const isServerQuotaError = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.includes('QUOTA_EXCEEDED');
};

export const confirmPaidFeature = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        const event = new CustomEvent('PAVORA_CONFIRM_PAID', {
            detail: { resolve }
        });
        window.dispatchEvent(event);
    });
};

export const getImagenUsage = () => getUsageSummary().totalImages;

