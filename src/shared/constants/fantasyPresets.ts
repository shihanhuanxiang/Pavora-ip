
import type { FantasyPresetV8, ScenePresetV8, PoseV8, FantasyExpressionV8 } from '../types/types';

// --- Fantasy Series Presets (V8.6 Global Recovery Edition) ---

const createRace = (name: string, zh: string, prompt: string, must: string[] = [], neg: string[] = [], tags: string[] = []) => ({
    name, labelZh: `${zh} (${name.charAt(0).toUpperCase() + name.slice(1)})`, race_prompt_en: prompt, must_show: must, negatives: neg, tags
});

const createJob = (name: string, zh: string, feat: string[], act: string[], fx: string[], tags: string[] = []) => ({
    name, labelZh: `${zh} (${name.charAt(0).toUpperCase() + name.slice(1)})`, features: feat, action: act, effects: fx, tags
});

// 1. 完整種族庫 (Races - 15+)
export const FANTASY_RACES_V8: Record<'male' | 'female', FantasyPresetV8[]> = {
    female: [
        createRace('human', '人類', 'Noble human lineage, versatile facial features.', [], [], ['human']),
        createRace('elf', '高等精靈', 'Ethereal beauty, long pointed ears, crystalline eyes.', ['long pointed ears'], ['round ears'], ['elf', 'magic']),
        createRace('dark_elf', '黑暗精靈', 'Drow, obsidian skin, white hair, red eyes.', ['obsidian skin', 'pointed ears'], ['light skin'], ['elf', 'dark']),
        createRace('angel', '天使', 'Celestial being, massive white feathered wings, golden halo.', ['massive wings', 'halo'], [], ['holy', 'wings']),
        createRace('demon', '惡魔', 'Succubus, curved obsidian horns, bat wings, spade tail.', ['horns', 'bat wings'], ['feathers'], ['dark', 'wings']),
        createRace('vampire', '吸血鬼', 'Gothic aristocrat, pale porcelain skin, retractable fangs.', ['pale skin', 'fangs'], ['tan skin'], ['dark']),
        createRace('kitsune', '狐妖', 'Kitsune fox spirit, fluffy fox ears, multiple glowing tails.', ['fox ears', 'multiple tails'], [], ['beast', 'magic']),
        createRace('mermaid', '人魚', 'Bioluminescent scales, fish tail, flowing seaweed hair.', ['fish tail', 'scales'], ['legs'], ['water']),
        createRace('cyborg', '賽博格', 'Integrated mechanical parts, glowing circuits on skin.', ['mechanical limbs'], [], ['tech']),
        createRace('fairy', '仙子', 'Translucent iridescent butterfly wings, shimmering dust.', ['iridescent wings'], [], ['flying', 'magic']),
        createRace('dragonborn', '龍裔', 'Scales on cheeks, vertical slit irises, elegant horns.', ['scales', 'horns'], [], ['dragon']),
        createRace('undead', '亡靈', 'Ethereal ghost queen, translucent skin, blue spectral fire.', ['ghostly glow'], ['healthy skin'], ['undead']),
        createRace('amazon', '亞馬遜', 'Warrior build, tribal war paint, sun-kissed skin.', ['war paint'], [], ['strong']),
        createRace('tiefling', '提夫林', 'Red/Violet skin, powerful ram horns, thick tail.', ['horns', 'tail', 'colored skin'], [], ['demon']),
        createRace('android', '仿生人', 'Synthetic perfect skin, visible panel lines, robotic eyes.', ['panel lines'], [], ['tech'])
    ],
    male: [
        createRace('human', '人類', 'Rugged human warrior features.', [], [], ['human']),
        createRace('elf', '高等精靈', 'Noble ancient aura, long pointed ears.', ['pointed ears'], ['beard'], ['elf']),
        createRace('orc', '獸人', 'Green thick skin, massive tusks, scarified muscles.', ['tusks', 'green skin'], ['slender'], ['orc']),
        createRace('dwarf', '矮人', 'Stout build, massive braided beard, rugged features.', ['massive beard'], ['tall'], ['dwarf']),
        createRace('dark_elf', '黑暗精靈', 'Drow assassin, obsidian skin, white hair.', ['dark skin', 'white hair'], [], ['elf', 'dark']),
        createRace('angel', '天使', 'Archangel warrior, six wings, golden plate armor.', ['multiple wings'], [], ['holy']),
        createRace('demon', '惡魔', 'Demon Overlord, huge horns, skin like cooling lava.', ['huge horns'], [], ['dark']),
        createRace('vampire', '吸血鬼', 'Vampire Lord, elegant noble features, sharp fangs.', ['pale skin', 'fangs'], [], ['dark']),
        createRace('werewolf', '狼人', 'Hybrid form, grey fur, claws, ferocious beast head.', ['fur', 'wolf head'], [], ['beast']),
        createRace('dragonborn', '龍裔', 'Draconic head, powerful tail, hard scales.', ['dragon head'], [], ['dragon']),
        createRace('tiefling', '提夫林', 'Ram horns, reddish skin, glowing yellow eyes.', ['horns', 'tail'], [], ['demon']),
        createRace('cyborg', '賽博格', 'Augmented soldier, heavy mechanical exoskeleton.', ['mechanical arm'], [], ['tech']),
        createRace('undead', '死亡騎士', 'Rotted skin, glowing ice-blue eyes, frost armor.', ['glowing blue eyes'], [], ['undead']),
        createRace('giant', '巨人', 'Stone skin, massive towering height, tribal markings.', ['rocky skin'], ['small'], ['giant']),
        createRace('merman', '人魚', 'Powerful torso, shimmering scales, trident handler.', ['fish tail'], ['legs'], ['water'])
    ]
};

