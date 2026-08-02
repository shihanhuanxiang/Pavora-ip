
import React, { useMemo, useState } from 'react';
import ModelIcon from '../shared/assets/icons/ModelIcon';
import ModelLoungeIcon from '../shared/assets/icons/ModelLoungeIcon';
import AsyncImage from '../shared/components/common/AsyncImage';
import ModelLoungeModal from '../shared/components/common/ModelLoungeModal';
import { useModelStore } from '../shared/stores/useModelStore';
import { NAV_GROUPS, entriesByGroup, navName, type NavEntry } from './navRegistry';

/**
 * 首頁 —— 「先選人，再選要做什麼」
 * ================================
 * 2026-08-02 改版（企劃案階段 2 / B-1）。
 *
 * 改版前是「商業模式／IP 創作模式」兩個**模式**切換。問題不在於分兩類，
 * 而在於模式是全域狀態：切了之後功能會消失、連主題色都變，使用者記不住東西在哪，
 * 結果一堆功能被塞進漢堡選單躲起來（改版前有 5 個模組首頁完全看不到）。
 *
 * 現在改成**分支**：
 * - 真正的全域狀態是「現在在操作哪個 IP」，不是「我是哪種人」
 * - 上半＝選／建立 IP；下半＝這個 IP 能做什麼
 * - 下半依「目的」分四組，**四組同時可見**，只是視覺標題不是切換
 * - 功能名稱一律從 `navRegistry.tsx` 取，不在這裡寫死字串
 *
 * 空狀態是**引導式、非強制**（Hank 2026-08-01 定案）：
 * 沒有 IP 時把「建立第一個 IP」放視覺主位，但其他功能仍然可以點——
 * 因為實測全站只有靈魂敘事一個功能真的需要 IP，其餘 14+ 個模組根本不讀 model store。
 */

