import { Model, StoryArc, IdentityThread, WeeklyPlanBrief, ExtendedScene } from "../../../shared/types/types";
import { STORY_ARCS, IDENTITY_THREADS } from "../constants/storyElements";
import { COMPOSER_INJECTION_RULES } from "../constants/injectionRules";
import { ALL_EXTENDED_SCENES } from "../constants/extendedScenes";

export const OrchestratorService = {
    /**
     * Helper to pick a suitable scene for a weekly plan item.
     */
    pickSceneForWeeklyPlan: (
        model: Model,
        moduleId?: number,
        preferredSceneId?: string
    ): ExtendedScene => {
        const primaryCity = model.lifeCircuit?.primaryCity || '台北市';
        const primaryDistrict = model.lifeCircuit?.primaryDistrict || '';

        // 1. 如果 preferredSceneId 存在，優先從 ALL_EXTENDED_SCENES 找 scene_id 相同的場景
        if (preferredSceneId) {
            const found = ALL_EXTENDED_SCENES.find(s => s.scene_id === preferredSceneId);
            if (found) return found;
        }

        // 2. 自動挑選邏輯
        let candidates = ALL_EXTENDED_SCENES;

        // A. 優先過濾 moduleId
        if (moduleId !== undefined) {
            candidates = candidates.filter(s => s.depth_module_id === moduleId);
        }

        // B. 強匹配：符合城市與行政區
        let bestCandidates = candidates.filter(s => {
            const cityMatch = s.city && (s.city === primaryCity || primaryCity.includes(s.city) || s.city.includes(primaryCity));
            const districtMatch = primaryDistrict && (
                ((s as any).district && (primaryDistrict.includes((s as any).district) || (s as any).district.includes(primaryDistrict))) ||
                (s.event && s.event.includes(primaryDistrict)) ||
                (s.name_zh && (s as any).name_zh.includes(primaryDistrict)) ||
                (s.category && s.category.includes(primaryDistrict))
            );
            return cityMatch && districtMatch;
        });

        if (bestCandidates.length > 0) return bestCandidates[Math.floor(Math.random() * bestCandidates.length)];

        // C. 次佳：符合城市
        let cityCandidates = candidates.filter(s => 
            s.city && (s.city === primaryCity || primaryCity.includes(s.city) || s.city.includes(primaryCity))
        );
        if (cityCandidates.length > 0) return cityCandidates[Math.floor(Math.random() * cityCandidates.length)];

        // D. 再次：僅符合 moduleId
        if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];

        // E. 再次：通用場景 (region: all / city: any)
        const genericCandidates = ALL_EXTENDED_SCENES.filter(s => s.region === 'all' || s.city === 'any');
        if (genericCandidates.length > 0) return genericCandidates[Math.floor(Math.random() * genericCandidates.length)];

        // F. 最後 fallback
        return ALL_EXTENDED_SCENES[0];
    },

    /**
     * Generates a weekly plan (7 briefs) for a character.
     * Analyzes "Story Arcs", "Identity Threads", and "Brand Identity" (Persona/Vibe).
     */
    generateWeeklyPlan: async (model: Model): Promise<WeeklyPlanBrief[]> => {
        const plan: WeeklyPlanBrief[] = [];
        const isArcEnabled = model.preferences?.enable_story_arcs !== false;
        const isThreadsEnabled = model.preferences?.enable_identity_threads !== false;
        
        const activeArcId = isArcEnabled ? model.preferences?.active_arc_id : null;
        const activeThreads = isThreadsEnabled ? (model.preferences?.active_threads || []) : [];
        
        const allArcs = [...STORY_ARCS, ...(model.preferences?.custom_story_arcs || [])];
        const allThreads = [...IDENTITY_THREADS, ...(model.preferences?.custom_identity_threads || [])];

        const strategyPool = ["情緒撩 — X", "付費牆專用", "高互動轉化", "人格魅力深化", "生活雜訊注入", "品牌調性同步"];

        // Step 1: Injected Story Arc scenes (The Narrative Core)
        if (activeArcId) {
            const arc = allArcs.find(a => a.arc_id === activeArcId);
            const currentPhaseIdx = model.preferences?.active_arc_phase_index || 0;
            
            if (arc) {
                const preferredSceneId = arc.scenes?.[currentPhaseIdx];
                const scene = OrchestratorService.pickSceneForWeeklyPlan(model, 4, preferredSceneId);
                
                plan.push({
                    day: 1, 
                    moduleId: 4,
                    sceneId: scene.scene_id || "",
                    title: `【故事弧推進】${arc.name_zh}`,
                    scripts: [
                        "晨間劇本研讀與情緒對齊",
                        `${arc.name_zh} 核心場景拍攝 - 相位 ${currentPhaseIdx + 1}`,
                        `場景任務：${scene.event || scene.name_zh}`,
                        "敘事節點覆盤與靈魂記錄",
                        "深度故事弧進度規劃"
                    ],
                    strategy_tags: [strategyPool[0], strategyPool[3]],
                    isArcScene: true
                });
            }
        }

        // Step 2: Injected Identity Thread scenes (The Long-term Growth)
        activeThreads.forEach((threadState, idx) => {
            const thread = allThreads.find(t => t.thread_id === threadState.thread_id);
            if (thread) {
                const preferredSceneId = thread.scenes?.[threadState.current_milestone_index];
                const scene = OrchestratorService.pickSceneForWeeklyPlan(model, 8, preferredSceneId);
                
                plan.push({
                    day: 3 + idx, 
                    moduleId: 8,
                    sceneId: scene.scene_id || "",
                    title: `【身份深化】${thread.name_zh}`,
                    scripts: [
                        "人格特質探索與肢體紀錄",
                        `身份線任務：${thread.milestones[threadState.current_milestone_index]}`,
                        `場景任務：${scene.event || scene.name_zh}`,
                        "社交足跡擴展",
                        "核心記憶同步"
                    ],
                    strategy_tags: [strategyPool[1], strategyPool[4]],
                    isThreadScene: true
                });
            }
        });

        // Step 3: Brand Identity & Persona Analysis (The Aesthetic Soul)
        const filledDays = new Set(plan.map(p => p.day));
        const vibe = (model.persona?.coreVibe || 'Natural').toLowerCase();
        
        for (let day = 0; day < 7; day++) {
            if (!filledDays.has(day)) {
                let brandModule = 1;
                let brandActivity = "商業棚拍與美學測試";
                if (vibe.includes('street') || vibe.includes('urban')) {
                    brandModule = 2;
                    brandActivity = "街頭寫實抓拍與穿搭紀錄";
                }
                else if (vibe.includes('natural') || vibe.includes('outdoor')) {
                    brandModule = 3;
                    brandActivity = "戶外自然光影追蹤";
                }
                else if (vibe.includes('cyber') || vibe.includes('tech')) {
                    brandModule = 5;
                    brandActivity = "未來主義視覺實驗";
                }

                const scene = OrchestratorService.pickSceneForWeeklyPlan(model, brandModule);
                
                plan.push({
                    day,
                    moduleId: brandModule,
                    sceneId: scene.scene_id || "",
                    title: `【品牌特質分析】風格：${model.persona?.coreVibe}`,
                    scripts: [
                        "品牌氛圍對齊工作坊",
                        brandActivity,
                        `場景任務：${scene.event || scene.name_zh}`,
                        "視覺素材初篩",
                        "社群影響力資料錄入"
                    ],
                    strategy_tags: [strategyPool[2], strategyPool[5]]
                });
                filledDays.add(day);
                break;
            }
        }

        // Step 4: Fill remaining days using Random Daily Life
        for (let day = 0; day < 7; day++) {
            if (filledDays.has(day)) continue;

            const rule = COMPOSER_INJECTION_RULES[Math.floor(Math.random() * COMPOSER_INJECTION_RULES.length)];
            const scene = OrchestratorService.pickSceneForWeeklyPlan(model, rule.depth_module_id);

            let activity = "隨機靈感擷取";
            if (rule.depth_module_id === 1) activity = "棚拍美學構思";
            else if (rule.depth_module_id === 2) activity = "都市街景漫步";
            else if (rule.depth_module_id === 3) activity = "居家生活隨筆";
            else if (rule.depth_module_id === 5) activity = "靜物美學捕捉";
            else if (rule.depth_module_id === 6) activity = "數位生活碎念";
            else if (rule.depth_module_id === 7) activity = "季節氣候感應";
            else if (rule.depth_module_id === 9) activity = "私密情緒對話";

            plan.push({
                day,
                moduleId: rule.depth_module_id,
                sceneId: scene.scene_id || "",
                title: `【日常隨想】隨機靈感`,
                scripts: [
                    "靈魂暖身與日常情緒紀錄",
                    activity,
                    `場景任務：${scene.event || scene.name_zh}`,
                    "隨筆日記編織",
                    "翌日敘事矩陣預讀"
                ],
                strategy_tags: [
                    strategyPool[Math.floor(Math.random() * strategyPool.length)],
                    rule.description.split('—')[0].split(',')[0].trim()
                ]
            });
        }

        return plan.sort((a, b) => a.day - b.day);
    },

    /**
     * Advancing logic for Story Arcs.
     */
    advanceStoryArc: (model: Model): Partial<Model> => {
        if (!model.preferences?.active_arc_id) return {};
        
        const allArcs = [...STORY_ARCS, ...(model.preferences?.custom_story_arcs || [])];
        const arc = allArcs.find(a => a.arc_id === model.preferences?.active_arc_id);
        const currentIdx = model.preferences?.active_arc_phase_index || 0;
        
        if (arc && currentIdx < arc.scenes.length - 1) {
            return {
                preferences: {
                    ...model.preferences,
                    active_arc_phase_index: currentIdx + 1
                }
            };
        } else {
            // Arc completed
            return {
                preferences: {
                    ...model.preferences,
                    active_arc_id: null,
                    active_arc_phase_index: 0
                }
            };
        }
    },

    /**
     * Advancing logic for Identity Threads.
     */
    advanceIdentityThread: (model: Model, threadId: string): Partial<Model> => {
        const threads = [...(model.preferences?.active_threads || [])];
        const idx = threads.findIndex(t => t.thread_id === threadId);
        
        if (idx === -1) return {};

        const allThreads = [...IDENTITY_THREADS, ...(model.preferences?.custom_identity_threads || [])];
        const thread = allThreads.find(t => t.thread_id === threadId);
        if (thread && threads[idx].current_milestone_index < thread.scenes.length - 1) {
            threads[idx] = {
                ...threads[idx],
                current_milestone_index: threads[idx].current_milestone_index + 1,
                last_update_timestamp: Date.now()
            };
        } else {
            // Completed or Loop back? Usually identity threads are long-term.
            // For now, let's just cap it.
        }

        return {
            preferences: {
                ...model.preferences,
                active_threads: threads
            }
        };
    }
};