// 2. 完整職業庫 (Jobs - 15+)
export const FANTASY_JOBS_V8: Record<'male' | 'female', FantasyPresetV8[]> = {
    female: [
        createJob('mage', '法師', ['arcane staff', 'levitating book'], ['casting spell'], ['blue magic runes']),
        createJob('swordsman', '劍士', ['silver plate armor', 'broadsword'], ['combat stance'], ['battle dust']),
        createJob('assassin', '刺客', ['black tactical suit', 'mask'], ['mid-air strike'], ['motion blur']),
        createJob('cleric', '聖職者', ['white divine robes', 'holy mace'], ['healing prayer'], ['golden light']),
        createJob('archer', '弓箭手', ['ranger gear', 'longbow'], ['drawing arrow'], ['wind gusts']),
        createJob('paladin', '聖騎士', ['golden heavy armor', 'blazing sword'], ['oath-taking'], ['sun rays']),
        createJob('necromancer', '死靈法師', ['tattered black robes', 'skull staff'], ['summoning'], ['green spectral fire']),
        createJob('druid', '德魯伊', ['leafy clothes', 'wooden staff'], ['channeling nature'], ['growing flowers']),
        createJob('bard', '吟遊詩人', ['colorful clothes', 'golden lute'], ['playing music'], ['musical notes']),
        createJob('swordsman', '劍士', ['simple gi', 'bandaged hands'], ['martial arts kick'], ['chi energy']),
        createJob('knight', '騎士', ['winged helmet', 'spear'], ['diving from clouds'], ['lightning']),
        createJob('swordsman', '武士', ['ornate armor', 'katana'], ['iaido draw'], ['cherry blossoms']),
        createJob('ranger', '遊俠', ['duster coat', 'revolvers'], ['spinning guns'], ['gunsmoke']),
        createJob('nun', '修女', ['regal gown', 'tiara'], ['elegant curtsy'], ['sparkles']),
        createJob('elementalist', '元素使', ['robes shifting', 'magic energy'], ['casting elements'], ['energy storm']),
        createJob('alchemist', '鍊金術師', ['leather apron', 'flasks'], ['brewing potions'], ['chemical steam'])
    ],
    male: [
        createJob('mage', '法師', ['mystical robes', 'wizard staff'], ['casting fire'], ['fireballs']),
        createJob('swordsman', '戰士', ['heavy steel armor', 'massive axe'], ['swinging weapon'], ['impact craters']),
        createJob('assassin', '刺客', ['hooded cloak', 'throwing knives'], ['hiding in shadows'], ['invisibility']),
        createJob('ranger', '遊俠', ['fur and leather gear', 'crossbow'], ['tracking prey'], ['forest tracks']),
        createJob('cleric', '聖職者', ['shaolin cloth', 'prayer beads'], ['meditating'], ['golden chi']),
        createJob('berserker', '狂戰士', ['animal fur', 'giant axe'], ['primal roar'], ['rage embers']),
        createJob('necromancer', '死靈法師', ['bone robes', 'scythe'], ['raising skeletons'], ['shadow mist']),
        createJob('paladin', '聖騎士', ['golden armor', 'holy shield'], ['defending'], ['silver aura']),
        createJob('necromancer', '死靈法師', ['eldritch robes', 'tome'], ['forbidden ritual'], ['purple blast']),
        createJob('druid', '德魯伊', ['bark armor', 'living staff'], ['transforming'], ['emerald leaves']),
        createJob('swordsman', '武士', ['classic gear', 'nodachi'], ['precise strike'], ['sword glint']),
        createJob('ninja', '忍者', ['black shozoku', 'kusarigama'], ['vanishing'], ['smoke screen']),
        createJob('knight', '騎士', ['tricorne hat', 'cutlass'], ['boarding ship'], ['sea spray']),
        createJob('archer', '弓箭手', ['leather chaps', 'rifle'], ['long-range aiming'], ['dust clouds']),
        createJob('bard', '吟遊詩人', ['ermine cape', 'scepter'], ['sitting on throne'], ['gold coins']),
        createJob('elementalist', '元素使', ['flowing robes', 'staff'], ['controlling elements'], ['lightning'])
    ]
};