interface HomePageProps {
  onNavigate: (destination: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { models, activeModelId, setActiveModel } = useModelStore();
  const [isSwitcherOpen, setSwitcherOpen] = useState(false);
  /** 點了「需要 IP」的功能但還沒有 IP 時，顯示的提示（不是 alert，不打斷操作） */
  const [ipPrompt, setIpPrompt] = useState<NavEntry | null>(null);

  const activeModel = useMemo(
    () => models.find(model => model.id === activeModelId) || null,
    [models, activeModelId]
  );

  const hasAnyModel = models.length > 0;

  // 旅程進度推導：只讀既有 models/activeModel/gallery 資料，不開新 localStorage key。
  // 誠實取捨：Model.preferences.active_outfit_id 只在 NarrativeWorkflow 產出流程內才會被寫入，
  // 資料上「穿搭/場景完成」與「開始產內容」無法區分是同一動作，故合併為單一站點。
  const journeyStep = useMemo(() => {
    if (models.length === 0) return { key: 'create_ip' as const };
    if (!activeModel) return { key: 'pick_ip' as const };
    const galleryCount = activeModel.gallery?.length ?? 0;
    if (galleryCount === 0) return { key: 'first_output' as const, model: activeModel };
    return { key: 'curate_or_continue' as const, model: activeModel, galleryCount };
  }, [models, activeModel]);

  const handleEntryClick = (entry: NavEntry) => {
    // 只有 ipNeed === 'required' 才擋（全站目前只有靈魂敘事）。
    // 'optional' 的功能自帶上傳入口，不該擋。
    if (entry.ipNeed === 'required' && !activeModel) {
      setIpPrompt(entry);
      return;
    }
    setIpPrompt(null);
    onNavigate(entry.id);
  };

  const handlePickModel = (id: string) => {
    setActiveModel(id);
    setSwitcherOpen(false);
    setIpPrompt(null);
  };

  return (
    <div className="home-workbench min-h-[calc(100vh-80px)] flex flex-col items-center p-4 lg:p-12 animate-fade-in pb-32">

      {/* ═══════════ Hero ═══════════ */}
      <div className="text-center mt-8 mb-12 space-y-4">
        <span className="home-eyebrow justify-center">任務入口</span>
        <h1 className="home-hero-title font-display font-bold text-[var(--home-ink)] tracking-[0.1em] uppercase">
          Pavora
        </h1>
        <p className="text-[var(--home-muted)] text-xs tracking-[0.4em] font-light uppercase">
          虛擬 IP 經營工作室
        </p>
      </div>

      {/* ═══════════ 上半：先選人 ═══════════ */}
      <div className="w-full max-w-7xl mb-14">
        {!hasAnyModel ? (
          /* 空狀態：引導卡放視覺主位，但下方功能仍可點 */
          <div className="home-card home-card-accent p-8 md:p-10 text-center">
            <div className="home-icon-chip w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 [&_svg]:w-9 [&_svg]:h-9">
              <ModelIcon />
            </div>
            <p className="home-eyebrow justify-center mb-3">從這裡開始</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--home-ink)] mb-3">
              建立你的第一個 IP
            </h2>
            <p className="text-sm text-[var(--home-muted)] max-w-xl mx-auto mb-6 leading-relaxed">
              PAVORA 的一切都從一個虛擬人物開始。先決定他的長相與身形，
              之後所有內容都會是同一個人。
            </p>
            <button
              onClick={() => onNavigate('model_setup')}
              className="home-btn-primary px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
            >
              建立第一個 IP →
            </button>
            <p className="text-[11px] text-[var(--home-muted)] mt-5">
              下方的工具大多不需要 IP 也能直接使用
            </p>
          </div>
        ) : (
          /* 有 IP：顯示當前 IP ＋ 切換 ＋ 下一步建議 */
          <div className="home-card p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-[var(--home-line)]">
                  {activeModel ? (
                    <AsyncImage
                      src={activeModel.imageUrl}
                      alt={activeModel.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center [&_svg]:w-7 [&_svg]:h-7 text-[var(--home-muted)]">
                      <ModelLoungeIcon />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="home-eyebrow mb-1">目前操作的 IP</p>
                  <h2 className="text-xl md:text-2xl font-bold text-[var(--home-ink)] truncate">
                    {activeModel ? activeModel.name : '尚未選擇'}
                  </h2>
                  <p className="text-xs text-[var(--home-muted)] mt-1">
                    {activeModel
                      ? `已累積 ${activeModel.gallery?.length ?? 0} 件作品`
                      : `你有 ${models.length} 個 IP，選一個開始`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 flex-shrink-0">
                <button
                  onClick={() => setSwitcherOpen(true)}
                  className="home-btn-secondary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
                >
                  {activeModel ? '切換 IP' : '選擇 IP'}
                </button>
                <button
                  onClick={() => onNavigate('model_setup')}
                  className="home-btn-quiet px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
                >
                  ＋ 建立新 IP
                </button>
              </div>
            </div>

            {/* 下一步建議：沿用改版前的 journeyStep 推導，只是不再依附模式 */}
            {journeyStep.key === 'pick_ip' && (
              <div className="mt-5 pt-5 border-t border-[var(--home-line)]">
                <p className="text-sm text-[var(--home-ink)]">
                  下一步：選一個 IP 開始經營，或到
                  <button onClick={() => onNavigate('lounge')} className="text-brass font-bold mx-1 underline underline-offset-2">
                    {navName('lounge')}
                  </button>
                  看看全部。
                </p>
              </div>
            )}
            {journeyStep.key === 'first_output' && (
              <div className="mt-5 pt-5 border-t border-[var(--home-line)] flex flex-wrap items-center gap-3">
                <p className="text-sm text-[var(--home-ink)] flex-1 min-w-[240px]">
                  <span className="font-bold">{journeyStep.model.name}</span> 還沒有作品——
                  到靈魂敘事搭第一套穿搭與場景，產出第一張內容。
                </p>
                <button
                  onClick={() => onNavigate('narrative')}
                  className="home-btn-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
                >
                  開始產出 →
                </button>
              </div>
            )}
            {journeyStep.key === 'curate_or_continue' && (
              <div className="mt-5 pt-5 border-t border-[var(--home-line)] flex flex-wrap items-center gap-3">
                <p className="text-sm text-[var(--home-ink)] flex-1 min-w-[240px]">
                  已累積 {journeyStep.galleryCount} 件作品。整理作品集，或接續產出下一篇。
                </p>
                <button
                  onClick={() => onNavigate('lounge')}
                  className="home-btn-secondary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
                >
                  {navName('lounge')} →
                </button>
                <button
                  onClick={() => onNavigate('narrative')}
                  className="home-btn-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
                >
                  繼續產出 →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 需要 IP 的功能被點擊時的提示。不用 alert，不打斷操作。 */}
      {ipPrompt && (
        <div className="w-full max-w-7xl mb-8 animate-fade-in">
          <div className="home-card home-card-accent p-5 flex flex-wrap items-center gap-4">
            <p className="text-sm text-[var(--home-ink)] flex-1 min-w-[240px]">
              <span className="font-bold">{ipPrompt.name}</span> 需要先有一個 IP 才能開始。
            </p>
            {hasAnyModel ? (
              <button
                onClick={() => setSwitcherOpen(true)}
                className="home-btn-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
              >
                選擇 IP →
              </button>
            ) : (
              <button
                onClick={() => onNavigate('model_setup')}
                className="home-btn-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
              >
                建立第一個 IP →
              </button>
            )}
            <button
              onClick={() => setIpPrompt(null)}
              className="home-btn-quiet w-8 h-8 !rounded-full flex items-center justify-center text-lg leading-none"
              aria-label="關閉提示"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ 下半：再選要做什麼（四組同時可見） ═══════════ */}
      {NAV_GROUPS.map(group => {
        const entries = entriesByGroup(group.key);
        if (entries.length === 0) return null;
        const featured = entries.filter(e => e.featured);
        const rest = entries.filter(e => !e.featured);

        return (
          <section key={group.key} className="w-full max-w-7xl mb-16">
            <div className="flex items-baseline gap-4 mb-6">
              <h3 className="home-eyebrow">{group.title}</h3>
              <span className="text-[11px] text-[var(--home-muted)] hidden md:inline">{group.hint}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--home-line)] to-transparent"></div>
            </div>

            {featured.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                {featured.map(entry => {
                  const blocked = entry.ipNeed === 'required' && !activeModel;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => handleEntryClick(entry)}
                      className={`home-card group relative p-7 text-left overflow-hidden transition-all duration-500 hover:-translate-y-2 ${blocked ? 'opacity-70' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brass/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative z-10">
                        <div className="text-brass mb-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 [&_svg]:w-14 [&_svg]:h-14">
                          {entry.icon}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl font-bold tracking-tight">{entry.name}</h2>
                          {blocked && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[var(--home-line)] text-[var(--home-muted)] tracking-widest">
                              需要 IP
                            </span>
                          )}
                        </div>
                        <p className="text-brass text-[10px] uppercase tracking-[0.2em] mb-3 font-display">{entry.tagline}</p>
                        {entry.desc && (
                          <p className="text-[var(--home-muted)] text-sm leading-relaxed group-hover:text-[var(--home-ink)] transition-colors">
                            {entry.desc}
                          </p>
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                        <div className="home-arrow-chip w-8 h-8 rounded-full flex items-center justify-center">→</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {rest.map(entry => {
                  const blocked = entry.ipNeed === 'required' && !activeModel;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => handleEntryClick(entry)}
                      className={`home-card-sub group relative p-5 flex items-center gap-4 transition-all duration-500 hover:-translate-y-1 overflow-hidden ${blocked ? 'opacity-70' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brass/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="home-icon-chip relative z-10 flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 [&_svg]:w-6 [&_svg]:h-6">
                        {entry.icon}
                      </div>
                      <div className="relative z-10 flex flex-col items-start text-left min-w-0">
                        <span className="text-sm font-bold tracking-wide text-[var(--home-ink)] group-hover:text-wine transition-colors truncate">
                          {entry.name}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--home-muted)] mt-1 font-display truncate">
                          {entry.tagline}
                        </span>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                        <span className="text-brass text-lg">›</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <ModelLoungeModal
        isOpen={isSwitcherOpen}
        onClose={() => setSwitcherOpen(false)}
        onSelect={model => handlePickModel(model.id)}
      />
    </div>
  );
};

export default HomePage;
