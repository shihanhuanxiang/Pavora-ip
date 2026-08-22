import React from 'react';
import { motion } from 'motion/react';

/**
 * TabBar — 可複用頁籤列
 *
 * 由 ModelSetup 內兩處幾乎逐字重複的頁籤實作抽出（2026-08-02，企劃案 A-4 / PR-G1）。
 * 抽出目的是「還債」：在把頁籤外推到場景轉移之前，先讓它只有一份實作，
 * 否則之後改一個顏色要改四個地方。
 *
 * 本次抽出的驗收標準是「行為與外觀零變化」，因此 class 字串刻意逐字沿用原本的寫法，
 * 不做任何美化或簡化。要調整樣式請另開 PR。
 *
 * 唯一刻意省略的是子頁籤原本多出來的 `hover:text-[var(--home-muted)]`：
 * 它與非 hover 狀態同色，是重複宣告，移除後渲染結果完全相同。
 */

export interface TabItem<K extends string = string> {
    key: K;
    label: React.ReactNode;
}

export interface TabBarProps<K extends string = string> {
    tabs: readonly TabItem<K>[];
    active: K;
    onChange: (key: K) => void;
    /** framer-motion 的共享動畫 id。同一畫面上每組頁籤必須不同，否則滑動高光會互相搶。 */
    layoutId: string;
    /** 'md' = 主頁籤（py-2.5）；'sm' = 區塊內的子頁籤（py-2） */
    size?: 'md' | 'sm';
    /** 是否包一層 sticky 外框（主頁籤用） */
    sticky?: boolean;
    /**
     * 配色（2026-08-12，企劃案 A-5 外推到場景轉移時新增）。
     *
     * - `'paper'`（**預設**）= 模特兒生成那套亮色系（`--home-*` / `bg-brass`）。
     *   維持預設是刻意的：ModelSetup 既有的兩處呼叫**一個字都不用改**，行為零變化。
     * - `'dark'` = 場景轉移／虛擬試衣間那套暗色系（`--color-gold` / `glass-panel`）。
     *
     * ⚠️ 這不是「主題統一」——規劃檔明訂本輪**不做**主題統一（避免一次動兩件事）。
     * 這只是讓同一個元件能在兩套既有配色下正確呈現，而不是逼其中一頁換皮。
     */
    variant?: 'paper' | 'dark';
    /** 附加在內層容器上的 class，例如子頁籤的 mb-4 */
    className?: string;
}

function TabBar<K extends string = string>({
    tabs,
    active,
    onChange,
    layoutId,
    size = 'md',
    sticky = false,
    variant = 'paper',
    className = '',
}: TabBarProps<K>) {
    const paddingY = size === 'md' ? 'py-2.5' : 'py-2';

    // 兩套配色只差在 class 字串。`paper` 這一組逐字沿用 A-4 抽出時的原始寫法，
    // 不做任何美化——那次的驗收標準就是「外觀零變化」，改動它會讓 ModelSetup 走樣。
    const skin = variant === 'dark'
        ? {
            wrap: 'flex gap-2 glass-panel p-1.5 rounded-2xl border border-[var(--color-border)]',
            active: 'bg-[var(--color-gold)] text-black shadow-[0_4px_20px_rgba(212,175,55,0.3)]',
            idle: 'text-[var(--color-text-dim)] hover:bg-white/5',
            glare: 'absolute inset-0 bg-white/10 pointer-events-none',
            stickyWrap: 'sticky top-4 z-30 bg-bg-deep/95 backdrop-blur-sm py-1',
        }
        : {
            wrap: 'flex gap-2 bg-[rgba(255,255,255,.5)] p-1.5 rounded-2xl border border-[var(--home-line)]',
            active: 'bg-brass text-black shadow-[0_4px_20px_rgba(var(--color-brass-rgb),0.3)]',
            idle: 'text-[var(--home-muted)] hover:bg-[rgba(255,255,255,.4)]',
            glare: 'absolute inset-0 bg-[rgba(255,255,255,.25)] pointer-events-none',
            stickyWrap: 'sticky top-4 z-30 bg-[var(--home-paper)]/95 backdrop-blur-sm py-1',
        };

    const bar = (
        <div className={`${skin.wrap}${className ? ` ${className}` : ''}`}>
            {tabs.map(tab => {
                const isActive = active === tab.key;
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`flex-1 ${paddingY} text-[11px] font-bold rounded-xl transition-all duration-300 relative overflow-hidden ${
                            isActive ? skin.active : skin.idle
                        }`}
                    >
                        <span className="relative z-10">{tab.label}</span>
                        {isActive && (
                            <motion.div
                                layoutId={layoutId}
                                className={skin.glare}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );

    if (!sticky) return bar;

    return (
        <div className={skin.stickyWrap}>
            {bar}
        </div>
    );
}

export default TabBar;