// 3. 完整場景庫 (Scenes - 12+)
export const FANTASY_SCENES_V8: ScenePresetV8[] = [
    { id: 'forest', name: '神秘森林 (Ancient Forest)', labelZh: '神秘森林 (Ancient Forest)', category: 'nature', environment: 'Enchanted foggy forest, glowing mushrooms, sunbeams', lightingRig: 'Dappled sunlight' },
    { id: 'volcano', name: '火山核心 (Lava Core)', labelZh: '火山核心 (Lava Core)', category: 'nature', environment: 'Active volcano interior, rivers of lava, obsidian rocks', lightingRig: 'Underglow from magma' },
    { id: 'sky_temple', name: '天空神殿 (Sky Temple)', labelZh: '天空神殿 (Sky Temple)', category: 'mystical', environment: 'Floating marble temple above clouds, waterfalls in sky', lightingRig: 'High-key sunlight' },
    { id: 'underwater', name: '深海遺跡 (Sunken Ruins)', labelZh: '深海遺跡 (Sunken Ruins)', category: 'nature', environment: 'Deep ocean floor, coral statues, filtering light', lightingRig: 'Caustics patterns' },
    { id: 'cyber_city', name: '霓虹城市 (Cyber District)', labelZh: '霓虹城市 (Cyber District)', category: 'urban', environment: 'Rainy futuristic city street, holographic signs', lightingRig: 'Neon reflections' },
    { id: 'desert_ruins', name: '沙漠遺跡 (Sand Ruins)', labelZh: '沙漠遺跡 (Sand Ruins)', category: 'nature', environment: 'Endless red dunes, half-buried giant statues', lightingRig: 'Harsh high sun' },
    { id: 'ice_cavern', name: '冰晶洞窟 (Frozen Cave)', labelZh: '冰晶洞窟 (Frozen Cave)', category: 'nature', environment: 'Cave of glowing blue ice crystals, frozen lake', lightingRig: 'Crystalline refraction' },
    { id: 'space_station', name: '星際空間 (Deep Space)', labelZh: '星際空間 (Deep Space)', category: 'urban', environment: 'Sci-fi station bridge, window looking at black hole', lightingRig: 'Cold console light' },
    { id: 'medieval_castle', name: '中世紀城堡 (Stone Hall)', labelZh: '中世紀城堡 (Stone Hall)', category: 'interior', environment: 'Grand gothic stone hall, iron chandeliers', lightingRig: 'Warm torchlight' },
    { id: 'battlefield', name: '古戰場 (War Zone)', labelZh: '古戰場 (War Zone)', category: 'nature', environment: 'Smoldering battlefield, mud, broken flags', lightingRig: 'Moody grey light' },
    { id: 'library', name: '奧術圖書館 (The Archive)', labelZh: '奧術圖書館 (The Archive)', category: 'interior', environment: 'Infinite library with floating books', lightingRig: 'Bioluminescence' },
    { id: 'tavern', name: '冒險者酒館 (The Tavern)', labelZh: '冒險者酒館 (The Tavern)', category: 'interior', environment: 'Cozy rustic wooden tavern, fireplace crackling', lightingRig: 'Hearth fire glow' },
    /* FIX: Added required lightingRig property to custom preset */
    { id: 'custom', name: '自訂場景描述 (Custom)', labelZh: '自訂場景描述 (Custom)', category: 'mystical', environment: 'User-defined', lightingRig: 'User-defined lighting' }
];

