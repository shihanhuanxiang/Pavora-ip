import React from 'react';
import ModelIcon from '../shared/assets/icons/ModelIcon';
import FittingRoomIcon from '../shared/assets/icons/FittingRoomIcon';
import SceneTransferIcon from '../shared/assets/icons/SceneTransferIcon';
import CompositeCardIcon from '../shared/assets/icons/CompositeCardIcon';
import ApparelDesignIcon from '../shared/assets/icons/ApparelDesignIcon';
import HairSalonIcon from '../shared/assets/icons/HairSalonIcon';
import FantasySeriesIcon from '../shared/assets/icons/FantasySeriesIcon';
import ModelLoungeIcon from '../shared/assets/icons/ModelLoungeIcon';
import PersonalWardrobeIcon from '../shared/assets/icons/PersonalWardrobeIcon';
import PortfolioGalleryIcon from '../shared/assets/icons/PortfolioGalleryIcon';
import DirectorModeIcon from '../shared/assets/icons/DirectorModeIcon';
import OptimizeIcon from '../shared/assets/icons/OptimizeIcon';
import DeconstructIcon from '../shared/assets/icons/DeconstructIcon';
import PosterEngineIcon from '../shared/assets/icons/PosterEngineIcon';
import Face3DIcon from '../shared/assets/icons/Face3DIcon';
import MacroCraftIcon from '../shared/assets/icons/MacroCraftIcon';
import StyleAnchorIcon from '../shared/assets/icons/StyleAnchorIcon';

/**
 * 導航註冊表 —— 全站功能入口的唯一名稱來源
 * =========================================
 * 建立於 2026-08-02（企劃案階段 2 / B-1f、C 區 00-06、00-13、00-17、01-15）。
 *
 * 為什麼要有這個檔：
 * 改版前，同一個功能在首頁大卡、首頁進階工具箱、Header 常駐列、漢堡選單四個地方
 * 各自寫死一份名稱，結果同一個 `lounge` 有三個中文名（IP 休息室／資產保險庫／模特兒休息室），
 * `portfolio` 也有三個。而且不一致的兩處**就在同一個檔案裡**。
 *
 * 規則：**任何畫面要顯示功能名稱，一律從這裡取，不准自己寫字串。**
 * 要改名就改這裡一處，全站同步。
 *
 * `id` 必須與 `App.tsx` 的 `handleNavigate` switch case 完全對應，
 * 否則按鈕點下去會 fallback 回首頁（等於死按鈕）。
 */

/** 首頁的分組。依「使用者想達成什麼目的」分，不是依「功能屬於哪個技術模組」。 */
export type NavGroup = 'grow' | 'shoot' | 'results' | 'advanced';

/**
 * 這個功能沒有 IP 時能不能用。依 2026-08-02 逐模組讀 code 判定，不是憑感覺。
 * - `required`：沒有 IP 完全無法使用（目前全站只有靈魂敘事）
 * - `optional`：有 IP 更好，但自帶上傳入口可以繞過
 * - `none`：完全不讀 model store，與 IP 無關
 */
export type IPNeed = 'required' | 'optional' | 'none';

export interface NavEntry {
    /** 必須對應 App.tsx handleNavigate 的 case */
    id: string;
    /** 唯一正式名稱。全站顯示都用這個。 */
    name: string;
    /** 短副標，卡片上的小字 */
    tagline: string;
    /** 長描述，只有首頁主打卡片會顯示 */
    desc?: string;
    icon: React.ReactNode;
    group: NavGroup;
    ipNeed: IPNeed;
    /** 是否為該組的主打功能（首頁用大卡呈現） */
    featured?: boolean;
}

export const NAV_GROUPS: { key: NavGroup; title: string; hint: string }[] = [
    { key: 'grow', title: '養成這個角色', hint: '打造長相、人設，並持續產出他的日常內容' },
    { key: 'shoot', title: '幫商品拍圖', hint: '試穿、改造服裝、換場景，產出可直接用的商業素材' },
    { key: 'results', title: '看成果', hint: '整理已經產出的內容與素材' },
    { key: 'advanced', title: '進階工具', hint: '單點功能，需要時再用' },
];

