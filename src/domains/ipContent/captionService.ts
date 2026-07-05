// PAVORA domain: ipContent — caption service (Stage C, package C4).
// Purpose: unify the two previously-scattered social-copy pipelines into a
// single domain service. This is a straight relocation of 5 function
// bodies — logic is byte-for-byte unchanged from their original homes:
//   - narrativeService.ts: generateIPDiaryCaption, generatePlatformCaption
//   - shared/services/geminiService.ts: generateSocialCopy,
//     generateCampaignStrategy, generateEGenCopy
// Both original files now re-export these names from here (alias
// compatibility, same pattern as Stage A3/A4) so every existing caller's
// import path is untouched.
//
// Chosen strategy: PLAIN RELOCATION, not shared-fragment extraction.
// The two input domains (Model+diary vs analysisJson) are semantically
// different (see PAVORA_C_SERVICE_LAYER_PLAN.md §3 package C4 — "輸入域
// 不同，不可硬合成一函式"). The plan permits extracting the duplicated
// `ipVoiceHint` line and the gemini-3-flash-preview call template into an
// internal helper IF the resulting prompt string stays byte-identical.
// That was judged not worth the equivalence risk here: the two narrative
// functions build materially different prompt templates (different
// section headers, different rule lists) around that one shared line, so
// extracting a "prompt builder" helper would require reproducing template
// literals exactly and gains only ~1 line of dedup. Per the plan's
// explicit permission ("沒把握就不抽，直接平搬"), both are copied verbatim
// including their own inline `ipVoiceHint` computation. Equivalence is
// therefore trivially preserved (identical source text) and verified by
// script per package C4's requirement.
//
// cleanJsonString: generateCampaignStrategy and generateEGenCopy depend on
// geminiService.ts's private `cleanJsonString` helper, which has 21+ other
// call sites in that file. Per the plan ("若 helper 還有其他使用者則原檔
// 保留原版"), it is NOT moved — geminiService.ts keeps its original copy,
// and a private duplicate is defined below for captionService's own use.

import type { Model } from "../model/types";
import type { DiaryEntry } from "../../shared/types/types";
import { getGeminiClient } from "../../shared/services/core/geminiClient";
import { SOCIAL_COPY_PROMPT, CAMPAIGN_STRATEGY_PROMPT } from "../../prompts/marketing";
import { EGEN_COPYWRITING_PROMPT } from "../../prompts/eGen";

// Private duplicate of geminiService.ts's cleanJsonString (see file header
// note above for why this is a copy, not a shared import).
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

// =====================================================================
// ipVoiceCaptions — inputs are Model (+ diary/caption): narrative IP voice
// =====================================================================

/**
 * 根據已生成的敘事日記，產出 Instagram 發文（台灣口語，三段式：勾住→共鳴→互動）。
 * 這是平台發文功能的基礎；FB / Threads 以本函式輸出為基底，再透過 generatePlatformCaption 轉換。
 */
export const generateIPDiaryCaption = async (
    model: Model,
    diary: Partial<DiaryEntry>
): Promise<string> => {
    const client = await getGeminiClient(true) as any;

    const toneOfVoice = model.persona?.toneOfVoice || '';
    const coreVibe = model.persona?.coreVibe || '';
    const ipVoiceHint = [toneOfVoice, coreVibe].filter(Boolean).join('、');
    const city = model.lifeCircuit?.primaryCity || '台北';

    const prompt = `你是一位台灣年輕女性虛擬 IP 的 Instagram 文案助手。
根據以下敘事日記，寫出一篇 IG 貼文。

【IP 語氣參考】${ipVoiceHint || '台灣口語、日常感、真實溫暖'}
【城市】${city}
【敘事日記】
${diary.content || ''}

【規則】
- 語氣：台灣年輕女性日常分享，口語化，不用書面詞
- 結構：勾住（具體場景）→ 共鳴（普遍情緒，有轉折）→ 互動（問句，不說「留言告訴我」）
- 長度：150-250 字
- 禁止：「不禁感嘆」「深深體悟」等文藝翻譯腔
- 必須：自然問句結尾，讓人想回答
- 加入：📍 ${city} · 地點 + 3-5 個相關 hashtag

請直接輸出發文內容，不要加任何說明或前後綴文字。`;

    try {
        const result = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return (result.text || '').trim();
    } catch (e) {
        console.error('generateIPDiaryCaption failed:', e);
        return '';
    }
};

/**
 * 根據已生成的 IG 發文，產出指定平台（Facebook / Threads）的版本。
 * Facebook：社群共鳴型，200-400 字，1-3 個 hashtag，附分享觸發語。
 * Threads：口語極簡，50-150 字，台灣鄰居感，幾乎不加 hashtag。
 */
export const generatePlatformCaption = async (
    model: Model,
    igCaption: string,
    platform: 'facebook' | 'threads'
): Promise<string> => {
    const client = await getGeminiClient(true) as any;

    const toneOfVoice = model.persona?.toneOfVoice || '';
    const coreVibe = model.persona?.coreVibe || '';
    const ipVoiceHint = [toneOfVoice, coreVibe].filter(Boolean).join('、');

    const platformRules = platform === 'facebook'
        ? `
【平台】Facebook
【字數】200-400 字
【語氣】社群共鳴型：生活感重、情感連結強、適合中年至中青年 Facebook 用戶
【結構】開場白（具體日常細節）→ 普遍共鳴（有轉折感）→ 分享觸發語（引導讀者留言或分享，但不要說「留言告訴我」）
【hashtag】1-3 個，選最精準的，不過度堆砌
【禁止】「不禁感嘆」「深深體悟」「令人動容」等文藝翻譯腔
【必須】用問句或邀請語做結尾，讓人想回覆`
        : `
【平台】Threads
【字數】50-150 字
【語氣】口語極簡，台灣鄰居感，就像傳給朋友的私訊
【結構】直接切入核心感受或場景 → 輕輕帶出情緒 → 一句問句做結
【hashtag】可省略，最多 1-2 個
【禁止】「不禁感嘆」「深深體悟」任何書面詞，長篇大論
【必須】短句節奏，有呼吸感，不超過 150 字`;

    const prompt = `你是一位台灣年輕女性虛擬 IP 的社群文案助手。
以下是她的 Instagram 版發文草稿，請根據規則改寫成指定平台的版本。

【IP 語氣參考】${ipVoiceHint || '台灣口語、日常感、真實溫暖'}
【IG 原稿】
${igCaption}

${platformRules}

請直接輸出改寫後的發文內容，不要加任何說明或前後綴文字。`;

    try {
        const resultResponse = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return (resultResponse.text || '').trim();
    } catch (e) {
        console.error(`generatePlatformCaption failed (${platform}):`, e);
        return igCaption;
    }
};

// =====================================================================
// commerceCaptions — inputs are analysisJson: product/marketing copy
// =====================================================================

/**
 * 生成社群媒體行銷文案 (Instagram/TikTok/Facebook)
 */
export const generateSocialCopy = async (analysisJson: string, platform: 'Instagram' | 'TikTok' | 'Facebook') => {
    const ai = await getGeminiClient();
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
    const ai = await getGeminiClient();
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

export const generateEGenCopy = async (analysisJson: string) => {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: EGEN_COPYWRITING_PROMPT(analysisJson),
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
};