// 4. 姿勢與表情過濾條件 (Universal 15+, Specialized 5+)
export const POSE_LIBRARY_V8: PoseV8[] = [
    // 通用 (Universal - 18)
    { id: 'u_stand', label: '自信站姿', category: 'universal', intensity: 1, hands: 'relaxed', prop: 'none', symmetry: 'center', promptTemplate: 'standing confidently, majestic posture, direct eye contact' },
    { id: 'u_lean', label: '倚靠牆面', category: 'universal', intensity: 2, hands: 'crossed', prop: 'none', symmetry: 'asym', promptTemplate: 'leaning casually against a stone pillar, relaxed cool vibe' },
    { id: 'u_throne', label: '王座坐姿', category: 'universal', intensity: 2, hands: 'on armrests', prop: 'chair', symmetry: 'center', promptTemplate: 'sitting on an elaborate ancient throne, authoritative' },
    { id: 'u_kneel', label: '單膝下跪', category: 'universal', intensity: 3, hands: 'resting', prop: 'none', symmetry: 'asym', promptTemplate: 'kneeling in front of a higher power, knightly pledge' },
    { id: 'u_look_away', label: '望向遠方', category: 'universal', intensity: 1, hands: 'relaxed', prop: 'none', symmetry: 'asym', promptTemplate: 'looking away into the distance, contemplative' },
    { id: 'u_hands_hips', label: '雙手叉腰', category: 'universal', intensity: 2, hands: 'on hips', prop: 'none', symmetry: 'center', promptTemplate: 'hands firmly on hips, assertive and heroic' },
    { id: 'u_portrait', label: '特寫肖像', category: 'universal', intensity: 1, hands: 'none', prop: 'none', symmetry: 'center', promptTemplate: 'dramatic close-up headshot, focus on identity' },
    { id: 'u_walking', label: '自信行走', category: 'universal', intensity: 4, hands: 'swinging', prop: 'none', symmetry: 'asym', promptTemplate: 'mid-stride walking towards camera, dynamic' },
    { id: 'u_crossed', label: '雙臂抱胸', category: 'universal', intensity: 2, hands: 'crossed', prop: 'none', symmetry: 'center', promptTemplate: 'standing with arms crossed, determined and stoic' },
    { id: 'u_look_up', label: '仰望天空', category: 'universal', intensity: 1, hands: 'at sides', prop: 'none', symmetry: 'center', promptTemplate: 'head tilted back looking up, hopeful posture' },
    { id: 'u_face_touch', label: '手撫臉龐', category: 'universal', intensity: 2, hands: 'touching face', prop: 'none', symmetry: 'asym', promptTemplate: 'one hand gently touching cheek, intimate and soft' },
    { id: 'u_cross_legged', label: '盤腿而坐', category: 'universal', intensity: 2, hands: 'on knees', prop: 'none', symmetry: 'center', promptTemplate: 'sitting cross-legged on floor, grounded and calm' },
    { id: 'u_back_view', label: '背影回眸', category: 'universal', intensity: 3, hands: 'none', prop: 'none', symmetry: 'asym', promptTemplate: 'view from behind, head turned looking over shoulder' },
    { id: 'u_pointing', label: '指引前方', category: 'universal', intensity: 3, hands: 'pointing', prop: 'none', symmetry: 'asym', promptTemplate: 'one arm outstretched pointing forward, leader posture' },
    { id: 'u_adjusting', label: '整理袖口', category: 'universal', intensity: 2, hands: 'adjusting', prop: 'none', symmetry: 'asym', promptTemplate: 'fiddling with clothing cuff, high-fashion move' },
    { id: 'u_statue', label: '堅毅站立', category: 'universal', intensity: 1, hands: 'at sides', prop: 'none', symmetry: 'center', promptTemplate: 'standing like a solid statue, unshakeable' },
    { id: 'u_low_crouch', label: '低姿態蹲伏', category: 'universal', intensity: 5, hands: 'on ground', prop: 'none', symmetry: 'asym', promptTemplate: 'crouching low to ground, weight on balls of feet' },
    { id: 'u_reach', label: '向外伸手', category: 'universal', intensity: 4, hands: 'reaching', prop: 'none', symmetry: 'asym', promptTemplate: 'one hand reaching out toward viewer, inviting' },

    // 專屬 - 施法者 (Job: Mage/Necromancer/Warlock - 5+)
    { id: 's_mage_orb', label: '法師：手托法球', category: 'specialized', intensity: 6, hands: 'cupping', prop: 'magic', symmetry: 'center', requirements: { job: ['mage', 'necromancer', 'alchemist'] }, promptTemplate: 'cupping a glowing arcane orb, magical energy swirling' },
    { id: 's_mage_slam', label: '法師：法杖震地', category: 'specialized', intensity: 8, hands: 'gripping staff', prop: 'staff', symmetry: 'center', requirements: { job: ['mage', 'necromancer', 'druid'] }, promptTemplate: 'slamming a mystical staff into ground, radiating shockwave' },
    { id: 's_mage_sky', label: '法師：引導星辰', category: 'specialized', intensity: 7, hands: 'raised', prop: 'magic', symmetry: 'center', requirements: { job: ['mage', 'cleric', 'knight'] }, promptTemplate: 'arms raised toward heavens, eyes glowing, cosmic power' },
    { id: 's_mage_book', label: '法師：閱覽奧術', category: 'specialized', intensity: 4, hands: 'holding book', prop: 'book', symmetry: 'asym', requirements: { job: ['mage', 'necromancer'] }, promptTemplate: 'studying a levitating ancient spellbook with subtle gestures' },
    { id: 's_mage_float', label: '法師：懸浮冥想', category: 'specialized', intensity: 7, hands: 'mudra', prop: 'magic', symmetry: 'center', requirements: { job: ['mage', 'cleric'] }, promptTemplate: 'floating in mid-air in lotus position, surrounded by runes' },

    // 專屬 - 戰鬥系 (Job: Warrior/Paladin/Samurai - 5+)
    { id: 's_war_guard', label: '戰士：持劍警戒', category: 'specialized', intensity: 5, hands: 'gripping sword', prop: 'sword', symmetry: 'asym', requirements: { job: ['swordsman', 'paladin', 'knight'] }, promptTemplate: 'sword in defensive guard position, tensed muscles, battle-ready' },
    { id: 's_war_shield', label: '戰士：舉盾格擋', category: 'specialized', intensity: 6, hands: 'holding shield', prop: 'shield', symmetry: 'asym', requirements: { job: ['swordsman', 'paladin'] }, promptTemplate: 'crouching behind heavy shield, sparks flying from impact' },
    { id: 's_war_roar', label: '戰士：勝利戰吼', category: 'specialized', intensity: 10, hands: 'weapon raised', prop: 'weapon', symmetry: 'center', requirements: { job: ['swordsman', 'berserker'] }, promptTemplate: 'standing over fallen foe, weapon raised high, triumphant' },
    { id: 's_war_strike', label: '戰士：雙手重劈', category: 'specialized', intensity: 9, hands: 'two-handed grip', prop: 'axe', symmetry: 'asym', requirements: { job: ['swordsman', 'berserker'] }, promptTemplate: 'swinging massive weapon downward with full physical force' },
    { id: 's_war_oath', label: '戰士：騎士之誓', category: 'specialized', intensity: 3, hands: 'on sword hilt', prop: 'sword', symmetry: 'center', requirements: { job: ['paladin', 'swordsman', 'cleric'] }, promptTemplate: 'standing with hands on sword hilt planted in ground, noble bow' },

    // 專屬 - 潛行系 (Job: Assassin/Rogue/Ninja - 5+)
    { id: 's_rogue_shadow', label: '刺客：影子潛行', category: 'specialized', intensity: 4, hands: 'ready', prop: 'dagger', symmetry: 'asym', requirements: { job: ['assassin', 'ninja'] }, promptTemplate: 'crouched in shadows, silent movement, hand on blade' },
    { id: 's_rogue_leap', label: '刺客：飛簷走壁', category: 'specialized', intensity: 9, hands: 'reaching', prop: 'none', symmetry: 'asym', requirements: { job: ['assassin', 'ninja'] }, promptTemplate: 'leaping between rooftops, body extended, gravity-defying' },
    { id: 's_rogue_smoke', label: '刺客：煙霧消失', category: 'specialized', intensity: 5, hands: 'seal', prop: 'smoke', symmetry: 'center', requirements: { job: ['ninja', 'assassin'] }, promptTemplate: 'vanishing into swirl of smoke, only silhouette visible' },
    { id: 's_rogue_cling', label: '刺客：攀附岩壁', category: 'specialized', intensity: 6, hands: 'clinging', prop: 'none', symmetry: 'asym', requirements: { job: ['assassin', 'ranger'] }, promptTemplate: 'clinging to vertical surface, stealthy observation' },
    { id: 's_rogue_wire', label: '刺客：絲線平衡', category: 'specialized', intensity: 7, hands: 'balancing', prop: 'none', symmetry: 'center', requirements: { job: ['assassin', 'ninja'] }, promptTemplate: 'standing on thin wire, arms outstretched, perfect zen balance' },

    // 專屬 - 種族特性 (Race: Angel/Kitsune/Mermaid - 5+)
    { id: 's_race_wings', label: '種族：展翅高飛', category: 'specialized', intensity: 5, hands: 'outstretched', prop: 'wings', symmetry: 'center', requirements: { race: ['angel', 'demon', 'fairy'] }, promptTemplate: 'soaring through clouds, massive wings fully extended' },
    { id: 's_race_mermaid', label: '種族：人魚游動', category: 'specialized', intensity: 5, hands: 'swimming', prop: 'tail', symmetry: 'center', requirements: { race: ['mermaid', 'merman'] }, promptTemplate: 'swimming with powerful strokes, shimmering fish tail' },
    { id: 's_race_kitsune', label: '種族：九尾降臨', category: 'specialized', intensity: 6, hands: 'foxfire', prop: 'tails', symmetry: 'center', requirements: { race: ['kitsune'] }, promptTemplate: 'surrounded by nine glowing tails, blue flames on fingers' },
    { id: 's_race_cyborg', label: '種族：系統重啟', category: 'specialized', intensity: 7, hands: 'stiff', prop: 'tech', symmetry: 'center', requirements: { race: ['cyborg', 'android'] }, promptTemplate: 'standing stiffly, panel lines glowing, internal parts visible' },
    { id: 's_race_undead', label: '種族：亡靈甦醒', category: 'specialized', intensity: 8, hands: 'clawing', prop: 'spectral', symmetry: 'asym', requirements: { race: ['undead'] }, promptTemplate: 'crawling out of portal, spectral blue energy leaking from eyes' }
];