export const NAV_ENTRIES: NavEntry[] = [
    // ── 養成這個角色 ──────────────────────────────
    {
        id: 'model_setup',
        name: '模特兒生成',
        tagline: '建立與優化角色',
        desc: '從零打造一個新角色的長相，或調整既有 IP 的臉型、身形、髮型',
        icon: <ModelIcon />,
        group: 'grow',
        ipNeed: 'none',
        featured: true,
    },
    {
        id: 'narrative',
        name: '靈魂敘事',
        tagline: '日常內容產出',
        desc: '幫你的 IP 換上穿搭、換到新場景，一次產出一篇可發文的內容',
        icon: <DirectorModeIcon />,
        group: 'grow',
        ipNeed: 'required',
        featured: true,
    },
    {
        id: 'lounge',
        name: 'IP 休息室',
        tagline: '身份與作品管理',
        desc: '看到你的 IP 目前的長相與所有作品，一鍵接續下一次產出',
        icon: <ModelLoungeIcon />,
        group: 'grow',
        ipNeed: 'none',
        featured: true,
    },
    {
        id: 'salon',
        name: '妝髮沙龍',
        tagline: '髮型與妝感調整',
        desc: '微調模特兒的妝容與髮型，做出你想要的細節',
        icon: <HairSalonIcon />,
        group: 'grow',
        ipNeed: 'none',
    },

    // ── 幫商品拍圖 ────────────────────────────────
    {
        id: 'fitting_room',
        name: '虛擬試衣間',
        tagline: '服裝試穿合成',
        desc: '上傳一件衣服，讓模特兒穿上它，產出可直接用的廣告圖',
        icon: <FittingRoomIcon />,
        group: 'shoot',
        ipNeed: 'optional',
        featured: true,
    },
    {
        id: 'apparel',
        name: '服裝設計',
        tagline: '服裝改色與再創作',
        desc: '拿一張現有服裝圖，改顏色、改樣式、混搭品牌設計元素',
        icon: <ApparelDesignIcon />,
        group: 'shoot',
        ipNeed: 'none',
        featured: true,
    },
    {
        id: 'scene',
        name: '場景轉移',
        tagline: '背景與情境重建',
        desc: '把人物移到新的場景，光線與氛圍一起重建',
        icon: <SceneTransferIcon />,
        group: 'shoot',
        ipNeed: 'optional',
        featured: true,
    },
    {
        id: 'marketing_factory',
        name: '行銷工廠',
        tagline: '素材批次產線',
        desc: '一次規劃並產出多平台需要的行銷素材與廣告視覺',
        icon: <PosterEngineIcon />,
        group: 'shoot',
        ipNeed: 'none',
    },
    {
        id: 'brand_identity_hub',
        name: '品牌識別中心',
        tagline: '品牌代言人管理',
        desc: '整理品牌的代言人、美學調性與合輯卡，讓每次產出風格一致',
        icon: <ModelIcon />,
        group: 'shoot',
        ipNeed: 'none',
    },
    {
        id: 'motion_hub',
        name: '動態中心',
        tagline: '影片與電影感視覺',
        desc: '把靜態影像變成有電影運鏡感的動態畫面',
        icon: <DirectorModeIcon />,
        group: 'shoot',
        ipNeed: 'none',
    },

    // ── 看成果 ────────────────────────────────────
    {
        id: 'portfolio',
        name: '作品庫',
        tagline: '成果瀏覽與整理',
        desc: '把已經產出的內容整理成一份可以直接拿去發文的素材庫',
        icon: <PortfolioGalleryIcon />,
        group: 'results',
        ipNeed: 'none',
        featured: true,
    },
    {
        id: 'wardrobe',
        name: '我的衣櫥',
        tagline: '服裝素材管理',
        desc: '管理你上傳與存下來的服裝素材，隨時拿去試穿',
        icon: <PersonalWardrobeIcon />,
        group: 'results',
        ipNeed: 'none',
    },

    // ── 進階工具 ──────────────────────────────────
    {
        id: 'director_mode',
        name: '導演模式',
        tagline: '分鏡與運鏡設計',
        desc: '把你的腳本文字變成一組分鏡與動態預覽',
        icon: <DirectorModeIcon />,
        group: 'advanced',
        ipNeed: 'none',
    },
    {
        id: 'style_anchor',
        name: '視覺錨點',
        tagline: '風格一致性鎖定',
        desc: '鎖定喜歡的視覺風格，套用到新的產出上',
        icon: <StyleAnchorIcon />,
        group: 'advanced',
        ipNeed: 'none',
    },
    {
        id: 'deconstruction',
        name: '影像解構',
        tagline: '視覺元素拆解',
        desc: '拆解一張圖的構成元素，方便你重新組合運用',
        icon: <DeconstructIcon />,
        group: 'advanced',
        ipNeed: 'none',
    },
    {
        id: 'macro_craft',
        name: '微觀工藝',
        tagline: '細節與材質強化',
        desc: '針對材質、織紋與光澤做局部強化',
        icon: <MacroCraftIcon />,
        group: 'advanced',
        ipNeed: 'none',
    },
    {
        id: 'fantasy',
        name: '幻想系列',
        tagline: '奇幻造型轉換',
        desc: '把角色轉換成奇幻或戲劇化的造型',
        icon: <FantasySeriesIcon />,
        group: 'advanced',
        ipNeed: 'none',
    },
    {
        id: 'character_lab',
        name: '角色矩陣',
        tagline: '多角色批次生成',
        desc: '一次生成多個角色原型，方便挑選並保持一致視覺',
        icon: <Face3DIcon />,
        group: 'advanced',
        ipNeed: 'none',
    },
    {
        id: 'composite_card',
        name: '模特兒合輯卡',
        tagline: '多角度資料卡',
        desc: '產出一張含多角度與臉部特寫的模特兒資料卡',
        icon: <CompositeCardIcon />,
        group: 'advanced',
        ipNeed: 'none',
    },
    {
        id: 'portfolio_optimization',
        name: '作品優化',
        tagline: '既有成品精修',
        desc: '針對單張作品重新打光、換角度、補強細節',
        icon: <OptimizeIcon />,
        group: 'advanced',
        ipNeed: 'none',
    },
];

/** 依 id 取得名稱。找不到時回傳 id 本身，避免畫面出現空白。 */
export const navName = (id: string): string =>
    NAV_ENTRIES.find(entry => entry.id === id)?.name ?? id;

export const navEntry = (id: string): NavEntry | undefined =>
    NAV_ENTRIES.find(entry => entry.id === id);

export const entriesByGroup = (group: NavGroup): NavEntry[] =>
    NAV_ENTRIES.filter(entry => entry.group === group);
