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

/**
 * 2026-08-14（UX 表 04-10）：付費確認可以「本次瀏覽期間不再詢問」。
 *
 * 改版前每一次都彈一次窗、每一次都要重選——而合輯卡、角色矩陣這些地方
 * 一輪操作會連續呼叫好幾次（`CompositeCardStudio` 就有兩個呼叫點），
 * 使用者得一直按「確認繼續」。
 *
 * ⚠️ **刻意用 `sessionStorage` 而不是 `localStorage`。**
 * 這是**金錢同意**：永久記住的話，使用者幾週後早就忘記自己同意過什麼，
 * 卻還在無聲產生費用。sessionStorage 的語意剛好對——關掉分頁就重新問一次。
 */
export const PAID_CONFIRM_SESSION_KEY = 'pavora_paid_confirmed_session';

export const confirmPaidFeature = async (): Promise<boolean> => {
    try {
        if (typeof window !== 'undefined' && window.sessionStorage?.getItem(PAID_CONFIRM_SESSION_KEY) === '1') {
            return true;
        }
    } catch {
        // sessionStorage 不可用（隱私模式等）就照原本流程問一次，不要因此擋住功能
    }
    return new Promise((resolve) => {
        const event = new CustomEvent('PAVORA_CONFIRM_PAID', {
            detail: { resolve }
        });
        window.dispatchEvent(event);
    });
};

export const getImagenUsage = () => getUsageSummary().totalImages;