export const FANTASY_EXPRESSIONS_V8: FantasyExpressionV8[] = [
    // 通用 (Universal - 18)
    { id: 'u_neutral', label: '平靜中性', category: 'universal', cues: 'stoic, calm, neutral facial expression, steady gaze' },
    { id: 'u_happy', label: '快樂微笑', category: 'universal', cues: 'warm smile, joyful eyes, friendly expression' },
    { id: 'u_sad', label: '悲傷流淚', category: 'universal', cues: 'melancholy, tear streaks, sorrowful eyes' },
    { id: 'u_surprised', label: '驚訝萬分', category: 'universal', cues: 'wide eyes, gasping, eyebrows raised high' },
    { id: 'u_disgust', label: '輕蔑厭惡', category: 'universal', cues: 'looking down with disdain, sneering lip' },
    { id: 'u_fear', label: '極度恐懼', category: 'universal', cues: 'terror, dilated pupils, trembling face' },
    { id: 'u_thoughtful', label: '沉思中', category: 'universal', cues: 'eyes looking slightly up, furrowed brow' },
    { id: 'u_pouty', label: '噘嘴不滿', category: 'universal', cues: 'pouting lips, crossing eyes slightly, playful' },
    { id: 'u_winking', label: '調皮眨眼', category: 'universal', cues: 'one eye closed in a wink, cheeky grin' },
    { id: 'u_sleeping', label: '安詳沉睡', category: 'universal', cues: 'eyes closed, relaxed features' },
    { id: 'u_tired', label: '疲憊不堪', category: 'universal', cues: 'heavy eyelids, dark circles, exhausted' },
    { id: 'u_confused', label: '困惑不解', category: 'universal', cues: 'tilted head, one eyebrow raised' },
    { id: 'u_bored', label: '無聊厭世', category: 'universal', cues: 'blank stare, chin on hand, total lack of interest' },
    { id: 'u_cry_joy', label: '喜極而泣', category: 'universal', cues: 'tears of happiness, wide smile' },
    { id: 'u_shy', label: '羞澀紅暈', category: 'universal', cues: 'blushing cheeks, looking down, shy smile' },
    { id: 'u_smirk', label: '自信壞笑', category: 'universal', cues: 'asymmetric smirk, confident eyes, slight head tilt' },
    { id: 'u_pain', label: '痛苦掙扎', category: 'universal', cues: 'wincing, eyes closed tight, gritting teeth' },
    { id: 'u_determined', label: '堅定決心', category: 'universal', cues: 'locked jaw, sharp eyes, unwavering heroic look' },

    // 專屬 - 氛圍/種族 (Specialized - 5+)
    { id: 's_trance', label: '施法：神聖恍惚', category: 'specialized', cues: 'eyes glowing white, blank stare, possessed by magic, floating hair', requirements: { job: ['mage', 'necromancer', 'cleric'] } },
    { id: 's_beast', label: '獸族：野性瘋狂', category: 'specialized', cues: 'unhinged grin, animalistic eyes, dangerous expression', requirements: { race: ['kitsune', 'orc', 'werewolf'] } },
    { id: 's_celestial', label: '天使：天界寧靜', category: 'specialized', cues: 'serene smile, eyes closed, radiating golden light', requirements: { race: ['angel', 'elf'] } },
    { id: 's_villain', label: '反派：陰險算計', category: 'specialized', cues: 'narrowed eyes, sharp evil grin, shadow over face', requirements: { job: ['assassin', 'necromancer'], race: ['vampire', 'demon'] } },
    { id: 's_vampire', label: '吸血鬼：渴望鮮血', category: 'specialized', cues: 'smoldering gaze, extended fangs, red pupils', requirements: { race: ['vampire'] } }
];

export const PHOTO_LOCK_PROMPT = "Maintain 100% strict facial identity and bone structure of the provided person.";
export const PHOTO_LOCK_NEGATIVES = "(distorted face), (generic person), (face change), (low quality)";
