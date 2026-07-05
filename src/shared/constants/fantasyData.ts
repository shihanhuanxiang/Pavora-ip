import { FantasyRace, FantasyJob, ScenePresetV8, FantasyLightingV4, FantasyCompositionV4, CelestialEventV4, AtmosEffectV4, FantasyCompanionV4, PoseV8, FantasyExpressionV8 } from '../types/types';

/**
 * 幻想系列 4.0 - 性別過濾種族預設
 */

export const FANTASY_RACES_V4: FantasyRace[] = [
    // --- 凡世與精靈 (Common & Elves) ---
    {
        name: 'human',
        labelZh: '人類 (Human)',
        category: '凡世與精靈',
        gender: 'universal',
        description: '標準人類，最高五官相容性。',
        prompt_en: 'Based on the facial features of the reference image, generate a fantasy human hero portrait. CRITICAL: The face must strictly match the reference image: identical eye shape, nose structure, lip curve, and jawline. Wearing highly detailed cinematic fantasy medieval attire, soft ambient lighting, material fidelity: high, ultra-detailed 8K.',
        tags: ['standard', 'hero', 'versatile']
    },
    // --- OLD RACES BELOW ---
    {
        name: 'hobbit',
        labelZh: '哈比人 (Hobbit)',
        category: '凡世與精靈',
        gender: 'universal',
        description: '嬌小比例，純真且具備親和力的五官。',
        prompt_en: 'Based on the facial features of the reference image, generate a hobbit halfling portrait. CRITICAL: Maintain 100% facial structure of the reference. The character has a slightly smaller body proportion, curly hair, wearing a cozy rustic waistcoat and travel cloak, standing in a sun-drenched hill village, ultra-detailed 8K.',
        tags: ['small', 'cozy', 'halfling']
    },
    {
        name: 'elf',
        labelZh: '精靈 (Elf)',
        category: '凡世與精靈',
        gender: 'universal',
        description: '長壽優雅，具有標誌性的尖耳。',
        prompt_en: 'Based on the facial features of the reference image, generate an elegant elf portrait. CRITICAL: Keep the original facial identity from the reference image. Features elegantly pointed ears, long silken hair, wearing flowing elven silver robes with leaf motifs, soft ethereal forest glow, ultra-detailed 8K.',
        tags: ['nature', 'ears', 'elegant']
    },
    {
        name: 'high_elf',
        labelZh: '高等精靈 (High Elf)',
        category: '凡世與精靈',
        gender: 'universal',
        description: '精靈貴族，強調極致的華麗與高潔。',
        prompt_en: 'Based on the facial features of the reference image, generate a high elf noble portrait. CRITICAL: Exact facial features from the reference must be preserved. Refined pointed ears, wearing magnificent gold-trimmed elven court robes with a jeweled crown, ageless divine beauty, crystalline lighting, ultra-detailed 8K.',
        tags: ['elf', 'magic', 'noble']
    },
    {
        name: 'dark_elf',
        labelZh: '暗精靈 (Dark Elf)',
        category: '凡世與精靈',
        gender: 'universal',
        description: '黑曜石般的皮膚與銀髮，強烈對比美感。',
        prompt_en: 'Based on the facial features of the reference image, generate a dark elf (drow) portrait. CRITICAL: Preserve the reference facial structure perfectly. Skin is a smooth obsidian charcoal tone, long silver pointed ears, ABSOLUTE silver-white hair (zero tint of other colors), black and violet elven armor with glowing violet arcane glyphs, dramatic shadows, ultra-detailed 8K.',
        tags: ['elf', 'dark', 'underground']
    },
    {
        name: 'half_elf',
        labelZh: '半精靈 (Half-Elf)',
        category: '凡世與精靈',
        gender: 'universal',
        description: '介於人類與精靈之間，五官特徵最為平衡柔和。',
        prompt_en: 'Based on the facial features of the reference image, generate a half-elf adventurer portrait. CRITICAL: 100% facial identity match to the reference. Slightly subtle pointed ears, wearing a mix of leather and silk travel gear, balanced and soft fantasy lighting, realistic skin texture, 8K resolution.',
        tags: ['elf', 'balanced', 'adventure']
    },
    {
        name: 'fairy',
        labelZh: '妖精 (Fairy)',
        category: '凡世與精靈',
        gender: 'universal',
        description: '輕盈靈動，具備半透明的蝴蝶或薄紗翅膀。',
        prompt_en: 'Based on the facial features of the reference image, generate a fairy portrait. CRITICAL: Facial features must strictly follow the reference. She has delicate translucent iridescent butterfly-like wings, surrounded by shimmering mana dust and glowing flowers, ethereal and small scale, cinematic fantasy lighting, ultra-detailed 8K.',
        tags: ['nature', 'wings', 'flying']
    },
    {
        name: 'dryad',
        labelZh: '樹精 (Dryad)',
        category: '凡世與精靈',
        gender: 'female',
        description: '植物與人的融合，皮膚帶有淡淡木紋或葉片飾品。',
        prompt_female_en: 'Based on the facial features of the reference image, generate a dryad spirit portrait. CRITICAL: Keep the original face. Hair is woven with living emerald leaves and branches, skin has subtle bark-like textures and vine markings, wearing organic robes made of flowers and moss, golden hour forest light, ultra-detailed 8K.',
        tags: ['nature', 'forest', 'spirit']
    },
    {
        name: 'undine',
        labelZh: '水中精靈 (Undine)',
        category: '凡世與精靈',
        gender: 'female',
        description: '水之化身，具有半透明水感的皮膚效果。',
        prompt_female_en: 'Based on the facial features of the reference image, generate an undine water spirit portrait. CRITICAL: Facial identity must be 100% consistent. Body and hair have a semi-transparent, liquid-like aquamarine quality, shimmering water-silk robes, surrounded by floating water droplets and bubbles, underwater lighting, ultra-detailed 8K.',
        tags: ['water', 'elemental', 'blue']
    },
    {
        name: 'sylph',
        labelZh: '風之使者 (Sylph)',
        category: '凡世與精靈',
        gender: 'universal',
        description: '身形輕盈，髮絲與服飾常呈現被風吹動的流態。',
        prompt_en: 'Based on the facial features of the reference image, generate a sylph wind spirit portrait. CRITICAL: Exact facial match to reference. Extremely light and lithe build, hair and translucent robes constantly flowing as if caught in a mystical breeze, soft pastel sky background, airy and bright lighting, ultra-detailed 8K.',
        tags: ['air', 'spirit', 'light']
    },
    {
        name: 'angel',
        labelZh: '天使 (Angel)',
        category: '神性與魔性',
        gender: 'universal',
        description: '神聖潔淨，具備巨大的純白羽翼與光環。',
        prompt_en: 'Based on the facial features of the reference image, generate an angel divine portrait. CRITICAL: Maintain exact facial structure. Large majestic white feathered wings, a glowing golden halo, wearing divine white and gold silk robes, divine pillars of light in the background, serene and powerful, ultra-detailed 8K.',
        tags: ['holy', 'wings', 'light']
    },
    {
        name: 'fallen_angel',
        labelZh: '墮天使 (Fallen Angel)',
        category: '神性與魔性',
        gender: 'universal',
        description: '曾是天使的墮落者，翅膀破損或呈現黑色。',
        prompt_en: 'Based on the facial features of the reference image, generate a fallen angel portrait. CRITICAL: Strict facial identity lock. Large tattered black feathered wings, wearing dark gothic silver-accented armor, pale skin, dramatic chiaroscuro lighting, feathers falling in a dark void, ultra-detailed 8K.',
        tags: ['dark', 'holy', 'gothic']
    },
    {
        name: 'demon',
        labelZh: '惡魔 (Demon)',
        category: '神性與魔性',
        gender: 'universal',
        description: '具備尖角與蝙蝠翼，臉部保留人類英雄感。',
        prompt_en: 'Based on the facial features of the reference image, generate a demon lord portrait. CRITICAL: 100% facial structure preserved. Curved black obsidian horns, large leathery bat-like wings, glowing eyes (color matching role), wearing spiked rhenish leather and dark metal armor, hellfire embers in the air, ultra-detailed 8K.',
        tags: ['dark', 'wings', 'hell']
    },
    {
        name: 'succubus_incubus',
        labelZh: '魅魔/夢魔 (Succubus/Incubus)',
        category: '神性與魔性',
        gender: 'universal',
        description: '極致魅惑，具有惡魔角與愛心型長尾。',
        prompt_en: 'Based on the facial features of the reference image, generate a succubus/incubus portrait. CRITICAL: Keep the original facial identity. Small elegant horns, slender pointed devil tail with a heart tip, wearing seductive dark lace or silk attire, smoky seductive atmosphere, luminous skin texture, ultra-detailed 8K.',
        tags: ['dark', 'demon', 'sexy']
    },
    {
        name: 'vampire',
        labelZh: '吸血鬼 (Vampire)',
        category: '神性與魔性',
        gender: 'universal',
        description: '蒼白、高貴、冷峻，具有經典尖牙。',
        prompt_en: 'Based on the facial features of the reference image, generate an aristocratic vampire portrait. CRITICAL: Exact facial bones of the reference. Alabaster pale skin, subtle sharp fangs, glowing crimson irises, wearing luxurious Victorian gothic velvet and silk clothing, dramatic candlelight shadows, ultra-detailed 8K.',
        tags: ['dark', 'noble', 'night']
    },
    {
        name: 'cyborg',
        labelZh: '賽博格 (Cyborg)',
        category: '神性與魔性',
        gender: 'universal',
        description: '科技與肉身的結合，帶有機械蝕刻。',
        prompt_en: 'Based on the facial features of the reference image, generate a cyborg sci-fi portrait. CRITICAL: Strict facial match. Part of the face or body features integrated sleek mechanical parts and glowing blue fiber-optic circuits, cybernetic eye implants, metallic textures, neon lighting, ultra-detailed 8K.',
        tags: ['tech', 'cybernetic', 'future']
    },
    {
        name: 'android',
        labelZh: '仿生人 (Android)',
        category: '神性與魔性',
        gender: 'universal',
        description: '人造的完美形態，皮膚呈現細緻的矽膠材質。',
        prompt_en: 'Based on the facial features of the reference image, generate an android portrait. CRITICAL: Preserve facial features. Synthetic perfection in skin texture with subtle panel lines, glowing internal frame visible at joints, pristine and sterile aesthetic, high-tech interface particles, ultra-detailed 8K.',
        tags: ['tech', 'robotic', 'perfect']
    },
    {
        name: 'ghost',
        labelZh: '幽靈 (Ghost)',
        category: '神性與魔性',
        gender: 'universal',
        description: '靈魂的留存，半透明且具備漂浮效果。',
        prompt_en: 'Based on the facial features of the reference image, generate a ghost spirit portrait. CRITICAL: 100% facial identity through transparency. The character is semi-transparent and luminous, emitting an ethereal blue or white glow, wearing tattered spectral robes, floating amidst swirling spectral wisps, haunting atmosphere, ultra-detailed 8K.',
        tags: ['spirit', 'undead', 'ethereal']
    },
    {
        name: 'tiefling',
        labelZh: '提夫林 (Tiefling)',
        category: '神性與魔性',
        gender: 'universal',
        description: '具有特殊的膚色與大角，呈現異域神祕感。',
        prompt_en: 'Based on the facial features of the reference image, generate a tiefling portrait. CRITICAL: Keep facial structure from reference. Skin is monochromatic red, lavender, or blue, large curved ram horns, glowing solid-colored eyes, wearing tribal leather and silver accessories, mysterious fire lighting, ultra-detailed 8K.',
        tags: ['demon', 'colored_skin', 'horns']
    },
    {
        name: 'star_born',
        labelZh: '星選者 (Star-Born)',
        category: '神性與魔性',
        gender: 'universal',
        description: '皮膚與瞳孔中常能見到星雲與星塵的流動。',
        prompt_en: 'Based on the facial features of the reference image, generate a celestial star-born portrait. CRITICAL: Preserve facial features. Skin is infused with shimmering cosmic dust, eyes contain swirling galaxies, wearing starlight-woven garments, surrounded by floating nebulae and constellations, cinematic cosmic lighting, 8K.',
        tags: ['celestial', 'magic', 'galaxy']
    },
    {
        name: 'dragon_blooded',
        labelZh: '龍裔 (Dragon-Blooded)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '臉頰帶有鱗片，具備橫向狹縫瞳孔。',
        prompt_en: 'Based on the facial features of the reference image, generate a dragon-blooded hero portrait. CRITICAL: Preserve the human facial structure perfectly while adding draconic traits. Shimmering scales patterns on cheeks and neck, elegant horns, vertical slit dragon irises, wearing dragon-scale metal armor, breathing faint golden energy mist, ultra-detailed 8K.',
        tags: ['dragon', 'scales', 'warrior']
    },

    // --- 男性種族 (Male) ---
    {
        name: 'kitsune',
        labelZh: '天狐 (Kitsune)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '神聖狐耳與九尾，五官呈日式纖細美。',
        prompt_en: 'Based on the facial features of the reference image, generate a kitsune nine-tailed fox spirit portrait. CRITICAL: Precise facial identity match. Lush human-shaped fox ears on top of head, nine magnificent bushy white-and-gold tipped fox tails fanning out. HAIR COLOR: Pure pearlescent white or natural golden-orange fox fur tones (matching race heritage). Wearing a traditional silk kimono with intricate patterns, magical fox-fire orbs, cherry blossom petals, ultra-detailed 8K.',
        tags: ['animal', 'kitsune', 'oriental']
    },
    {
        name: 'beastkin_cat',
        labelZh: '貓獸人 (Beastkin-Cat)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '靈活的貓耳與尾巴，面部保留完全的人類特徵。',
        prompt_en: 'Based on the facial features of the reference image, generate a cat beastkin portrait. CRITICAL: Strict facial identity lock. Adorable cat ears, a long expressive tail, subtle fur textures at the edges of the face, wearing stylish layered fantasy travel gear, nimble and sharp expression, ultra-detailed 8K.',
        tags: ['cat', 'beast', 'agile']
    },
    {
        name: 'beastkin_wolf',
        labelZh: '狼獸人 (Beastkin-Wolf)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '野性狼耳，面部帶有薩滿風格的油彩。',
        prompt_en: 'Based on the facial features of the reference image, generate a wolf beastkin warrior portrait. CRITICAL: Keeping the original human face. Sharp wolf ears, a thick tattered wolf tail, face painted with tribal markings, wearing fur-trimmed heavy leather armor, standing in a snowy mountain tundra, moonlit lighting, ultra-detailed 8K.',
        tags: ['wolf', 'beast', 'strong']
    },
    {
        name: 'lagomorph',
        labelZh: '兔靈族 (Lagomorph)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '修長的兔耳，五官特徵呈現溫柔、純真感。',
        prompt_en: 'Based on the facial features of the reference image, generate a rabbit-folk lagomorph portrait. CRITICAL: Strict facial structure preservation. Long soft bunny ears, a small fluffy tail, wearing a charming magical fantasy outfit with ribbon details, soft spring meadow lighting, innocent and graceful aesthetic, 8K.',
        tags: ['rabbit', 'beast', 'cute']
    },
    {
        name: 'mermaid_merman',
        labelZh: '人魚/魚人 (Mermaid/Merman)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '下身為魚尾，身體帶有美麗的生物發光鱗片。',
        prompt_en: 'Based on the facial features of the reference image, generate a mermaid/merman portrait. CRITICAL: Exact facial match. Lower body is a powerful iridescent fish tail, shimmering bioluminescent scales on skin, flowing aquatic hair, shell and pearl accessories, cinematic underwater lighting with sun rays (caustics), ultra-detailed 8K.',
        tags: ['ocean', 'mermaid', 'scales']
    },
    {
        name: 'medusa',
        labelZh: '美杜莎 (Gorgon)',
        category: '高級獸化與複合',
        gender: 'female',
        description: '頭髮為活生生的毒蛇，面容如精緻的雕像般完美。',
        prompt_female_en: 'Based on the facial features of the reference image, generate a Medusa Gorgon portrait. CRITICAL: The face must remain identical to the reference. Hair is a mesmerizing mass of living, moving golden snakes, wearing an ancient Greek silk gown with jewelry, eyes glowing with stone-turning magic, dark forest background, dramatic lighting, 8K.',
        tags: ['snake', 'mythology', 'stone']
    },
    {
        name: 'dwarf',
        labelZh: '矮人 (Dwarf)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '身級壯碩，強調精緻的編織鬍鬚或工匠氣息。',
        prompt_en: 'Based on the facial features of the reference image, generate a dwarf master portrait. CRITICAL: Maintain original facial character. Stocky and powerful build, wearing master-crafted runic heavy plate armor, holding an ornate war hammer, glowing embers from a forge, dramatic orange lighting, ultra-detailed 8K.',
        tags: ['strong', 'dwarf', 'forge']
    },
    {
        name: 'noble_orc',
        labelZh: '獸人貴族 (Noble Orc)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '膚色厚實，具有英雄氣概的強壯身軀。',
        prompt_en: 'Based on the facial features of the reference image, generate a noble orc warrior portrait. CRITICAL: Keep human-like facial structure from reference, avoiding full animal face. Skin is thick grayish-green, small protruding tusks, wearing heavy iron armor with war trophies, battle-worn and majestic, smoldering battlefield ruins, 8K.',
        tags: ['orc', 'strong', 'noble']
    },
    {
        name: 'dullahan',
        labelZh: '無頭騎士 (Dullahan)',
        category: '高級獸化與複合',
        gender: 'universal',
        description: '身著重裝鎧甲，頸部為燃燒的藍色靈魂火。',
        prompt_en: 'Based on the facial features of the reference image, generate a Dullahan knight portrait. CRITICAL: The reference face is manifested as a spectral, semi-transparent glowing vision above the neck. Wearing dark enchanted knight armor, neck area is aflame with blue/violet mystical soul fire, holding a spine-whip, misty graveyard night, ultra-detailed 8K.',
        tags: ['dark', 'headless', 'magic']
    },
];

export const FANTASY_JOBS_V4: FantasyJob[] = [
    // 【重裝武力系 (Might & Vigor)】
    {
        name: 'swordsman', labelZh: '劍士 (Swordsman)', type: '重裝武力系 (Might & Vigor)', reference: '魔獸世界、最終幻想', gender: 'universal',
        description: '重型板甲、大劍或戰斧、戰鬥痕跡與扈從。',
        prompt_female_en: 'female swordsman warrior, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. architectural form-sculpted silver plate armour with bold artistic cutouts at the midriff and shoulders, daring asymmetric necklines, sheer metallic mesh overlays, wielding a massive jagged greatsword, accompanied by a small spectral floating shield familiar, standing on a massive glowing iron-anvil magic circle with sparks, cinematic wide-angle low perspective, battlefield ruins background.',
        prompt_male_en: 'male swordsman, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. massive architectural steel plate armour with exposed dynamic musculature through gaps, enormous broadsword, accompanied by a clever spectral hunting hound familiar, standing on a radiant sword-sigil magic circle, cinematic low angle, fires burning in the distance, dramatic smoke.',
        tags: ['might_vigor', 'armor', 'strong', 'servant', 'sigil']
    },
    {
        name: 'paladin', labelZh: '聖騎士 (Paladin)', type: '重裝武力系 (Might & Vigor)', reference: 'Fate系列、魔獸世界', gender: 'universal',
        description: '聖劍與神光、守護信仰的鋼鐵長城。',
        prompt_female_en: 'female paladin, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. ultra-daring white and gold divine plate armour with sheer silk-mesh panels, plunging architectural bodice, winged golden spaulders, radiant longsword blazing with holy light, accompanied by a tiny floating seraphim cherub, standing on a brilliant solar-cross magic circle reflected on marble, cinematic wide-angle worm-eye view, soft heavenly rays.',
        prompt_male_en: 'male paladin, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. magnificent white and gold architectural armor with open-front design, holy sword blazing with white-gold fire, accompanied by a floating ancient gold bible familiar, standing on a radiant geometric halo magic circle, low-angle perspective, sacred temple entrance.',
        tags: ['might_vigor', 'holy', 'warrior', 'servant', 'sigil']
    },
    {
        name: 'knight', labelZh: '騎士 (Knight)', type: '重裝武力系 (Might & Vigor)', reference: '聖女貞德、Fate系列', gender: 'universal',
        description: '銀/黑板甲、盾牌、隨從格里芬。',
        prompt_female_en: 'female knight, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. avant-garde sculpted silver plate armour with daring open-back and deep V-neck structures, house crest on breastplate, billowing cape, accompanied by a soaring spectral silver gryphon familiar, standing on a glowing platinum knightly crest magic circle, extreme wide-angle upward perspective, golden hour light.',
        prompt_male_en: 'male knight, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. gleaming architectural silver plate armour with leather harness details, longsword at ready, accompanied by a floating majestic shield spirit, standing on a radiant silver cross magic circle, dramatic wide-angle cathedral backdrop.',
        tags: ['might_vigor', 'armor', 'noble', 'servant', 'sigil']
    },
    {
        name: 'berserker', labelZh: '狂戰士 (Berserker)', type: '重裝武力系 (Might & Vigor)', reference: 'Berserk、魔獸世界', gender: 'universal',
        description: '野性皮甲、雙手巨斧、狂暴血光與狼影。',
        prompt_female_en: 'female berserker warrior, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring tattered furs and heavy iron harness with minimal chest coverage, exposed abs, leather strap bindings, wielding two blood-stained axes, accompanied by a roaring spectral blood-red wolf familiar, standing on a jagged dark-red arcane magic circle, extreme low-angle wide distortion, battlefield ruins.',
        prompt_male_en: 'male berserker, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. primal iron-spiked harness, bare chest with battle scars, wielding a colossal iron greataxe, red eyes, accompanied by a massive spectral grizzly bear spirit, standing on a cracked earth magic circle glowing with lava, dramatic wide perspective.',
        tags: ['might_vigor', 'rage', 'heavy', 'servant', 'sigil']
    },
    {
        name: 'dragoon', labelZh: '龍騎士 (Dragoon)', type: '重裝武力系 (Might & Vigor)', reference: '最終幻想、Legend of Dragoon', gender: 'universal',
        description: '湛藍龍鱗盔甲、飛龍長矛。',
        prompt_female_en: 'female dragoon, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. sleek avant-garde azure dragon-scale plate armour with sheer midriff panels and daring plunging neckline, draconic fins, wielding a long lance, accompanied by a small wyvern familiar, standing on a glowing dragon-wing magic circle, extreme wide-angle sky view, mountain peaks.',
        prompt_male_en: 'male dragoon, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. cobalt draconic architectural armour with open-chest scale patterns, heavy dragon-bone lance, accompanied by a circling sapphire dragon spirit, standing on a glowing dragon-eye magic circle, sky castle backdrop, wide perspective distortion.',
        tags: ['might_vigor', 'dragon', 'jump', 'servant', 'sigil']
    },
    {
        name: 'samurai', labelZh: '東方武士 (Samurai)', type: '重裝武力系 (Might & Vigor)', reference: '仁王、對馬戰鬼', gender: 'universal',
        description: '東方漆甲、櫻花居合及靈鶴。',
        prompt_female_en: 'female samurai, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. architectural cherry-blossom silk robes with daring geometric cutouts at the neck and ribcage, lacquered lamellar armour accents, katana mid-sheath, accompanied by spectral spirit cranes, standing on a glowing Zen Enso circle, falling petals, extreme 14mm wide-angle room perspective.',
        prompt_male_en: 'male samurai, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. heavy crimson lacquered demonic armour with exposed strong upper body details, dual katana, accompanied by a floating ghostly flame fox familiar, standing on a glowing shinto sigil, wide-perspective blizzard of petals.',
        tags: ['might_vigor', 'oriental', 'blade', 'servant', 'sigil']
    },
    {
        name: 'gladiator', labelZh: '角鬥士 (Gladiator)', type: '重裝武力系 (Might & Vigor)', reference: '神鬼戰士、League of Legends', gender: 'universal',
        description: '黃沙與榮耀、三叉戟與沙獅。',
        prompt_female_en: 'female gladiator champion, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. asymmetric bronze harness with minimal daring coverage, exposed athletic form, sheer mesh-wrap on waist, trident and net, accompanied by a spectral sand-spirit lion, standing on an ancient colosseum magic circle, extreme wide-angle colosseum arena perspective.',
        prompt_male_en: 'male gladiator, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. heavy single-shoulder manica armguard, scarred muscular bare-chest build, large gladius, accompanied by a skeletal cerberus hound, standing on a circular sandy arena magic circle, wide sunset colosseum view.',
        tags: ['might_vigor', 'arena', 'strength', 'servant', 'sigil']
    },

    // 【奧秘法術系 (Arcane & Eldritch)】
    {
        name: 'mage', labelZh: '法師 (Mage)', type: '奧秘法術系 (Arcane & Eldritch)', reference: '龍與地下城、最終幻想', gender: 'universal',
        description: '星紋長袍、魔法杖與法球。',
        prompt_female_en: 'female sorceress, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. architectural midnight-blue star-silk dress with super-deep V-neckline and daring high-slits, translucent celestial fabric overlays, ribcage cutouts, accompanied by a floating mana-sphere, standing on a massive complex geometric magic circle, extreme wide-angle arcane vortex perspective.',
        prompt_male_en: 'male archmage, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. layered velvet robes with exposed front and intricate silver bindings, tall hat, staff of lightning, accompanied by a spectral owl, standing on a glowing mana-diagram, wide-perspective library background.',
        tags: ['arcane_eldritch', 'magic', 'robes', 'servant', 'sigil']
    },
    {
        name: 'elementalist', labelZh: '元素使 (Elementalist)', type: '奧秘法術系 (Arcane & Eldritch)', reference: '最終幻想、Guild Wars 2', gender: 'universal',
        description: '四元素長袍、元素精靈。',
        prompt_female_en: 'female elementalist, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. ethereal avant-garde silks with fire and water motifs, daring bikini-style armor bits, sheer multi-layered mesh skirt with high-slits, accompanied by a phoenix wisp, standing on a massive four-element compass magic circle, extreme wide-angle elemental convergence storm view.',
        prompt_male_en: 'male elemental master, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. robes shifting from lava-red to frost-blue with exposed chest and arms, accompanied by a floating earth-spirit golem, standing on a glowing multi-elemental vortex, wide volcanic and arctic backdrop.',
        tags: ['arcane_eldritch', 'elements', 'magic', 'servant', 'sigil']
    },
    {
        name: 'alchemist', labelZh: '鍊金術師 (Alchemist)', type: '奧秘法術系 (Arcane & Eldritch)', reference: 'Atelier系列、鋼之煉金術師', gender: 'universal',
        description: '皮革圍裙、藥劑瓶與發條僕人。',
        prompt_female_en: 'female alchemist, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring open-back leather apron over sheer white blouse, corset-style belt with vials, holding glowing emerald elixir, accompanied by a floating clockwork homunculus, standing on a glowing transmutation sigil, 14mm wide-angle laboratory perspective.',
        prompt_male_en: 'male alchemist, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. leather tool-belt and harness with exposed chest armor, brass goggles, accompanied by a mechanical brass cat, standing on a complex glowing alchemy-array, wide lab with green flames.',
        tags: ['arcane_eldritch', 'science', 'magic', 'servant', 'sigil']
    },
    {
        name: 'necromancer', labelZh: '死靈法師 (Necromancer)', type: '奧秘法術系 (Arcane & Eldritch)', reference: '暗黑破壞神、龍與地下城', gender: 'universal',
        description: '骨紋黑袍、骷髏權杖與魂鴉。',
        prompt_female_en: 'female necromancer, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. super-sheer tattered black lace robes with bone-corset details, exposed clavicles and shoulders, holding skull-staff, accompanied by a spectral skeleton raven, standing on a massive glowing green pentagram magic circle, extreme 14mm wide-angle cemetery perspective.',
        prompt_male_en: 'male necromancer, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. dark tattered robes with exposed rib-cage armor, massive scythe, accompanied by shadow ghoul, standing on a glowing necro-runic circle, wide purple necrotic view.',
        tags: ['arcane_eldritch', 'undead', 'magic', 'servant', 'sigil']
    },
    {
        name: 'summoner', labelZh: '召喚師 (Summoner)', type: '奧秘法術系 (Arcane & Eldritch)', reference: '最終幻想、League of Legends', gender: 'universal',
        description: '異位面契約、傳說巨獸共鳴。',
        prompt_female_en: 'female grand summoner, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. ethereal avant-garde silks with sheer-mesh and plunging geometric cuts, floaty gossamer layers, accompanied by a COLOSSAL spectral celestial beast filling the frame, standing on a massive glowing star-chart magic circle, extreme wide-angle distortion, sky void.',
        prompt_male_en: 'male summoner, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. royal summoner robes with open chest and dynamic arm bindings, staff of energy, accompanied by three fairy-dragoons, standing on a massive glowing multidimensional rift, extreme wide perspective.',
        tags: ['arcane_eldritch', 'summon', 'magic', 'servant', 'sigil']
    },
    {
        name: 'spellblade', labelZh: '魔法劍士 (Spellblade)', type: '奧秘法術系 (Arcane & Eldritch)', reference: '艾爾登法環、魔獸世界', gender: 'universal',
        description: '利刃加持奧法、飛空魔劍。',
        prompt_female_en: 'female spellblade, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. avant-garde runic plate over sheer-mesh bodysuit with daring cutouts, wielding crystalline flame-blade, accompanied by floating daggers, standing on a massive glowing hexagonal field, 14mm wide-angle energy blast perspective.',
        prompt_male_en: 'male spellblade warrior, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. heavy enchanted plate with exposed front and high collar, claymore, accompanied by floating quill, standing on a massive glowing runic-array, wide arcane factory background.',
        tags: ['arcane_eldritch', 'blade', 'magic', 'servant', 'sigil']
    },
    {
        name: 'warlock', labelZh: '術士 (Warlock)', type: '奧秘法術系 (Arcane & Eldritch)', reference: '魔獸世界、龍與地下城', gender: 'universal',
        description: '深淵契約、魅魔或影魔隨行。',
        prompt_female_en: 'female warlock, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring tattered shadow-lace robes with deep-plunging neckline, demonic horns, holding fel-fire orb, accompanied by a mischievous imp, standing on a massive burning infernal sigil, extreme wide-angle shadow dimension view.',
        prompt_male_en: 'male warlock, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. skull-shouldered robes with exposed chest and chains, staff of shadow, accompanied by a huge floating shadow demon, standing on a massive glowing demonic star, wide hellish landscape.',
        tags: ['arcane_eldritch', 'shadow', 'pact', 'servant', 'sigil']
    },

    // 【影舞敏捷系 (Shadow & Precision)】
    {
        name: 'assassin', labelZh: '刺客 (Assassin)', type: '影舞敏捷系 (Shadow & Precision)', reference: '刺客教條、暗黑破壞神', gender: 'universal',
        description: '皮甲連帽、短劍與影蛇。',
        prompt_female_en: 'female assassin, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. architectural tech-latex and sheer-mesh bodysuit with daring geometric cutouts, asymmetric harness, twin daggers, accompanied by a spectral shadow serpent, standing on massive concentric void rings, 14mm wide-angle rooftop perspective.',
        prompt_male_en: 'male assassin, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. dark hooded tech-leather with exposed chest and ritual tattoos, hidden blade, hawk familiar, standing on a massive glowing assassin-cross, wide moonlit city view.',
        tags: ['shadow_precision', 'stealth', 'leather', 'servant', 'sigil']
    },
    {
        name: 'archer', labelZh: '弓箭手 (Archer)', type: '影舞敏捷系 (Shadow & Precision)', reference: '魔戒、邊緣禁地', gender: 'universal',
        description: '皮革輕甲、長弓及林間梟眼。',
        prompt_female_en: 'female archer ranger, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring forest-silk and sheer-mesh armor with plunging neckline and high-slits, architectural leaf-patterns, drawing longbow, accompanied by forest owl, standing on a massive glowing verdant vortex, extreme wide-angle forest depth.',
        prompt_male_en: 'male master archer, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. weathered scout harness with exposed muscular build and green tattoos, massive composite bow, lynx spirit, standing on a massive glowing archery-ring, wide autumn mountain.',
        tags: ['shadow_precision', 'ranged', 'agile', 'servant', 'sigil']
    },
    {
        name: 'ninja', labelZh: '忍者 (Ninja)', type: '影舞敏捷系 (Shadow & Precision)', reference: 'Naruto、仁王', gender: 'universal',
        description: '黑衣面巾、手裏劍與紙鶴靈。',
        prompt_female_en: 'female kunoichi ninja, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. avant-garde shinobi-latex with sheer-mesh inserts and strategic cutouts at the neck and ribcage, holding shuriken, accompanied by origami cranes, standing on massive water-ripples, extreme side-angle wide moonlit perspective.',
        prompt_male_en: 'male ninja master, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. midnight-black shinobi tech-gear with exposed chest and arm scars, katana on back, wolf spirit, standing on massive lightning-seal, wide rooftop battleview.',
        tags: ['shadow_precision', 'stealth', 'oriental', 'servant', 'sigil']
    },
    {
        name: 'ranger', labelZh: '遊俠 (Ranger)', type: '影舞敏捷系 (Shadow & Precision)', reference: '魔戒、Horizon系列', gender: 'universal',
        description: '野地皮甲、斗篷與山貓伴侶。',
        prompt_female_en: 'female ranger huntress, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring travel-worn silk and leather dengan sheer panels, midriff-exposed design, gripping hunting bow, accompanied by real bobcat mount, standing on massive muddy track-circle, extreme wide-angle forest ruins perspective.',
        prompt_male_en: 'male strider ranger, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. weathered leather and chain-mesh with exposed muscular arms and shoulders, accompanied by giant spectral eagle, standing on massive compass-star, wide dark forest view.',
        tags: ['shadow_precision', 'nature', 'scout', 'servant', 'sigil']
    },
    {
        name: 'bounty_hunter', labelZh: '賞金獵人 (Bounty Hunter)', type: '影舞敏捷系 (Shadow & Precision)', reference: '星際大戰、Mad Max', gender: 'universal',
        description: '長風衣、戰術弩機及機鷹隨從。',
        prompt_female_en: 'female bounty hunter, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. avant-garde dark leather longcoat with sheer internal panels and daring cutouts, mechanical crossbow, hawk familiar, standing on a massive red target-reticle, extreme wide-angle rainy alley reflections.',
        prompt_male_en: 'male bounty hunter, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. heavy weathered leather and tech-harness with exposed arms, mechanical crossbow, beetle familiar, standing on a massive glowing grid, wide desert sunset view.',
        tags: ['shadow_precision', 'tech', 'ranged', 'servant', 'sigil']
    },
    {
        name: 'phantom_thief', labelZh: '幻影怪盜 (Phantom Thief)', type: '影舞敏捷系 (Shadow & Precision)', reference: '魯邦三世、Persona 5', gender: 'universal',
        description: '華麗禮服、飛牌與幻影貓。',
        prompt_female_en: 'female phantom thief, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. elegant avant-garde white silk dress with architectural cutouts and super-high slits, sheer-mesh overlays, accompanied by flying cards and doves, standing on a massive glowing pattern, extreme 14mm wide-angle ballroom perspective.',
        prompt_male_en: 'male master thief, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. charcoal tuxedo with exposed dress-shirt and harness details, accompanied by black cat, standing on a massive glowing clock-face, wide clocktower interior.',
        tags: ['shadow_precision', 'noble', 'stealth', 'servant', 'sigil']
    },
    {
        name: 'pirate_captain', labelZh: '海盜船長 (Pirate Captain)', type: '影舞敏捷系 (Shadow & Precision)', reference: '神鬼奇航、海賊王', gender: 'universal',
        description: '船長大衣、彎刀與海怪靈。',
        prompt_female_en: 'female pirate captain, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring embroidered pirate coat with open-front showing architectural corset and sheer-mesh panels, tricorn hat, accompanied by skeletal parrot, standing on massive water-effect compass, extreme wide-angle stormy deck view.',
        prompt_male_en: 'male pirate captain, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. weathered leather explorer gear with open-chest sash details, saber, kraken-tentacle spirit, standing on massive nautical chart ripples, wide Caribbean bay view.',
        tags: ['shadow_precision', 'sea', 'agile', 'servant', 'sigil']
    },

    // 【祈禱支援系 (Support & Divine)】
    {
        name: 'nun', labelZh: '修女 (Nun)', type: '祈禱支援系 (Support & Divine)', reference: '最終幻想、龍與地下城', gender: 'female',
        description: '聖袍聖典、天使之光與小天使。',
        prompt_female_en: 'female nun priestess, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. ethereal avant-garde super-sheer white silks with architectural gold-trim and daring plunging slit, holding sacred tome, accompanied by cherub seraph, standing on a massive brilliant stained-glass magic circle, extreme wide-angle cathedral perspective.',
        tags: ['support_divine', 'holy', 'magic', 'servant', 'sigil']
    },
    {
        name: 'druid', labelZh: '德魯伊 (Druid)', type: '祈禱支援系 (Support & Divine)', reference: '龍與地下城、魔獸世界', gender: 'universal',
        description: '藤蔓長袍、木杖及樹靈。',
        prompt_female_en: 'female druid, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. avant-garde bark-sculpted armor and sheer floral petals with daring cutouts at the neck and midriff, accompanied by treant sapling, standing on a massive blooming lush magic circle, extreme wide-angle bioluminescent forest perspective.',
        prompt_male_en: 'male druid, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. robes of woven bark with exposed chest and ritual antlers, ancient staff, accompanied by spectral stag, standing on massive runic roots, wide forest view.',
        tags: ['support_divine', 'nature', 'magic', 'servant', 'sigil']
    },
    {
        name: 'bard', labelZh: '吟遊詩人 (Bard)', type: '祈禱支援系 (Support & Divine)', reference: '龍與地下城、巫師3', gender: 'universal',
        description: '多彩寬袖衫、魯特琴及音樂精靈。',
        prompt_female_en: 'female bard, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring Renaissance-inspired jewel-toned silks with architectural cutouts and plunging neckline, sheer-mesh overlays, ornate lute, accompanied by musical note wisps, standing on massive golden music-staff, extreme 14mm wide-angle tavern perspective.',
        prompt_male_en: 'male bard, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. richly coloured doublet with open-v neckline and silk bindings, feathered cap, playing lute, accompanied by dancing spirit, standing on massive musical-note circle, wide tavern view.',
        tags: ['support_divine', 'music', 'agile', 'servant', 'sigil']
    },
    {
        name: 'cleric', labelZh: '聖職者 (Cleric)', type: '祈禱支援系 (Support & Divine)', reference: '龍與地下城、魔獸世界', gender: 'universal',
        description: '聖袍護符、聖杖與聖燈隨從。',
        prompt_female_en: 'female cleric, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. immaculate avant-garde white and gold vestments with daring front-slits and sheer-mesh panels, healing staff, accompanied by holy lantern, standing on massive radiant sunburst, extreme wide-angle morning light cathedral.',
        prompt_male_en: 'male cleric priest, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. heavy white vestments with exposed chest and liturgical stole, accompanied by halo dove, standing on massive geometric cross, wide sacred perspective.',
        tags: ['support_divine', 'holy', 'healer', 'servant', 'sigil']
    },
    {
        name: 'monk', labelZh: '武鬥家 (Monk)', type: '祈禱支援系 (Support & Divine)', reference: '龍與地下城、魔獸世界', gender: 'universal',
        description: '簡單武僧服、氣功及氣之龍隨從。',
        prompt_female_en: 'female zen monk, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring avant-garde silk gi with open-back and plunging geometric cuts, prayer beads, accompanied by spectral dragon chi-spirit, standing on massive Yin-Yang Taiji circle, extreme wide-angle mountain peak view.',
        prompt_male_en: 'male warrior monk, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. saffron martial arts robes with bare muscular chest and dragon tattoos, glowing fists, tiger spirit, standing on massive Eight-Trigrams circle, wide temple view.',
        tags: ['support_divine', 'martial_arts', 'magic', 'servant', 'sigil']
    },
    {
        name: 'shrine_maiden', labelZh: '巫女 (Shrine Maiden)', type: '祈禱支援系 (Support & Divine)', reference: '犬夜叉、東方Project', gender: 'female',
        description: '傳統紅白巫女服、破魔御幣與白狐。',
        prompt_female_en: 'female shrine maiden (miko), ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. avant-garde traditional red and white miko robes with daring ribcage cutouts and sheer-mesh sleeves, gohei wand, white kitsune spirit, standing on massive Torii silhouette, extreme 14mm wide-angle cherry blossom view.',
        tags: ['support_divine', 'oriental', 'holy', 'servant', 'sigil']
    },
    {
        name: 'exorcist', labelZh: '驅魔師 (Exorcist)', type: '祈禱支援系 (Support & Divine)', reference: '聖魔之血、驅魔少年', gender: 'universal',
        description: '黑衣聖水、十字架銀鍊及驅魔鈴隨從。',
        prompt_female_en: 'female exorcist, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. daring black clerical suit with plunging V-neckline and architectural collar details, sheer silk inserts, accompanied by floating bells, standing on massive seal of solomon, extreme 14mm wide-angle gothic cathedral perspective.',
        prompt_male_en: 'male exorcist priest, ultra-detailed 8K, CRITICAL: The face must strictly match the reference image. heavy black overcoat with exposed chest and priestly stole, silver rapier, winged guardian, standing on massive holy-ward circle, wide raining ash view.',
        tags: ['support_divine', 'dark', 'holy', 'servant', 'sigil']
    }
];

export const FANTASY_POSES_V4: PoseV8[] = [
    // Ranger
    { id: 'pose_ran_cover', label: '叢林掩護 (Jungle Cover)', category: '遊俠專屬', intensity: 0.4, hand: 'peering', props: 'foliage', symmetry: 'hidden', template: 'half-hidden behind lush jungle leaves, sharp eyes peering through the greenery.', requirements: { job: ['ranger', 'druid'] } },
    { id: 'pose_ran_trap', label: '陷阱設置 (Trap Setup)', category: '遊俠專屬', intensity: 0.5, hand: 'crouched', props: 'mechanical snare', symmetry: 'low center', template: 'crouching in the dirt to carefully set a complex mechanical trap, camouflaged gear.', requirements: { job: ['ranger', 'bounty_hunter'] } },
    { id: 'pose_ran_tracking', label: '荒野追蹤 (Wilderness Tracking)', category: '遊俠專屬', intensity: 0.6, hand: 'on ground', props: 'footprints', symmetry: 'focused down', template: 'examining footprints in the mud, tracking a dangerous beast through the wild.', requirements: { job: ['ranger', 'phantom_thief'] } },
    { id: 'pose_ran_inspection', label: '箭矢檢閱 (Arrow Inspection)', category: '遊俠專屬', intensity: 0.3, hand: 'checking arrow', props: 'quiver', symmetry: 'quiet', template: 'carefully checking the fletching of an arrow, standing in a sunlit forest clearing.', requirements: { job: ['ranger', 'archer'] } },
    { id: 'pose_ran_lookout', label: '哨塔警戒 (Lookout Vigil)', category: '遊俠專屬', intensity: 0.7, hand: 'shading eyes', props: 'high perch', symmetry: 'monumental', template: 'standing on a high tree branch or rocky cliff, scouting the vast horizon.', requirements: { job: ['ranger', 'knight'] } },

    // Warrior
    { id: 'pose_war_cleave', label: '巨力揮砍 (Mighty Cleave)', category: '戰士專屬', intensity: 1.0, hand: 'swinging high', props: 'greataxe', symmetry: 'powerful arc', template: 'mid-swing with a massive greataxe, debris and dust flying from the impact of the air.', requirements: { job: ['swordsman', 'berserker'] } },
    { id: 'pose_war_shield_wall', label: '盾牆防禦 (Shield Wall)', category: '戰士專屬', intensity: 0.8, hand: 'braced', props: 'heavy shield', symmetry: 'solid', template: 'bracing behind a massive heavy tower shield, sparks bouncing off the iron surface.', requirements: { job: ['swordsman', 'paladin'] } },
    { id: 'pose_war_roar', label: '戰意咆哮 (Battle Cry Pose)', category: '戰士專屬', intensity: 0.9, hand: 'weapon raised', props: 'battle scars', symmetry: 'upward', template: 'head thrown back in a fierce roar, holding a bloody sword high, battle-worn armor.', requirements: { job: ['swordsman', 'berserker'] } },
    { id: 'pose_war_last_stand', label: '血戰到底 (Last Stand)', category: '戰士專屬', intensity: 0.7, hand: 'leaning', props: 'broken weapon', symmetry: 'exhausted', template: 'leaning on a broken sword hilt, covered in dirt and blood, refusing to fall.', requirements: { job: ['swordsman', 'knight'] } },
    { id: 'pose_war_sharpening', label: '磨礪利刃 (Whetstone Sharpen)', category: '戰士專屬', intensity: 0.3, hand: 'sharpening', props: 'whetstone', symmetry: 'sitting', template: 'sitting by a campfire, sharpening a massive battle-axe with a whetstone, sparks.', requirements: { job: ['swordsman', 'ninja'] } },

    // Samurai
    { id: 'pose_sam_blossom', label: '櫻下拔刀 (Cherry Blossom Draw)', category: '武士專屬', intensity: 0.9, hand: 'quick draw', props: 'katana', symmetry: 'dynamic', template: 'quick drawing a katana as a blizzard of pink cherry blossoms falls around.', requirements: { job: ['swordsman', 'berserker'] } },
    { id: 'pose_sam_meditation', label: '冥想對決 (Meditative Duel)', category: '武士專屬', intensity: 0.2, hand: 'on hilt', props: 'none', symmetry: 'perfect still', template: 'standing perfectly still in a traditional duel stance, eyes closed, absolute focus.', requirements: { job: ['swordsman', 'monk'] } },
    { id: 'pose_sam_crescent', label: '殘月斬擊 (Crescent Slash)', category: '武士專屬', intensity: 1.0, hand: 'vertical strike', props: 'silver light', symmetry: 'arc', template: 'high vertical downward strike with a gleaming katana, moon-shaped energy trail.', requirements: { job: ['swordsman', 'mage'] } },
    { id: 'pose_sam_respect', label: '武士道謝 (Samurai Respect)', category: '武士專屬', intensity: 0.4, hand: 'deep bow', props: 'katana at side', symmetry: 'honorable', template: 'performing a formal deep bow with a katana held respectfully at the side.', requirements: { job: ['swordsman', 'nun'] } },
    { id: 'pose_sam_survey', label: '戰場巡視 (Battlefield Survey)', category: '武士專屬', intensity: 0.5, hand: 'walking slow', props: 'foggy field', symmetry: 'somber', template: 'walking slowly through a desolate battlefield at dawn, hand on katana hilt.', requirements: { job: ['swordsman', 'knight'] } },

    // Monk
    { id: 'pose_mon_ki_burst', label: '氣合爆發 (Ki Explosion)', category: '武鬥家專屬', intensity: 1.0, hand: 'palms out', props: 'ki ripples', symmetry: 'centered', template: 'eyes glowing as blue ki energy explodes from palms, ground cracking in a circle.', requirements: { job: ['monk', 'elementalist'] } },
    { id: 'pose_mon_levitate', label: '禪定浮空 (Zen Levitation)', category: '武鬥家專屬', intensity: 0.3, hand: 'meditating', props: 'floating dust', symmetry: 'weightless', template: 'meditating cross-legged while floating inches off the ground, aura of golden mist.', requirements: { job: ['monk', 'cleric'] } },
    { id: 'pose_mon_flurry', label: '疾風連擊 (Gale Flurry)', category: '武鬥家專屬', intensity: 0.9, hand: 'punching fast', props: 'motion blur', symmetry: 'fan out', template: 'sequence of rapid punches with hundreds of transparent blurring hands visible.', requirements: { job: ['monk', 'assassin'] } },
    { id: 'pose_mon_pressure', label: '點穴制敵 (Pressure Strike)', category: '武鬥家專屬', intensity: 0.7, hand: 'finger strike', props: 'spark', symmetry: 'precise', template: 'high-precision finger strike to a vital point, tiny spark of electricity at contact.', requirements: { job: ['monk', 'assassin'] } },
    { id: 'pose_mon_spirit', label: '靈魂出竅 (Spirit Projection)', category: '武鬥家專屬', intensity: 0.8, hand: 'spirit form', props: 'translucence', symmetry: 'double image', template: 'a translucent glowing spirit form emerging from the physical body to attack.', requirements: { job: ['monk', 'necromancer'] } },

    // Thief
    { id: 'pose_thi_rooftop', label: '屋頂奔馳 (Rooftop Sprint)', category: '盜賊專屬', intensity: 0.8, hand: 'running', props: 'ledge', symmetry: 'high altitude', template: 'sprinting along a narrow gothic rooftop ledge under a full moon, cape fluttering.', requirements: { job: ['phantom_thief', 'assassin'] } },
    { id: 'pose_thi_lock', label: '門鎖刺探 (Lock Picking)', category: '盜賊專屬', intensity: 0.4, hand: 'prying', props: 'tools', symmetry: 'close-up', template: 'focused on picking a heavy iron lock with metallic tools, single candle lighting.', requirements: { job: ['phantom_thief', 'alchemist'] } },
    { id: 'pose_thi_hiding', label: '陰影縮排 (Shadow Hiding)', category: '盜賊專屬', intensity: 0.3, hand: 'pressed back', props: 'dark corner', symmetry: 'invisible', template: 'pressing back into a dark brick corner, blending perfectly with the shadows.', requirements: { job: ['phantom_thief', 'assassin'] } },
    { id: 'pose_thi_looting', label: '財寶入袋 (Looting Spoils)', category: '盜賊專屬', intensity: 0.6, hand: 'grabbing gold', props: 'coins/pouch', symmetry: 'kneeling', template: 'stuffing overflowing gold coins and gems into a leather pouch, greedy focus.', requirements: { job: ['phantom_thief', 'assassin'] } },
    { id: 'pose_thi_wallrun', label: '飛簷走壁 (Wall Run)', category: '盜賊專屬', intensity: 0.9, hand: 'skimming wall', props: 'vertical angle', symmetry: 'defiant gravity', template: 'running horizontally along a vertical wall with supernatural speed and grace.', requirements: { job: ['phantom_thief', 'assassin'] } },

    // Bard
    { id: 'pose_bar_inspire', label: '戰歌鼓舞 (War Song)', category: '吟遊詩人專屬', intensity: 0.7, hand: 'strumming', props: 'lute/mandolin', symmetry: 'charismatic', template: 'walking forward while strumming a lute, singing a powerful encouragement to allies.', requirements: { job: ['bard', 'knight'] } },
    { id: 'pose_bar_serenade', label: '浪漫小夜曲 (Serenade)', category: '吟遊詩人專屬', intensity: 0.4, hand: 'playing soft', props: 'instrument', symmetry: 'graceful', template: 'playing a gentle song under a moonlit balcony or a glowing magical tree.', requirements: { job: ['bard', 'nun'] } },
    { id: 'pose_bar_juggle', label: '雜耍平衡 (Juggling Act)', category: '吟遊詩人專屬', intensity: 0.6, hand: 'juggling', props: 'knives/balls', symmetry: 'playful', template: 'juggling multiple colorful glowing balls or daggers in a masterfully balanced act.', requirements: { job: ['bard', 'assassin'] } },
    { id: 'pose_bar_story', label: '敘事表演 (Storytelling)', category: '吟遊詩人專屬', intensity: 0.5, hand: 'gesturing', props: 'tome/spark', symmetry: 'animated', template: 'performing a dramatic speech, magical sparks appearing to illustrate the story.', requirements: { job: ['bard', 'mage'] } },
    { id: 'pose_bar_busker', label: '街道藝人 (Street Busking)', category: '吟遊詩人專屬', intensity: 0.3, hand: 'sitting', props: 'cap for coins', symmetry: 'casual', template: 'sitting on a wooden crate in a busy fantasy market, hat on ground for tip coins.', requirements: { job: ['bard'] } },

    // Necromancer
    { id: 'pose_nec_arise', label: '亡靈甦醒 (Arise Undead)', category: '死靈法師專屬', intensity: 1.0, hand: 'raising hands', props: 'skeletons', symmetry: 'sinister', template: 'raising hands as skeletal warriors push their way out of the dark earth around the caster.', requirements: { job: ['necromancer', 'summoner'] } },
    { id: 'pose_nec_sculpt', label: '靈骨雕琢 (Bone Sculpting)', category: '死靈法師專屬', intensity: 0.7, hand: 'molding', props: 'green fire', symmetry: 'asymmetric', template: 'molding raw bone into armor using dark green magical fire, eerie glow on face.', requirements: { job: ['necromancer', 'alchemist'] } },
    { id: 'pose_nec_decay', label: '死亡凋零 (Death Decay)', category: '死靈法師專屬', intensity: 0.9, hand: 'staff on ground', props: 'withering plants', symmetry: 'spreading', template: 'ground turning black and vegetation withering wherever the staff touches the floor.', requirements: { job: ['necromancer', 'druid'] } },
    { id: 'pose_nec_vessel', label: '靈魂容器 (Soul Vessel)', category: '死靈法師專屬', intensity: 0.6, hand: 'holding lantern', props: 'vessel of souls', symmetry: 'haunting', template: 'holding an ancient lantern filled with swirling tormented green souls, eerie lighting.', requirements: { job: ['necromancer', 'cleric'] } },
    { id: 'pose_nec_whisper', label: '冥界耳語 (Underworld Whispers)', category: '死靈法師專屬', intensity: 0.5, hand: 'listening', props: 'floating skull', symmetry: 'eerie', template: 'leaning in to listen to a floating magical skull whispering forgotten secrets.', requirements: { job: ['necromancer', 'mage'] } },
    // Wizard
    { id: 'pose_wiz_arcane_ch', label: '秘法引導 (Arcane Channeling)', category: '法師專屬', intensity: 0.8, hand: 'mana focus', props: 'magic energy', symmetry: 'centered', template: 'wizard focusing mana between hands, orb of raw arcane energy pulsing, robes vibrating with power.', requirements: { job: ['mage', 'necromancer'] } },
    { id: 'pose_wiz_incantation', label: '禁咒詠唱 (Forbidden Incantation)', category: '法師專屬', intensity: 0.6, hand: 'reading', props: 'floating tome', symmetry: 'asymmetric', template: 'reading from a massive floating forbidden tome, eyes glowing, magical glyphs circling.', requirements: { job: ['mage', 'alchemist'] } },
    { id: 'pose_wiz_burst', label: '元素爆裂 (Elemental Burst)', category: '法師專屬', intensity: 1.0, hand: 'arms wide', props: 'elemental storm', symmetry: 'dynamic', template: 'releasing a massive elemental shockwave, ground cracking, intense light.', requirements: { job: ['mage', 'elementalist'] } },
    { id: 'pose_wiz_vision', label: '預言視界 (Prophetic Vision)', category: '法師專屬', intensity: 0.4, hand: 'on crystal', props: 'crystal ball', symmetry: 'centered', template: 'gazing intensely into a glowing crystal ball, future reflections in eyes.', requirements: { job: ['mage', 'cleric'] } },
    { id: 'pose_wiz_staff_slam', label: '法杖重壓 (Staff Slam)', category: '法師專屬', intensity: 0.9, hand: 'slamming staff', props: 'staff', symmetry: 'powerful', template: 'slamming a magic staff into the ground, ripples of magical energy expanding outward.', requirements: { job: ['mage', 'nun'] } },

    // Assassin
    { id: 'pose_asn_shadow_leap', label: '陰影躍遷 (Shadow Leap)', category: '刺客專屬', intensity: 1.0, hand: 'twin daggers', props: 'none', symmetry: 'dynamic', template: 'mid-air leap from shadows, twin daggers ready for a plunging strike, motion blur.', requirements: { job: ['assassin', 'ninja'] } },
    { id: 'pose_asn_garrote', label: '奪命鎖喉 (Lethal Garrote)', category: '刺客專屬', intensity: 0.7, hand: 'clasping', props: 'wire/dagger', symmetry: 'low', template: 'crouched low in stealth, hand positioned as if holding a lethal garrote wire, hunting from shadows.', requirements: { job: ['assassin', 'phantom_thief'] } },
    { id: 'pose_asn_vanish', label: '煙遁撤離 (Smoke Vanish)', category: '刺客專屬', intensity: 0.8, hand: 'throwing bomb', props: 'smoke bomb', symmetry: 'twisting', template: 'throwing a smoke bomb at feet while glancing back over the shoulder, disappearing into mist.', requirements: { job: ['assassin', 'ninja'] } },
    { id: 'pose_asn_edge_trial', label: '刃口試煉 (Edge Trial)', category: '刺客專屬', intensity: 0.5, hand: 'lifting dagger', props: 'dagger', symmetry: 'asymmetric', template: 'lifting the flat of a dagger to the lips, cold and lethal expression, sharpening focus.', requirements: { job: ['assassin'] } },
    { id: 'pose_asn_blade_rain', label: '飛刃漫天 (Rain of Blades)', category: '刺客專屬', intensity: 0.9, hand: 'throwing', props: 'knives', symmetry: 'fan out', template: 'flinging a fan of throwing knives in a graceful mid-spin motion.', requirements: { job: ['assassin', 'phantom_thief'] } },

    // Paladin
    { id: 'pose_pal_banner', label: '聖旗守護 (Sacred Banner Guard)', category: '聖騎士專屬', intensity: 0.6, hand: 'holding banner', props: 'banner', symmetry: 'monumental', template: 'standing firm holding a massive holy banner, wind blowing the fabric, divine light.', requirements: { job: ['paladin', 'knight'] } },
    { id: 'pose_pal_prayer', label: '虔誠跪禱 (Pious Kneeling)', category: '聖騎士專屬', intensity: 0.3, hand: 'sword hilt to face', props: 'longsword', symmetry: 'centered', template: 'kneeling in prayer, forehead resting on the cross-guard of a planted longsword.', requirements: { job: ['paladin', 'cleric'] } },
    { id: 'pose_pal_shield_bash', label: '鋼鐵風暴 (Steel Storm)', category: '聖騎士專屬', intensity: 0.9, hand: 'shield thrust', props: 'kite shield', symmetry: 'forward power', template: 'full-force shield bash, shockwave of holy energy, heavy armor reflecting light.', requirements: { job: ['paladin', 'swordsman'] } },
    { id: 'pose_pal_smite', label: '天罰降臨 (Heavenly Smite)', category: '聖騎士專屬', intensity: 1.0, hand: 'blade high', props: 'glowing sword', symmetry: 'descending', template: 'leaping downward with a blade wreathed in white-gold fire, smiting the darkness.', requirements: { job: ['paladin'] } },
    { id: 'pose_pal_rescue', label: '英勇救援 (Heroic Rescue)', category: '聖騎士專屬', intensity: 0.7, hand: 'reaching out', props: 'shield', symmetry: 'protective', template: 'reaching out a hand while holding a shield high to protect an unseen ally.', requirements: { job: ['paladin', 'cleric'] } },

    // Archer
    { id: 'pose_arc_eagle_draw', label: '鷹眼蓄力 (Eagle-Eye Draw)', category: '弓箭手專屬', intensity: 0.8, hand: 'triple draw', props: 'longbow', symmetry: 'focused', template: 'drawing a longbow to full tension with three arrows notched, intense focus, bow bending.', requirements: { job: ['archer', 'ranger'] } },
    { id: 'pose_arc_rolling', label: '翻滾射擊 (Rolling Shot)', category: '弓箭手專屬', intensity: 0.9, hand: 'mid-roll fire', props: 'shortbow', symmetry: 'dynamic', template: 'crouched shot coming out of a roll, dynamic and low-profile archery.', requirements: { job: ['archer', 'phantom_thief'] } },
    { id: 'pose_arc_rain', label: '箭雨齊發 (Arrow Rain)', category: '弓箭手專屬', intensity: 0.7, hand: 'firing high', props: 'bow', symmetry: 'upward', template: 'pointing bow vertically at the sky, releasing a volley of magical arrows.', requirements: { job: ['archer'] } },
    { id: 'pose_arc_snipe', label: '極限狙擊 (Precision Sniping)', category: '弓箭手專屬', intensity: 0.5, hand: 'prone focus', props: 'greatbow', symmetry: 'steady', template: 'prone or kneeling steady shot, focusing intently through an invisible sight, absolute stillness.', requirements: { job: ['archer', 'bounty_hunter'] } },
    { id: 'pose_arc_leap', label: '輕盈躍射 (Leaping Shot)', category: '弓箭手專屬', intensity: 1.0, hand: 'jumping shot', props: 'recurve bow', symmetry: 'mid-air', template: 'leaping backwards in mid-air while firing a finishing arrow, cinematic motion.', requirements: { job: ['archer', 'ranger'] } },

    // Priest
    { id: 'pose_pri_baptism', label: '神聖洗禮 (Divine Baptism)', category: '祭司專屬', intensity: 0.4, hand: 'raised', props: 'divine light', symmetry: 'holy', template: 'hands raised to the heavens, pillars of divine light descending to wash the area.', requirements: { job: ['cleric', 'exorcist'] } },
    { id: 'pose_pri_redemption', label: '救贖之手 (Hand of Redemption)', category: '祭司專屬', intensity: 0.5, hand: 'reaching', props: 'healing energy', symmetry: 'kind', template: 'extending a hand glowing with soft golden healing energy, aura of mercy.', requirements: { job: ['cleric'] } },
    { id: 'pose_pri_aegis', label: '聖光加護 (Holy Aegis)', category: '祭司專屬', intensity: 0.7, hand: 'dome focus', props: 'light dome', symmetry: 'centered', template: 'creating a shimmering dome of protective holy light, chanting with eyes closed.', requirements: { job: ['cleric', 'paladin'] } },
    { id: 'pose_pri_penitent', label: '懺悔跪思 (Penitent Contemplation)', category: '祭司專屬', intensity: 0.2, hand: 'clutching symbol', props: 'holy symbol', symmetry: 'humble', template: 'clutching a divine artifact to the chest, kneeling in a cathedral, somber lighting.', requirements: { job: ['cleric'] } },
    { id: 'pose_pri_miracle', label: '奇蹟降臨 (Miracle Manifestation)', category: '祭司專屬', intensity: 0.9, hand: 'floating', props: 'halo', symmetry: 'divine', template: 'floating slightly off ground in a massive halo of sacred light, eyes glowing gold.', requirements: { job: ['cleric', 'exorcist'] } },

    // Knight
    { id: 'pose_kni_salute', label: '騎士致禮 (Chivalric Salute)', category: '騎士專屬', intensity: 0.4, hand: 'sword to face', props: 'sword', symmetry: 'honorable', template: 'raising sword vertically to the face in a respectful salute, making direct eye contact.', requirements: { job: ['knight', 'paladin'] } },
    { id: 'pose_kni_charge', label: '鋼鐵衝鋒 (Iron Charge)', category: '騎士專屬', intensity: 0.9, hand: 'running', props: 'shield/sword', symmetry: 'aggressive', template: 'heavy sprint with sword and shield ready, armor clanking, determined charge.', requirements: { job: ['knight', 'swordsman'] } },
    { id: 'pose_kni_victory', label: '榮耀而戰 (Fight for Honor)', category: '騎士專屬', intensity: 0.7, hand: 'sword planted', props: 'fallen banners', symmetry: 'triumphant', template: 'driving a sword into the ground amidst fallen banners, looking up at the sky.', requirements: { job: ['knight', 'samurai'] } },
    { id: 'pose_kni_commander', label: '戰線領軍 (Frontline Commander)', category: '騎士專屬', intensity: 0.8, hand: 'pointing blade', props: 'cape', symmetry: 'authoritative', template: 'pointing forward with a heavy blade, wind catching the cape, commanding presence.', requirements: { job: ['knight', 'pirate_captain'] } },
    { id: 'pose_kni_respite', label: '卸甲餘暉 (Sunset Respite)', category: '騎士專屬', intensity: 0.3, hand: 'resting', props: 'helmet off', symmetry: 'exhausted', template: 'helmet off, leaning on the hilt of a sword in the sunset, tired but proud.', requirements: { job: ['knight', 'ranger'] } },

    // Swordsman
    { id: 'pose_swd_iaido', label: '居合拔刀 (Iaido Draw)', category: '御劍士專屬', intensity: 0.8, hand: 'on hilt', props: 'katana', symmetry: 'low center', template: 'hand resting on the hilt of a sheathed katana, body coiled like a spring, ready to strike.', requirements: { job: ['swordsman', 'samurai', 'ninja'] } },
    { id: 'pose_swd_unity', label: '劍意合一 (Sword Unity)', category: '御劍士專屬', intensity: 0.2, hand: 'meditating', props: 'blade on knees', symmetry: 'zen', template: 'meditating in seiza with a blade resting across the knees, spiritual mist.', requirements: { job: ['swordsman', 'monk'] } },
    { id: 'pose_swd_phantom', label: '殘像閃擊 (Phantom Strike)', category: '御劍士專屬', intensity: 1.0, hand: 'afterimage', props: 'energy trails', symmetry: 'un-focus', template: 'mid-swing with multiple blurring afterimages and energy trails, high speed motion.', requirements: { job: ['swordsman', 'spellblade'] } },
    { id: 'pose_swd_dance', label: '劍舞紛飛 (Sword Dance)', category: '御劍士專屬', intensity: 0.9, hand: 'spinning dual', props: 'dual blades', symmetry: 'graceful', template: 'graceful spinning strike with dual blades, robes and hair caught in the whirlwind.', requirements: { job: ['swordsman', 'dancer'] } },
    { id: 'pose_swd_sheath', label: '歸鞘之音 (Sound of Sheathing)', category: '御劍士專屬', intensity: 0.4, hand: 'sliding home', props: 'scabbard', symmetry: 'precise', template: 'carefully sliding a blade back into its scabbard, eyes focused on the crossguard.', requirements: { job: ['swordsman', 'samurai'] } },

    // Spellblade
    { id: 'pose_sb_sigil', label: '劍咒融合 (Sigil Infusion)', category: '魔法劍士專屬', intensity: 0.7, hand: 'infusing blade', props: 'glowing runes', symmetry: 'centered', template: 'infusing magical sigils into a glowing blade, sparks flying from the edge.', requirements: { job: ['spellblade', 'knight'] } },
    { id: 'pose_sb_flash', label: '奧術劍閃 (Arcane Sword Flash)', category: '魔法劍士專屬', intensity: 1.0, hand: 'slashing', props: 'dimensional cracks', symmetry: 'dynamic', template: 'rapid vertical slash leaving purple dimensional cracks in the air, high-energy blurring.', requirements: { job: ['spellblade', 'assassin'] } },
    { id: 'pose_sb_dash', label: '護盾衝刺 (Shielded Dash)', category: '魔法劍士專屬', intensity: 0.9, hand: 'forward thrust', props: 'arcane shield', symmetry: 'aggressive', template: 'dashing forward with a translucent hexagonal magical barrier in front, light wrap on armor.', requirements: { job: ['spellblade', 'paladin'] } },
    { id: 'pose_sb_domain', label: '刃域召喚 (Blade Domain)', category: '魔法劍士專屬', intensity: 0.8, hand: 'commanding', props: 'spectral swords', symmetry: 'surrounding', template: 'multiple spectral blades hovering in a circle around the character, blue energy trails.', requirements: { job: ['spellblade', 'summoner'] } },
    { id: 'pose_sb_enchant', label: '元素附魔 (Elemental Enchant)', category: '魔法劍士專屬', intensity: 0.6, hand: 'weapon glow', props: 'frost/flame', symmetry: 'asymmetric', template: 'holding weapon horizontally as it becomes wreathed in frost or blue flame, intense glow.', requirements: { job: ['spellblade', 'swordsman'] } },

    // Pirate Captain
    { id: 'pose_pir_command', label: '船長指引 (Captain\'s Command)', category: '海盜船長專屬', intensity: 0.5, hand: 'pointing', props: 'ship railing', symmetry: 'authoritative', template: 'standing on a wooden railing, pointing out to a stormy sea, wind-blown coat.', requirements: { job: ['pirate_captain', 'knight'] } },
    { id: 'pose_pir_parry', label: '彎刀格擋 (Cutlass Parry)', category: '海盜船長專屬', intensity: 0.8, hand: 'saber parry', props: 'cutlass', symmetry: 'defensive', template: 'defensive crouch parrying an unseen blow with a heavy cutlass, blade reflecting lightning.', requirements: { job: ['pirate_captain', 'swordsman'] } },
    { id: 'pose_pir_toast', label: '月下暢飲 (Moonlit Toast)', category: '海盜船長專屬', intensity: 0.4, hand: 'raising mug', props: 'grog mug', symmetry: 'celebratory', template: 'raising a wooden mug under a full moon, salt spray in the air, joyous look.', requirements: { job: ['pirate_captain', 'bard'] } },
    { id: 'pose_pir_treasure', label: '尋寶挖掘 (Treasure Dig)', category: '海盜船長專屬', intensity: 0.6, hand: 'on chest', props: 'gold chest', symmetry: 'low lighting', template: 'kneeling before an open treasure chest, gold light reflecting onto the face and tricorn hat.', requirements: { job: ['pirate_captain', 'phantom_thief'] } },
    { id: 'pose_pir_leap', label: '接舷跳躍 (Boarding Leap)', category: '海盜船長專屬', intensity: 1.0, hand: 'holding rope', props: 'rope', symmetry: 'swinging', template: 'swinging on a thick rope into combat, cutlass in the other hand, sea fog background.', requirements: { job: ['pirate_captain', 'ninja'] } },

    // Alchemist
    { id: 'pose_alc_brewing', label: '藥劑調配 (Potion Brewing)', category: '煉金術士專屬', intensity: 0.3, hand: 'pouring', props: 'flasks', symmetry: 'centered', template: 'carefully pouring colorful glowing liquids between glass flasks, chemical steam rising.', requirements: { job: ['alchemist', 'mage'] } },
    { id: 'pose_alc_throw', label: '元素投擲 (Elemental Flask Throw)', category: '煉金術士專屬', intensity: 0.9, hand: 'throwing vial', props: 'exploding vial', symmetry: 'dynamic', template: 'throwing a glass vial that is beginning to erupt with green fire, tactical glass shards.', requirements: { job: ['alchemist', 'assassin'] } },
    { id: 'pose_alc_circle', label: '煉金變換 (Transmutation Circle)', category: '煉金術士專屬', intensity: 0.7, hand: 'on ground', props: 'alchemy glyphs', symmetry: 'kneeling', template: 'hand pressed to a glowing transmutation circle on the floor, metallic sparks flying.', requirements: { job: ['alchemist', 'spellblade'] } },
    { id: 'pose_alc_bottle', label: '瓶中異象 (Bottle Apparition)', category: '煉金術士專屬', intensity: 0.4, hand: 'holding jar', props: 'homunculus', symmetry: 'focusing', template: 'looking curiously at a tiny glowing creature trapped inside a glass bottle, reflection on eyes.', requirements: { job: ['alchemist', 'summoner'] } },
    { id: 'pose_alc_steam', label: '蒸汽瀰漫 (Steam Envelopment)', category: '煉金術士專屬', intensity: 0.5, hand: 'vanishing', props: 'colored gas', symmetry: 'mysterious', template: 'emerging from or disappearing into a cloud of thick colorful chemical gas, goggles reflecting light.', requirements: { job: ['alchemist', 'phantom_thief'] } },

    // Druid
    { id: 'pose_dru_song', label: '自然之歌 (Nature\'s Song)', category: '德魯伊專屬', intensity: 0.2, hand: 'nurturing', props: 'sprout', symmetry: 'gentle', template: 'kneeling and singing to a fast-growing magical sprout, soft forest lighting.', requirements: { job: ['druid', 'cleric'] } },
    { id: 'pose_dru_thorns', label: '荊棘纏繞 (Thorn Entanglement)', category: '德魯伊專屬', intensity: 0.8, hand: 'controlling', props: 'vines', symmetry: 'grounded', template: 'controlling thick thorny vines erupting from the ground, character looks determined.', requirements: { job: ['druid', 'swordsman'] } },
    { id: 'pose_dru_call', label: '野性呼喚 (Call of the Wild)', category: '德魯伊專屬', intensity: 0.7, hand: 'reaching', props: 'spirit beast', symmetry: 'asymmetric', template: 'extending reaching hand to a majestic translucent spirit beast appearing from the woods.', requirements: { job: ['druid', 'summoner'] } },
    { id: 'pose_dru_wander', label: '極地漫步 (Tundra Wander)', category: '德魯伊專屬', intensity: 0.4, hand: 'natural', props: 'snow', symmetry: 'peaceful', template: 'walking barefoot through a snowstorm, serene expression, frost-covered robes.', requirements: { job: ['druid', 'ranger'] } },
    { id: 'pose_dru_bloom', label: '生命綻放 (Life Bloom)', category: '德魯伊專屬', intensity: 0.9, hand: 'touching ground', props: 'exploding flowers', symmetry: 'radiant', template: 'flowers and grass blooming instantly where the character touches the earth, vibrant nature magic.', requirements: { job: ['druid', 'cleric'] } },

    // Elementalist
    { id: 'pose_ele_quad', label: '四元合一 (Elemental Quad)', category: '元素師專屬', intensity: 0.8, hand: 'circling elements', props: 'fire/water/air/earth', symmetry: 'centered', template: 'fire, water, air, and earth elements circling the hands simultaneously, intense elemental feedback.', requirements: { job: ['elementalist', 'mage'] } },
    { id: 'pose_ele_storm', label: '閃電風暴 (Lightning Storm)', category: '元素師專屬', intensity: 1.0, hand: 'raised to sky', props: 'lightning', symmetry: 'epic', template: 'raising a hand to a dark thunderous sky, beckoning massive vertical lightning bolts.', requirements: { job: ['elementalist', 'paladin'] } },
    { id: 'pose_ele_breath', label: '冰霜吐息 (Frost Breath)', category: '元素師專屬', intensity: 0.6, hand: 'near mouth', props: 'ice crystals', symmetry: 'focused', template: 'exhaling a visible cone of freezing blue fog and ice crystals, character looking cold.', requirements: { job: ['elementalist', 'dragon_humanoid'] } },
    { id: 'pose_ele_lava', label: '熔岩之擁 (Lava\'s Embrace)', category: '元素師專屬', intensity: 0.9, hand: 'on fire', props: 'lava', symmetry: 'intense', template: 'standing waist-deep in flowing lava, hands engulfed in flame, glowing red heat.', requirements: { job: ['elementalist', 'monk'] } },
    { id: 'pose_ele_cyclone', label: '旋風浮空 (Cyclone Hover)', category: '元素師專屬', intensity: 0.7, hand: 'balanced', props: 'tornado', symmetry: 'levitating', template: 'hovering at the center of a small concentrated tornado, debris orbiting, wind-swept clothes.', requirements: { job: ['elementalist', 'druid'] } },

    // Warlock
    { id: 'pose_war_pact', label: '契約儀式 (Contract Pact)', category: '暗影術士專屬', intensity: 0.6, hand: 'signing', props: 'blood scroll', symmetry: 'dark ritual', template: 'signing an ancient parchment in glowing mystical blood/ink, shadow energy rising.', requirements: { job: ['warlock', 'cleric'] } },
    { id: 'pose_war_void', label: '虛空吞噬 (Void Devour)', category: '暗影術士專屬', intensity: 1.0, hand: 'creating hole', props: 'black hole', symmetry: 'centered', template: 'creating a miniature black hole in the palm of the hand, light being sucked in.', requirements: { job: ['warlock', 'mage'] } },
    { id: 'pose_war_syphon', label: '靈魂汲取 (Soul Syphon)', category: '暗影術士專屬', intensity: 0.8, hand: 'pulling energy', props: 'soul wisps', symmetry: 'predatory', template: 'drawing glowing green soul filaments from a fallen enemy into a dark orb.', requirements: { job: ['warlock', 'necromancer'] } },
    { id: 'pose_war_shadow_play', label: '影子戲法 (Shadow Play)', category: '暗影術士專屬', intensity: 0.5, hand: 'puppet strings', props: 'alive shadow', symmetry: 'asymmetric', template: 'controlling own shadow which has come to life, manipulating it like a puppet.', requirements: { job: ['warlock', 'assassin'] } },
    { id: 'pose_war_forbidden_eye', label: '禁忌之眼 (Forbidden Eye)', category: '暗影術士專屬', intensity: 0.9, hand: 'unveiling staff', props: 'third eye', symmetry: 'eerie', template: 'unveiling a realistic third eye on the forehead or embedded in a staff, hypnotic purple light.', requirements: { job: ['warlock', 'cleric'] } },

    // Cleric
    { id: 'pose_cle_dawn', label: '晨曦祈禱 (Dawn Prayer)', category: '聖職者專屬', intensity: 0.3, hand: 'holding staff', props: 'morning sun', symmetry: 'peaceful', template: 'standing in bright golden morning light, staff raised slightly, peaceful devotional prayer.', requirements: { job: ['cleric'] } },
    { id: 'pose_cle_aegis', label: '聖徽護體 (Holy Symbol Aegis)', category: '聖職者專屬', intensity: 0.7, hand: 'shielding', props: 'holy symbol', symmetry: 'determined', template: 'extending a small holy symbol which projects a large shimmering divine shield.', requirements: { job: ['cleric', 'paladin'] } },
    { id: 'pose_cle_healing', label: '聖洗治癒 (Holy Healing)', category: '聖職者專屬', intensity: 0.5, hand: 'touching', props: 'healing light', symmetry: 'benevolent', template: 'placing a glowing hand on an unseen ally or own chest, soft white restorative energy.', requirements: { job: ['cleric', 'druid'] } },
    { id: 'pose_cle_descent', label: '天堂羽墮 (Heavenly Descent)', category: '聖職者專屬', intensity: 0.6, hand: 'standing calm', props: 'feathers', symmetry: 'divine', template: 'standing peacefully as hundreds of ethereal white feathers float down from the sky.', requirements: { job: ['cleric', 'exorcist'] } },
    { id: 'pose_cle_purge', label: '不死淨化 (Purging Evil)', category: '聖職者專屬', intensity: 0.9, hand: 'blasting shadows', props: 'white light', symmetry: 'powerful', template: 'unleashing a blinding blast of white holy light to dissolve dark smoke and shadows.', requirements: { job: ['cleric', 'necromancer'] } },
    // --- 武器 (Weapon) ---
    { id: 'pose_weapon_ready', label: '居合預備 (Iidou Ready)', category: '武器', intensity: 0.7, hand: 'on hilt', props: 'sword/katana', symmetry: 'asymmetric', template: 'hand resting on the hilt of a sheathed blade, body tensed, eyes sharp, ready to strike.', requirements: { job: ['samurai', 'swordsman', 'assassin'] } },
    { id: 'pose_weapon_swing', label: '破軍揮砍 (Great Cleave)', category: '武器', intensity: 1.0, hand: 'swinging', props: 'blade', symmetry: 'dynamic', template: 'mid-swing of a massive blade, light trails following the edge, dynamic motion, debris flying.', requirements: { job: ['swordsman', 'berserker', 'knight'] } },
    { id: 'pose_weapon_deflect', label: '鋼鐵防禦 (Iron Parry)', category: '武器', intensity: 0.8, hand: 'braced', props: 'sword/shield', symmetry: 'centered', template: 'braced for impact, blade or shield held firm against an unseen attack, sparks flying.', requirements: { job: ['knight', 'paladin'] } },
    { id: 'pose_weapon_bow_aim', label: '鷹眼蓄力 (Eagle-Eye Draw)', category: '武器', intensity: 0.9, hand: 'drawing bow', props: 'longbow', symmetry: 'asymmetric', template: 'drawing a massive recurve longbow taut to the ear, arm perfectly level, sharp focus on target, arrow tip glinting.', requirements: { job: ['archer', 'ranger', 'bounty_hunter'] } },
    { id: 'pose_weapon_bow_volley', label: '萬箭齊發 (Sky Volley)', category: '武器', intensity: 0.8, hand: 'aiming skyward', props: 'bow', symmetry: 'arc', template: 'aiming a bow towards the sky in a majestic arc, back arched, magical arrow trails raining from above.', requirements: { job: ['archer', 'ranger', 'paladin'] } },
    { id: 'pose_weapon_bow_scout', label: '獵手潛伏 (Stalker Vigil)', category: '武器', intensity: 0.5, hand: 'low grip', props: 'bow', symmetry: 'low profile', template: 'crouching low behind natural cover, bow held horizontally across the chest, scanning the environment with sharp eyes.', requirements: { job: ['archer', 'ranger', 'ninja', 'assassin_f'] } },
    { id: 'pose_weapon_dual', label: '致命雙刃 (Lethal Dual)', category: '武器', intensity: 1.0, hand: 'crossed', props: 'twin blades', symmetry: 'balanced', template: 'wielding two weapons in a lethal cross-stance, high-speed movement blur.', requirements: { job: ['assassin', 'phantom_thief'] } },

    // --- 實拍與擺拍 (Model & Cosplay) ---
    { id: 'pose_model_classic', label: '雜誌站姿 (Classic Editorial)', category: '一般攝影', intensity: 0.3, hand: 'one on hip', props: 'none', symmetry: 'asymmetric', template: 'classic high-fashion magazine standing pose, one hand on hip, slight weight shift, looking slightly away from camera, professional editorial aesthetic.' },
    { id: 'pose_model_sitting', label: '優雅坐拍 (Elegant Sitting)', category: '一般攝影', intensity: 0.2, hand: 'resting on knee', props: 'chair/block', symmetry: 'asymmetric', template: 'elegant sitting pose on a minimalist block, legs crossed, chin tilted up, looking at camera with confidence, fashion photography style.' },
    { id: 'pose_cosplay_action', label: '英雄互動 (Cosplay Interaction)', category: '一般攝影', intensity: 0.7, hand: 'checking gear', props: 'cosplay prop', symmetry: 'dynamic', template: 'dynamic cosplay interaction pose, as if checking the sharpness of a blade or adjusting a cape, storytelling movement captured mid-action.' },
    { id: 'pose_model_leaning', label: '靠牆冷淡 (Cool Leaning)', category: '一般攝影', intensity: 0.4, hand: 'in pockets', props: 'wall', symmetry: 'leaning', template: 'leaning against a textured wall with a cool indifferent expression, eyes relaxed, casual but high-end fashion vibe.' },
    { id: 'pose_model_dynamic_walk', label: '街頭抓拍 (Street Snap)', category: '一般攝影', intensity: 0.6, hand: 'natural swing', props: 'street scenery', symmetry: 'walking', template: 'mid-stride walking pose, captured with a fast shutter speed, motion in hair and clothing, realistic and spontaneous street photography aesthetic.' },
    { id: 'pose_glimmer_glance', label: '微光回眸 (Glimmering Glance)', category: '一般攝影', intensity: 0.4, hand: 'natural', props: 'none', symmetry: 'dynamic', template: 'looking back over the shoulder with a gentle expression, soft light catching the eyes, organic movement in hair.' },
    { id: 'pose_urban_lean', label: '街道依傍 (Urban Lean)', category: '一般攝影', intensity: 0.3, hand: 'relaxed', props: 'city rail', symmetry: 'asymmetric', template: 'leaning naturally against a city railing or lamp post, blurred urban background, casual fashion photography.' },
    { id: 'pose_autumn_stance', label: '深秋佇立 (Autumn Stance)', category: '一般攝影', intensity: 0.4, hand: 'in coat pockets', props: 'none', symmetry: 'centered', template: 'standing still in a scenic environment, wind blowing hair, peaceful expression, soft natural lighting.' },
    { id: 'pose_window_musing', label: '窗台思緒 (Windowside Musing)', category: '一般攝影', intensity: 0.2, hand: 'on chin', props: 'window frame', symmetry: 'asymmetric', template: 'looking out through a glass window, reflections visible, pensive expression, moody natural light.' },
    { id: 'pose_afternoon_stride', label: '午後漫步 (Afternoon Stride)', category: '一般攝影', intensity: 0.5, hand: 'natural', props: 'none', symmetry: 'dynamic', template: 'walking towards the camera in a sun-drenched environment, soft golden hour glow, realistic movement.' },
    { id: 'pose_chiaroscuro', label: '光影交錯 (Chiaroscuro Pose)', category: '一般攝影', intensity: 0.6, hand: 'shadowed', props: 'none', symmetry: 'sculptural', template: 'high contrast lighting hitting only half of the face and body, deep shadows, dramatic editorial silhouette.' },
    { id: 'pose_sea_breeze', label: '海風吹拂 (Sea Breeze Flow)', category: '一般攝影', intensity: 0.5, hand: 'spreading', props: 'none', symmetry: 'free', template: 'standing on a beach or cliff, arms slightly spread, clothing and hair caught in strong wind, salty mist atmosphere.' },
    { id: 'pose_cold_editorial', label: '冷峻坐拍 (Cold Editorial Sit)', category: '一般攝影', intensity: 0.4, hand: 'clasping', props: 'minimalist chair', symmetry: 'centered', template: 'sitting with a straight back and intense indifferent gaze, luxury fashion magazine style, clean backdrop.' },
    { id: 'pose_morning_waking', label: '晨間甦醒 (Early Morning Waking)', category: '一般攝影', intensity: 0.2, hand: 'stretching', props: 'bedding', symmetry: 'relaxed', template: 'waking up in a sunlit bedroom, messy hair, soft skin texture, morning rays filtering through curtains.' },
    { id: 'pose_candid_film', label: '底片街拍 (Candid Film Walk)', category: '一般攝影', intensity: 0.6, hand: 'natural', props: 'film camera', symmetry: 'spontaneous', template: 'authentic candid moment, slight film grain texture, natural facial expression, mid-action capture.' },
    { id: 'pose_stairway_confront', label: '階梯對峙 (Stairway Confrontation)', category: '一般攝影', intensity: 0.7, hand: 'low grip', props: 'stairs', symmetry: 'asymmetric', template: 'standing on a grand stone staircase, looking down at the camera with authority, dramatic perspective.' },
    { id: 'pose_forest_path', label: '森林迷蹤 (Forest Path Wander)', category: '一般攝影', intensity: 0.4, hand: 'touching leaves', props: 'forest canopy', symmetry: 'immersive', template: 'walking through a dense ancient forest, dappled sunlight, character interacting with the environment.' },
    { id: 'pose_coffee_leisure', label: '咖啡閑暇 (Coffee Break Leisure)', category: '一般攝影', intensity: 0.2, hand: 'holding cup', props: 'ceramic cup', symmetry: 'centered', template: 'sitting at a small outdoor cafe table, steam rising from a cup, relaxed and cozy atmosphere.' },
    { id: 'pose_rainy_isolation', label: '雨夜孤寂 (Rainy Night Solitude)', category: '一般攝影', intensity: 0.5, hand: 'holding umbrella', props: 'clear umbrella', symmetry: 'centered', template: 'standing in a neon-lit rainy street, water droplets on the umbrella, cinematic reflections.' },
    { id: 'pose_vintage_grace', label: '復古典雅 (Vintage Elegance)', category: '一般攝影', intensity: 0.3, hand: 'holding lace fan', props: 'antique furniture', symmetry: 'refined', template: 'classic 19th-century portrait style, sepia-toned lighting, ornate details, dignified expression.' },
    { id: 'pose_wilderness_pass', label: '荒野穿行 (Wilderness Passage)', category: '一般攝影', intensity: 0.6, hand: 'holding travel bag', props: 'mountain peaks', symmetry: 'determined', template: 'traveling through a vast mountain landscape, weathered gear, cinematic scale, high-altitude light.' },
    { id: 'pose_scholarly_repose', label: '書卷氣息 (Scholarly Repose)', category: '一般攝影', intensity: 0.2, hand: 'reading', props: 'ancient book', symmetry: 'quiet', template: 'sitting in a sunlit library corner, leaning over an open book, soft dust motes in the air.' },
    { id: 'pose_sunset_afterglow', label: '夕陽餘暉 (Sunset Afterglow)', category: '一般攝影', intensity: 0.4, hand: 'shading eyes', props: 'none', symmetry: 'backlit', template: 'standing against a massive sunset, silhouette rimmed with gold, long shadows, nostalgia.' },
    { id: 'pose_modern_mini', label: '現代簡約 (Modern Minimalist)', category: '一般攝影', intensity: 0.3, hand: 'clean lines', props: 'none', symmetry: 'geometric', template: 'minimalist architectural background, subject in a sharp modern pose, sterile and clean aesthetic.' },
    { id: 'pose_ultimate_macro', label: '極致特寫 (Ultimate Macro Focus)', category: '一般攝影', intensity: 0.8, hand: 'near face', props: 'none', symmetry: 'extreme close-up', template: 'extreme macro shot focusing on the iris and skin texture, shallowest depth of field, hyper-realistic detail.' },

    // Ninja
    { id: 'pose_nin_shadow_bind', label: '影縛術 (Shadow Bind)', category: '忍者專屬', intensity: 0.7, hand: 'on ground', props: 'shadow tentacles', symmetry: 'low center', template: 'crouched low with one hand on the floor, shadows extending forward like grasping tentacles.', requirements: { job: ['ninja', 'warlock'] } },
    { id: 'pose_nin_storm', label: '手裏劍亂舞 (Shuriken Storm)', category: '忍者專屬', intensity: 0.9, hand: 'spinning throw', props: 'many shuriken', symmetry: 'circular', template: 'spinning mid-air while throwing dozens of steel shuriken in a deadly circular fan.', requirements: { job: ['assassin', 'assassin'] } },
    { id: 'pose_nin_substitute', label: '替身術斷片 (Substitution)', category: '忍者專屬', intensity: 1.0, hand: 'vanishing', props: 'wooden log/smoke', symmetry: 'distorted', template: 'exploding into a cloud of smoke and a wooden log just as a blade strikes, vanishing away.', requirements: { job: ['assassin', 'phantom_thief'] } },
    { id: 'pose_nin_seals', label: '結印蓄能 (Hand Seal Focus)', category: '忍者專屬', intensity: 0.6, hand: 'complex seals', props: 'energy sparks', symmetry: 'centered', template: 'performing lightning-fast complex hand seals, blue energy sparks crackling between fingers.', requirements: { job: ['assassin', 'cleric'] } },
    { id: 'pose_nin_scroll', label: '卷軸召喚 (Scroll Summon)', category: '忍者專屬', intensity: 0.8, hand: 'unrolling', props: 'long scroll', symmetry: 'wide', template: 'unrolling an ancient summoning scroll across the floor, large puffs of white smoke appearing.', requirements: { job: ['assassin', 'necromancer'] } },

    // Summoner
    { id: 'pose_sum_beast', label: '巨獸共鳴 (Beast Resonance)', category: '召喚師專屬', intensity: 0.9, hand: 'extending', props: 'beast spirit', symmetry: 'colossal', template: 'a massive spectral beast head appearing behind the caster, roaring in unison.', requirements: { job: ['elementalist', 'druid'] } },
    { id: 'pose_sum_celestial', label: '召喚星圖 (Celestial Map)', category: '召喚師專屬', intensity: 0.7, hand: 'tracing', props: 'floating runes', symmetry: 'cylindrical', template: 'tracing complex circular runes in the air, glowing blue light maps of the stars.', requirements: { job: ['elementalist', 'cleric'] } },
    { id: 'pose_sum_contract', label: '契約簽訂 (Contract Sign)', category: '召喚師專屬', intensity: 0.5, hand: 'outstretched', props: 'glowing palm', symmetry: 'formal', template: 'hand outstretched as glowing contract symbols burn into the air, sparks of light.', requirements: { job: ['elementalist', 'necromancer'] } },
    { id: 'pose_sum_multi', label: '多重召喚 (Multi-Summon)', category: '召喚師專屬', intensity: 0.8, hand: 'commanding', props: 'many spirits', symmetry: 'surrounded', template: 'multiple small elemental spirits circling the body, caster commanding them to move.', requirements: { job: ['elementalist', 'elementalist'] } },
    { id: 'pose_sum_rift', label: '位面裂縫 (Planar Rift)', category: '召喚師專屬', intensity: 1.0, hand: 'tearing', props: 'space rift', symmetry: 'distorted', template: 'tearing open a glowing purple space rift with bare hands, looking into another world.', requirements: { job: ['elementalist', 'mage'] } },

    // Bounty Hunter
    { id: 'pose_bou_slide', label: '戰術滑鏟 (Tactical Slide)', category: '賞金獵人專屬', intensity: 0.9, hand: 'aiming', props: 'pistol/blaster', symmetry: 'dynamic low', template: 'sliding on one knee across a neon-lit floor while aiming a high-tech weapon.', requirements: { job: ['assassin', 'assassin'] } },
    { id: 'pose_bou_confirm', label: '懸賞確認 (Bounty Check)', category: '賞金獵人專屬', intensity: 0.4, hand: 'holding', props: 'holo-poster', symmetry: 'analytical', template: 'scanning a glowing holographic wanted poster, calculating the next move, rainy alley.', requirements: { job: ['assassin', 'phantom_thief'] } },
    { id: 'pose_bou_overheat', label: '槍械過熱 (Weapon Overheat)', category: '賞金獵人專屬', intensity: 0.5, hand: 'blowing smoke', props: 'smoking barrel', symmetry: 'cool', template: 'blowing smoke off the heated barrel of a large handgun, debris in the air.', requirements: { job: ['assassin', 'alchemist'] } },
    { id: 'pose_bou_ambush', label: '隱匿突襲 (Ambush Attack)', category: '賞金獵人專屬', intensity: 0.8, hand: 'dropping down', props: 'high perch', symmetry: 'vertical', template: 'dropping down from a high pipe or ceiling ledge, drawing weapons in mid-air.', requirements: { job: ['assassin', 'assassin'] } },
    { id: 'pose_bou_bolo', label: '束縛索投擲 (Bolo Throw)', category: '賞金獵人專屬', intensity: 0.7, hand: 'throwing', props: 'glowing wire', symmetry: 'spinning', template: 'casting a glowing energy wire to entangle a target, motion blur effects.', requirements: { job: ['assassin', 'archer'] } },

    // Shrine Maiden
    { id: 'pose_shr_arrow', label: '破魔箭 (Evil-Slaying Arrow)', category: '巫女專屬', intensity: 0.9, hand: 'aiming bow', props: 'ritual bow', symmetry: 'precise', template: 'aiming a traditional ritual bow with a glowing arrow of light, cherry blossoms.', requirements: { job: ['nun', 'archer'] } },
    { id: 'pose_shr_fox', label: '狐靈共舞 (Fox Spirit Dance)', category: '巫女專屬', intensity: 0.6, hand: 'dancing', props: 'kitsune spirits', symmetry: 'graceful', template: 'performing a ritual dance as three-tailed spirit foxes circle playfully around.', requirements: { job: ['nun', 'druid'] } },
    { id: 'pose_shr_barrier', label: '結界構築 (Barrier Construct)', category: '巫女專屬', intensity: 0.8, hand: 'diamond shape', props: 'glowing wall', symmetry: 'protective', template: 'hands forming a diamond shape, creating a translucent wall of sacred energy.', requirements: { job: ['nun', 'paladin'] } },
    { id: 'pose_shr_blessing', label: '淨化祈福 (Purification)', category: '巫女專屬', intensity: 0.5, hand: 'waving wand', props: 'gohei wand', symmetry: 'sacred', template: 'waving a gohei ritual wand, purifying the air with golden shimmers.', requirements: { job: ['nun', 'cleric'] } },
    { id: 'pose_shr_ema', label: '繪馬許願 (Ema Wishing)', category: '巫女專屬', intensity: 0.3, hand: 'writing', props: 'wooden plaque', symmetry: 'quiet', template: 'carefully writing a wish on a wooden plaque at a peaceful Shinto shrine.', requirements: { job: ['nun', 'bard'] } },

    // Oracle
    { id: 'pose_ora_gazing', label: '水晶凝視 (Crystal Gazing)', category: '占卜師專屬', intensity: 0.4, hand: 'cradling', props: 'glowing orb', symmetry: 'focused', template: 'leaning close to a large glowing crystal orb, reflections of fate in the glass.', requirements: { job: ['cleric', 'mage'] } },
    { id: 'pose_ora_constellation', label: '星象觀測 (Observation)', category: '占卜師專屬', intensity: 0.6, hand: 'pointing up', props: 'night sky', symmetry: 'celestial', template: 'pointing towards a specific glowing constellation, ancient sky charts around.', requirements: { job: ['cleric', 'elementalist'] } },
    { id: 'pose_ora_shuffle', label: '塔羅洗牌 (Tarot Shuffle)', category: '占卜師專屬', intensity: 0.5, hand: 'fast shuffle', props: 'flying cards', symmetry: 'fluid', template: 'shuffling a deck of tarot cards so fast they seem to fly and glow in a circle.', requirements: { job: ['cleric', 'bard'] } },
    { id: 'pose_ora_echo', label: '前世今生 (Life Echo)', category: '占卜師專屬', intensity: 0.8, hand: 'reaching out', props: 'reflections', symmetry: 'surreal', template: 'surrounded by distorted translucent reflections of alternative lives and futures.', requirements: { job: ['cleric', 'necromancer'] } },
    { id: 'pose_ora_fateride', label: '命運穿梭 (Fateride)', category: '占卜師專屬', intensity: 1.0, hand: 'floating', props: 'clockwork gears', symmetry: 'monumental', template: 'floating in a void filled with massive golden clockwork gears of destiny.', requirements: { job: ['cleric', 'alchemist'] } },

    // Vampire Hunter
    { id: 'pose_vam_loading', label: '聖銀上膛 (Silver Loading)', category: '吸血鬼獵人專屬', intensity: 0.6, hand: 'loading', props: 'glowing bolts', symmetry: 'tactical', template: 'loading a hand-crossbow with glowing silver bolts, moonlit church background.', requirements: { job: ['assassin', 'ranger'] } },
    { id: 'pose_vam_shadow', label: '教堂之影 (Church Shadow)', category: '吸血鬼獵人專屬', intensity: 0.3, hand: 'leaning', props: 'cross pillar', symmetry: 'atmospheric', template: 'leaning against a cross-shaped gothic pillar, looking into the dark mist.', requirements: { job: ['assassin', 'knight'] } },
    { id: 'pose_vam_ash', label: '灰燼消散 (Ash Dissipation)', category: '吸血鬼獵人專屬', intensity: 0.5, hand: 'looking down', props: 'burning dust', symmetry: 'final', template: 'looking at a pile of smoldering ash where a vampire was just defeated, mist.', requirements: { job: ['assassin', 'swordsman'] } },
    { id: 'pose_vam_cross', label: '十字劍樁 (Cross Blade)', category: '吸血鬼獵人專屬', intensity: 0.8, hand: 'cross position', props: 'stake and sword', symmetry: 'iconic', template: 'holding a wooden stake and a silver sword in a crossed defense position.', requirements: { job: ['assassin', 'paladin'] } },
    { id: 'pose_vam_slay', label: '黑夜屠殺 (Night Slaying)', category: '吸血鬼獵人專屬', intensity: 1.0, hand: 'mid-air whip', props: 'silver whip', symmetry: 'high action', template: 'leaping through the air while lashing out with a glowing silver-barbed whip.', requirements: { job: ['assassin', 'phantom_thief'] } },

    // Engineer
    { id: 'pose_eng_assembly', label: '齒輪組裝 (Gear Assembly)', category: '機械師專屬', intensity: 0.7, hand: 'floating tools', props: 'complex machine', symmetry: 'constructive', template: 'magically assembling a massive machine, bronze gears floating into place.', requirements: { job: ['alchemist', 'mage'] } },
    { id: 'pose_eng_steam', label: '蒸汽爆發 (Steam Eruption)', category: '機械師專屬', intensity: 0.6, hand: 'standing firm', props: 'steam vents', symmetry: 'industrial', template: 'standing heroically amidst thick white high-pressure steam from a machine.', requirements: { job: ['alchemist', 'swordsman'] } },
    { id: 'pose_eng_goggle', label: '護目鏡調整 (Goggle Adjust)', category: '機械師專屬', intensity: 0.3, hand: 'adjusting', props: 'brass goggles', symmetry: 'casual', template: 'pushing down or wiping lens of heavy brass goggles, grease on face.', requirements: { job: ['alchemist', 'alchemist'] } },
    { id: 'pose_eng_schematic', label: '圖紙狂熱 (Schematic Zeal)', category: '機械師專屬', intensity: 0.5, hand: 'unrolling', props: 'glowing blueprint', symmetry: 'obsessive', template: 'unrolling a massive glowing blue technical drawing, light illuminating face.', requirements: { job: ['alchemist', 'cleric'] } },
    { id: 'pose_eng_drone', label: '無人機指令 (Drone Command)', category: '機械師專屬', intensity: 0.8, hand: 'pointing', props: 'mechanical bird', symmetry: 'director', template: 'pointing one finger as a small brass mechanical bird takes flight from the hand.', requirements: { job: ['alchemist', 'summoner'] } },

    // --- 人類專屬 (Human) ---
    { id: 'pose_race_hum_dawn', label: '文明曙光 (Civilization Dawn)', category: '人類專屬', intensity: 0.4, hand: 'holding scroll', props: 'ancient scroll', symmetry: 'balanced', template: 'standing tall with a half-unrolled ancient scroll, the look of a pioneer of civilization.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_greet', label: '外交姿態 (Diplomatic Stance)', category: '人類專屬', intensity: 0.3, hand: 'open palms', props: 'none', symmetry: 'formal', template: 'a formal yet welcoming stance with open palms, showing trust and openness.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_rally', label: '戰地鼓舞 (Battle Inspiration)', category: '人類專屬', intensity: 0.8, hand: 'raised fist', props: 'banner', symmetry: 'dynamic', template: 'leading a charge with a raised fist and a tattered banner fluttering behind.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_harvest', label: '豐收喜悅 (Harvest Joy)', category: '人類專屬', intensity: 0.5, hand: 'carrying', props: 'basket of fruits', symmetry: 'casual', template: 'walking through a golden wheat field, carrying a heavy basket of harvest.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_fix', label: '平凡英雄 (Everyday Hero)', category: '人類專屬', intensity: 0.4, hand: 'tinkering', props: 'broken tool', symmetry: 'focused', template: 'crouched on the ground, carefully fixing a common tool, showing human persistence.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_map', label: '開疆闢土 (Pioneer Focus)', category: '人類專屬', intensity: 0.6, hand: 'pointing', props: 'huge map', symmetry: 'exploratory', template: 'leaning over a massive wooden table covered in maps, pointing to a new frontier.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_heritage', label: '鍛造傳承 (Heritage Forge)', category: '人類專屬', intensity: 0.7, hand: 'holding sword', props: 'heirloom weapon', symmetry: 'reverent', template: 'holding an old, notched heirloom sword with deep respect and heavy weight.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_watch', label: '守望之眼 (Watchman\'s Gaze)', category: '人類專屬', intensity: 0.3, hand: 'leaning on spear', props: 'spear', symmetry: 'steady', template: 'leaning against a stone wall with a spear, watching the sun rise over a city.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_market', label: '市集喧囂 (Market Hustle)', category: '人類專屬', intensity: 0.5, hand: 'gesturing', props: 'coins/goods', symmetry: 'lively', template: 'vibrant gesturing as if haggling in a crowded marketplace, full of life.', requirements: { race: ['human'] } },
    { id: 'pose_race_hum_toast', label: '誓言之杯 (Oath Toast)', category: '人類專屬', intensity: 0.6, hand: 'raising mug', props: 'wooden mug', symmetry: 'celebratory', template: 'raising a large wooden mug in a toast to fellowship and shared oaths.', requirements: { race: ['human'] } },

    // --- 精靈專屬 (Elf) ---
    { id: 'pose_race_elf_med', label: '月下冥想 (Moonlight Meditation)', category: '精靈專屬', intensity: 0.3, hand: 'floating', props: 'moonlight motes', symmetry: 'centered', template: 'hovering inches off the ground in a meditative pose, moonlight motes swirling.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_leaf', label: '自然共鳴 (Nature Resonance)', category: '精靈專屬', intensity: 0.5, hand: 'touching tree', props: 'glowing leaves', symmetry: 'organic', template: 'placing a palm against an ancient tree, green veins of light connecting hand to bark.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_bow', label: '長弓拉滿 (Draw Heavy Bow)', category: '精靈專屬', intensity: 0.9, hand: 'archery', props: 'longbow', symmetry: 'perfect', template: 'pulling a longbow to its absolute limit, perfect form, arrow of pure energy.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_glide', label: '森林穿梭 (Forest Glide)', category: '精靈專屬', intensity: 0.8, hand: 'sprinting', props: 'blurred trees', symmetry: 'fluid', template: 'sprinting with supernatural grace, feet barely touching the ground, motion blur.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_weave', label: '奧術編織 (Arcane Weaving)', category: '精靈專屬', intensity: 0.7, hand: 'harp fingers', props: 'light strings', symmetry: 'elegant', template: 'moving fingers as if playing an invisible harp made of glowing magical strings.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_sad', label: '永恆憂鬱 (Eternal Melancholy)', category: '精靈專屬', intensity: 0.4, hand: 'holding flower', props: 'wilting flower', symmetry: 'dramatic', template: 'looking down at a wilting flower, the weight of centuries in the expression.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_leap', label: '輕盈躍動 (Lightfoot Jump)', category: '精靈專屬', intensity: 0.8, hand: 'mid-air', props: 'branch tips', symmetry: 'vertical', template: 'mid-leap between high branches, looking down with calm confidence.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_teach', label: '古語授課 (Ancient Teaching)', category: '精靈專屬', intensity: 0.5, hand: 'pointing to book', props: 'glowing tome', symmetry: 'academic', template: 'explaining ancient runes to a small floating forest spirit, gentle posture.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_arrow', label: '翠綠之箭 (Verdant Arrow)', category: '精靈專屬', intensity: 0.7, hand: 'conjuring', props: 'light arrow', symmetry: 'precise', template: 'creating an arrow of pure green light and leaves between the fingers.', requirements: { race: ['elf'] } },
    { id: 'pose_race_elf_stroll', label: '星光漫步 (Starlight Stroll)', category: '精靈專屬', intensity: 0.6, hand: 'walking', props: 'glowing footprints', symmetry: 'ethereal', template: 'walking on air with each step creating a ripple of starlight in the sky.', requirements: { race: ['elf'] } },

    // --- 矮人專屬 (Dwarf) ---
    { id: 'pose_race_dwa_mtn', label: '如山屹立 (Stand as Mountains)', category: '矮人專屬', intensity: 0.6, hand: 'hammer on shoulder', props: 'giant hammer', symmetry: 'heavy', template: 'wide leg stance, massive hammer resting on a thick armored shoulder, unyielding.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_forge', label: '熾熱鍛打 (Fiery Striking)', category: '矮人專屬', intensity: 0.9, hand: 'striking', props: 'glowing anvil', symmetry: 'powerful', template: 'swinging a blacksmith hammer down onto a glowing white-hot anvil, sparks flying.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_beer', label: '烈酒乾杯 (Bottoms Up!)', category: '矮人專屬', intensity: 0.6, hand: 'chugging', props: 'stone mug', symmetry: 'joyful', template: 'tipping back a massive stone mug, foam spilling onto a thick braided beard.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_mine', label: '礦坑勘探 (Mine Prospecting)', category: '矮人專屬', intensity: 0.4, hand: 'holding lantern', props: 'lantern', symmetry: 'focused', template: 'holding a pickaxe and a lantern, inspecting a vein of gold in a dark cave.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_chant', label: '地底合唱 (Underground Chorus)', category: '矮人專屬', intensity: 0.5, hand: 'hand on chest', props: 'echoing cave', symmetry: 'vocal', template: 'singing a low-frequency ancestral song that makes the cavern walls vibrate.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_armor', label: '厚重裝甲 (Armor Check)', category: '矮人專屬', intensity: 0.4, hand: 'adjusting', props: 'metal plate', symmetry: 'sturdy', template: 'tightening the straps on a massive ornate metal chestplate, steam rising.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_whirl', label: '戰錘旋風 (Hammer Whirlwind)', category: '矮人專屬', intensity: 0.9, hand: 'spinning', props: 'giant maul', symmetry: 'circular', template: 'low spin with a giant maul, creating a localized dust storm, crushing force.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_gem', label: '寶石鑑定 (Gem Appraisal)', category: '矮人專屬', intensity: 0.5, hand: 'squinting', props: 'glowing ruby', symmetry: 'greedy', template: 'holding a raw ruby close to one eye, the red light reflecting in the iris.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_pipe', label: '古老工程 (Ancient Engineering)', category: '矮人專屬', intensity: 0.7, hand: 'wrestling valve', props: 'huge pipe', symmetry: 'mechanical', template: 'turning a massive rusted steam valve with all their might, muscles bulging.', requirements: { race: ['dwarf'] } },
    { id: 'pose_race_dwa_shield', label: '祖靈庇護 (Ancestral Shield)', category: '矮人專屬', intensity: 0.8, hand: 'behind shield', props: 'tower shield', symmetry: 'defensive', template: 'crouching behind a shield engraved with ancestor faces, block position.', requirements: { race: ['dwarf'] } },

    // --- 獸人專屬 (Orc) ---
    { id: 'pose_race_orc_roar', label: '部落咆哮 (Tribal Roar)', category: '獸族專屬', intensity: 0.9, hand: 'arms wide', props: 'bone necklace', symmetry: 'raw', template: 'standing on a pile of skulls, arms wide open to the sky, roaring at the gods.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_stalk', label: '野性潛行 (Primal Stalk)', category: '獸族專屬', intensity: 0.7, hand: 'claws out', props: 'mud/scars', symmetry: 'primal', template: 'crouched low in deep mud or tall grass, eyes reflecting a predator\'s hunger.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_slam', label: '大骨重擊 (Greatbone Slam)', category: '獸族專屬', intensity: 1.0, hand: 'gripping massive bone', props: 'dragon bone club', symmetry: 'shaking ground', template: 'smashing a colossal dragon bone club into the ground, causing earth cracks.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_dance', label: '先祖戰舞 (Ancestral War Dance)', category: '獸族專屬', intensity: 0.6, hand: 'rhythmic step', props: 'ritual paint', symmetry: 'tribal', template: 'performing a heavy, rhythmic war dance by a bonfire, dust rising from the feet.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_totem', label: '圖騰之靈 (Totem Spirit)', category: '獸族專屬', intensity: 0.5, hand: 'touching wood', props: 'magic totem', symmetry: 'spiritual', template: 'leaning forehead against a glowing wooden totem, spirits of ancestors appearing.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_charge', label: '狂暴衝鋒 (Berserker Charge)', category: '獸族專屬', intensity: 0.9, hand: 'leading with shoulder', props: 'heavy scars', symmetry: 'unstoppable', template: 'mid-sprint, shoulders hunched, teeth bared, ignoring all wounds and pain.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_council', label: '部落會議 (Council Seat)', category: '獸族專屬', intensity: 0.3, hand: 'on knees', props: 'furs/fire', symmetry: 'elder', template: 'sitting on a throne of tusks and furs, looking down with grim wisdom.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_mark', label: '狩獵標記 (Hunting Mark)', category: '獸族專屬', intensity: 0.8, hand: 'finger tracing ground', props: 'faint tracks', symmetry: 'focused', template: 'kneeling to inspect a track, eyes narrowed, smelling the air for blood.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_flex', label: '力量展示 (Flex of Strength)', category: '獸族專屬', intensity: 0.7, hand: 'tensing arms', props: 'none', symmetry: 'massive', template: 'displaying the unnatural size of pectoral and arm muscles, veins popping.', requirements: { race: ['orc'] } },
    { id: 'pose_race_orc_triumph', label: '荒野凱旋 (Wild Triumph)', category: '獸族專屬', intensity: 0.9, hand: 'raising severed head', props: 'fantasy trophy', symmetry: 'savage', template: 'one foot on a defeated beast, raising a massive weapon or trophy high.', requirements: { race: ['orc'] } },

    // --- 貓靈專屬 (Cat Sith) ---
    { id: 'pose_race_cat_peek', label: '好奇探頭 (Curious Peek)', category: '貓靈專屬', intensity: 0.4, hand: 'near whiskers', props: 'floating yarn', symmetry: 'playful', template: 'peeking from behind a curtain or pillar, head tilted, pupils slightly dilated.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_pounce', label: '月下輕躍 (Moonlit Pounce)', category: '貓靈專屬', intensity: 0.7, hand: 'extended claws', props: 'butterfly of light', symmetry: 'acrobatic', template: 'mid-air jump with high dexterity, hands reaching for a magical light mote.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_wrap', label: '尾巴纏繞 (Tail Wrap)', category: '貓靈專屬', intensity: 0.3, hand: 'cradling tail', props: 'fluffy tail', symmetry: 'comfortable', template: 'sitting elegantly on a velvet cushion, fluffy tail wrapped around the knees.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_claw', label: '磨爪習性 (Claw Sharpening)', category: '貓靈專屬', intensity: 0.5, hand: 'scratching', props: 'wooden post', symmetry: 'instinctive', template: 'kneeling and stretching the shoulders while scratching a rough wooden surface.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_groom', label: '優雅梳理 (Graceful Grooming)', category: '貓靈專屬', intensity: 0.4, hand: 'touching ear', props: 'comb', symmetry: 'vain', template: 'carefully adjusting the tufts of fur on the ears, a dainty and refined pose.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_sense', label: '感知啟動 (Sense Activation)', category: '貓靈專屬', intensity: 0.6, hand: 'ear twitch', props: 'unseen sound', symmetry: 'vibrating', template: 'stiffening up, ears flattened, tail low and twitching, high alert.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_perch', label: '高處俯瞰 (Perch Watch)', category: '貓靈專屬', intensity: 0.3, hand: 'hanging off ledge', props: 'narrow railing', symmetry: 'vertical', template: 'crouched perfectly on a thin balcony railing, looking down at the street.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_tease', label: '調皮挑逗 (Playful Tease)', category: '貓靈專屬', intensity: 0.5, hand: 'beckoning', props: 'playful wink', symmetry: 'mischievous', template: 'one hand beckoning "come here" while the tail twitches in a taunting rhythm.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_nap', label: '午睡預備 (Napping Prep)', category: '貓靈專屬', intensity: 0.2, hand: 'yawning', props: 'warm sunlight', symmetry: 'sleepy', template: 'curled in a ball in a patch of sunlight, eyes halfway closed, radiating peace.', requirements: { race: ['cat_sith'] } },
    { id: 'pose_race_cat_flip', label: '靈動空翻 (Agile Flip)', category: '貓靈專屬', intensity: 0.8, hand: 'spinning', props: 'dynamic ribbons', symmetry: 'gymnastic', template: 'performing a perfect backflip from a high place, landing silently on toes.', requirements: { race: ['cat_sith'] } },

    // --- 龍裔專屬 (Dragonborn) ---
    { id: 'pose_race_dra_breath', label: '巨龍吐息 (Dragon Breath)', category: '龍裔專屬', intensity: 0.9, hand: 'near throat', props: 'glowing embers', symmetry: 'elemental', template: 'leaning forward, hand near the throat as smoke and fire spill from the mouth.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_wings', label: '翼膜展現 (Wing-Crest Show)', category: '龍裔專屬', intensity: 0.7, hand: 'arms wide', props: 'wing silhouette', symmetry: 'majestic', template: 'spreading arms wide, a holographic or magical pair of wings appearing behind.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_scales', label: '鱗甲護衛 (Serrated Guard)', category: '龍裔專屬', intensity: 0.5, hand: 'crossed arms', props: 'plated armor', symmetry: 'tough', template: 'standing with arms crossed, sunlight reflecting off the intricate scales.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_majesty', label: '古龍威儀 (Elder Majesty)', category: '龍裔專屬', intensity: 0.4, hand: 'holding scepter', props: 'royal throne', symmetry: 'monumental', template: 'sitting with ancient dignity, vertical reptilian pupils focused and cold.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_rend', label: '爪擊裂痕 (Claw Rend)', category: '龍裔專屬', intensity: 0.8, hand: 'slashing claws', props: 'burning cuts', symmetry: 'violent', template: 'slashing through the air, claws leaving trails of fire or ice in their wake.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_slam', label: '尾擊震地 (Tail Slam)', category: '龍裔專屬', intensity: 0.7, hand: 'heavy stomp', props: 'shattered floor', symmetry: 'impact', template: 'slamming a heavy scaled tail into the marble floor, causing it to crack.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_magma', label: '熔岩沐浴 (Magma Bath)', category: '龍裔專屬', intensity: 0.6, hand: 'stepping into fire', props: 'flowing lava', symmetry: 'unscathed', template: 'standing calmly inside a pool of lava, fire flowing off the scales like water.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_lookout', label: '守望孤峰 (Peak Lookout)', category: '龍裔專屬', intensity: 0.5, hand: 'hands behind back', props: 'mountain wind', symmetry: 'contemplative', template: 'standing on a snowy peak, wind whipping around the draconic features.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_awake', label: '龍魂覺醒 (Soul Awakening)', category: '龍裔專屬', intensity: 0.9, hand: 'clasping hands', props: 'dragon spirit', symmetry: 'spiritual', template: 'a massive spectral ancient dragon rising from the character\'s body.', requirements: { race: ['dragonborn'] } },
    { id: 'pose_race_dra_roar', label: '金屬咆哮 (Metallic Roar)', category: '龍裔專屬', intensity: 1.0, hand: 'teeth bared', props: 'lightning sparks', symmetry: 'destructive', template: 'a roar that sounds like grinding metal and thunder, sparks in the mouth.', requirements: { race: ['dragonborn'] } },

    // --- 人魚專屬 (Mermaid/Siren) ---
    { id: 'pose_race_mer_swim', label: '深海巡遊 (Deep Sea Cruise)', category: '人魚專屬', intensity: 0.6, hand: 'gliding', props: 'bubbles', symmetry: 'fluid', template: 'swimming gracefully horizontally, hair and fins trailing in the currents.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'pose_race_mer_reef', label: '礁石歌唱 (Reef Singing)', category: '人魚專屬', intensity: 0.4, hand: 'on rock', props: 'shell harp', symmetry: 'static', template: 'sitting on a moonlit reef rock, tail partially in water, singing to the stars.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'pose_race_mer_pearl', label: '珍珠守護 (Pearl Guardian)', category: '人魚專屬', intensity: 0.5, hand: 'holding orb', props: 'giant pearl', symmetry: 'reverent', template: 'cradling a massive glowing pearl against the chest, soft bioluminescence.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'pose_race_mer_bubble', label: '泡沫幻影 (Bubble Phantom)', category: '人魚專屬', intensity: 0.7, hand: 'encased', props: 'sphere of water', symmetry: 'contained', template: 'floating inside a giant magic water sphere, reaching out to the viewer.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'pose_race_mer_vortex', label: '漩渦利刃 (Vortex Blade)', category: '人魚專屬', intensity: 0.9, hand: 'spinning', props: 'water blades', symmetry: 'circular', template: 'spinning rapidly to create a deadly vortex of sharp water ribbons around the body.', requirements: { race: ['mermaid', 'siren'] } },

    // --- 魅魔/夢魔專屬 (Succubus/Incubus) ---
    { id: 'pose_race_suc_kiss', label: '誘惑之吻 (Seductive Kiss)', category: '惡魔專屬', intensity: 0.5, hand: 'near lips', props: 'shadow heart', symmetry: 'alluring', template: 'leaning forward with a playful finger near the lips, heart-shaped tail tip visible.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'pose_race_suc_entwine', label: '夢境纏繞 (Dream Entwinement)', category: '惡魔專屬', intensity: 0.7, hand: 'reaching low', props: 'purple mist', symmetry: 'wraparound', template: 'half-submerged in dark purple mist, wings wrapped protectively around the self.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'pose_race_suc_wings', label: '漆黑羽翼 (Obsidian Wings)', category: '惡魔專屬', intensity: 0.8, hand: 'arms wide', props: 'bat wings', symmetry: 'expansive', template: 'standing on a balcony under a red moon, massive leathery wings fully extended.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'pose_race_suc_harvest', label: '靈魂收割 (Soul Harvest)', category: '惡魔專屬', intensity: 0.9, hand: 'grasping', props: 'soul essence', symmetry: 'violent', template: 'holding a glowing blue soul essence, eyes reflecting the hunger for power.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'pose_race_suc_throne', label: '王座慵懶 (Throne Laziness)', category: '惡魔專屬', intensity: 0.4, hand: 'leaning back', props: 'bone throne', symmetry: 'relaxed', template: 'lounging on a throne made of ebony and bone, one leg crossed over the other.', requirements: { race: ['succubus', 'incubus'] } },

    // --- 墮天使專屬 (Fallen Angel) ---
    { id: 'pose_race_fal_fall', label: '墜入凡塵 (Celestial Descent)', category: '墮天使專屬', intensity: 0.8, hand: 'reaching up', props: 'falling feathers', symmetry: 'vertical', template: 'falling backwards through clouds, tattered black wings trailing feathers.', requirements: { race: ['fallen_angel'] } },
    { id: 'pose_race_fal_grief', label: '餘燼之慟 (Ember Grief)', category: '墮天使專屬', intensity: 0.4, hand: 'kneeling', props: 'broken halo', symmetry: 'mournful', template: 'kneeling amidst ash and ruins, holding a shattered halo, wings drooping.', requirements: { race: ['fallen_angel'] } },
    { id: 'pose_race_fal_sword', label: '黑羽之劍 (Blackfeather Blade)', category: '墮天使專屬', intensity: 0.9, hand: 'wielding', props: 'dark energy sword', symmetry: 'striking', template: 'swinging a sword made of solidified shadow and black feathers, impact sparks.', requirements: { race: ['fallen_angel'] } },
    { id: 'pose_race_fal_statue', label: '孤獨石像 (Lonely Statue)', category: '墮天使專屬', intensity: 0.3, hand: 'still', props: 'gothic cathedral', symmetry: 'still', template: 'perched on a gargoyle ledge, looking into the distance with tragic stillness.', requirements: { race: ['fallen_angel'] } },
    { id: 'pose_race_fal_ascend', label: '逆向升天 (Inverse Ascent)', category: '墮天使專屬', intensity: 0.7, hand: 'arms out', props: 'black light', symmetry: 'majestic', template: 'rising from the ground as a pillar of dark light erupts beneath, wings flared.', requirements: { race: ['fallen_angel'] } },

    // --- 妖精專屬 (Fairy) ---
    { id: 'pose_race_fai_hover', label: '花尖輕駐 (Flower Resting)', category: '妖精專屬', intensity: 0.3, hand: 'touching petal', props: 'giant flower', symmetry: 'tiny', template: 'standing on the edge of a giant dew-covered petal, wings vibrating fast.', requirements: { race: ['fairy'] } },
    { id: 'pose_race_fai_swarm', label: '螢火伴舞 (Firefly Dance)', category: '妖精專屬', intensity: 0.6, hand: 'twirling', props: 'swarm of light', symmetry: 'circular', template: 'spinning in a circle as dozens of magical fireflies follow the movement.', requirements: { race: ['fairy'] } },
    { id: 'pose_race_fai_bless', label: '粉塵祝福 (Dust Blessing)', category: '妖精專屬', intensity: 0.5, hand: 'shaking wings', props: 'glittering dust', symmetry: 'shimmering', template: 'shaking the wings to release a cloud of golden revitalizing magic dust.', requirements: { race: ['fairy'] } },
    { id: 'pose_race_fai_hide', label: '躲避視線 (Hiding in Leaves)', category: '妖精專屬', intensity: 0.4, hand: 'peeking', props: 'thick broadleaf', symmetry: 'stealthy', template: 'hiding behind a large leaf, only the sparkling eyes and wing tips visible.', requirements: { race: ['fairy'] } },
    { id: 'pose_race_fai_zap', label: '淘氣電擊 (Mischievous Zap)', category: '妖精專屬', intensity: 0.8, hand: 'pointing', props: 'arcane sparks', symmetry: 'dynamic', template: 'pointing a finger to launch a tiny but bright spark of mischief at the viewer.', requirements: { race: ['fairy'] } },

    // --- 暗精靈專屬 (Dark Elf) ---
    { id: 'pose_race_delf_dagger', label: '蛛絲匕首 (Spider-silk Dagger)', category: '暗精靈專屬', intensity: 0.7, hand: 'reverse grip', props: 'obsidian daggers', symmetry: 'stealthy', template: 'crouched in an alleyway, twin black daggers held in a reverse combat grip.', requirements: { race: ['dark_elf'] } },
    { id: 'pose_race_delf_sacrifice', label: '地下祭典 (Underdark Ritual)', category: '暗精靈專屬', intensity: 0.6, hand: 'holding bowl', props: 'sacrifice altar', symmetry: 'ritualistic', template: 'standing before a spider-themed altar, purple bioluminescence everywhere.', requirements: { race: ['dark_elf'] } },
    { id: 'pose_race_delf_poison', label: '毒液調配 (Venom Mixing)', category: '暗精靈專屬', intensity: 0.5, hand: 'dripping liquid', props: 'glass vial', symmetry: 'careful', template: 'carefully coating a blade with glowing green spider venom, precise look.', requirements: { race: ['dark_elf'] } },
    { id: 'pose_race_delf_leap', label: '暗影躍遷 (Shadow Leap)', category: '暗精靈專屬', intensity: 0.9, hand: 'mid-air', props: 'shadow tentacles', symmetry: 'explosive', template: 'jumping out of a literal pool of shadow on the wall, hand extended to strike.', requirements: { race: ['dark_elf'] } },
    { id: 'pose_race_delf_scorn', label: '地底傲視 (Underlight Scorn)', category: '暗精靈專屬', intensity: 0.4, hand: 'hand on hip', props: 'matriarch staff', symmetry: 'noble', template: 'leaning on an ornate spider-headed staff, looking down with cold nobility.', requirements: { race: ['dark_elf'] } },

    // --- 哥布林專屬 (Goblin) ---
    { id: 'pose_race_gob_sneak', label: '暗巷潛伏 (Alley Sneak)', category: '哥布林專屬', intensity: 0.5, hand: 'holding dagger', props: 'sewer pipes', symmetry: 'crouched', template: 'crouched behind a rusty pipe, yellow eyes peeking out from a patchwork hood.', requirements: { race: ['goblin'] } },
    { id: 'pose_race_gob_loot', label: '貪婪摸索 (Greedy Looting)', category: '哥布林專屬', intensity: 0.4, hand: 'holding sack', props: 'shiny gold coins', symmetry: 'excited', template: 'frantically stuffing golden spoons and jewelry into a large tattered sack.', requirements: { race: ['goblin'] } },
    { id: 'pose_race_gob_cackle', label: '狡黠大笑 (Cunning Cackle)', category: '哥布林專屬', intensity: 0.6, hand: 'rubbing hands', props: 'vial of poison', symmetry: 'mischievous', template: 'rubbing hands together over a bubbling green cauldron, shadow casting long ears.', requirements: { race: ['goblin'] } },
    { id: 'pose_race_gob_tinker', label: '廢鐵拼裝 (Scrap Tinkering)', category: '哥布林專屬', intensity: 0.5, hand: 'using wrench', props: 'glowing bomb', symmetry: 'focused', template: 'carefully adjusting a clockwork bomb made of gears and scrap metal.', requirements: { race: ['goblin'] } },
    { id: 'pose_race_gob_scurry', label: '膽小逃穿 (Cowardly Scurry)', category: '哥布林專屬', intensity: 0.7, hand: 'running low', props: 'smoke cloud', symmetry: 'fleeing', template: 'running away while looking over the shoulder, one arm shielding the head.', requirements: { race: ['goblin'] } },

    // --- 娜迦/蛇人專屬 (Naga) ---
    { id: 'pose_race_nag_coil', label: '蛇身盤踞 (Serpent Coil)', category: '娜迦專屬', intensity: 0.4, hand: 'resting on tail', props: 'ancient pillars', symmetry: 'noble', template: 'half-human body upright while the massive serpent tail is coiled in a perfect circle.', requirements: { race: ['naga', 'naga_m'] } },
    { id: 'pose_race_nag_strike', label: '致命迅擊 (Lethal Strike)', category: '娜迦專屬', intensity: 0.9, hand: 'lunge', props: 'poisoned trident', symmetry: 'fast', template: 'mid-lunge with a trident, the tail snapping forward to provide explosive power.', requirements: { race: ['naga', 'naga_m'] } },
    { id: 'pose_race_nag_swim', label: '濕地巡弋 (Swamp Cruise)', category: '娜迦專屬', intensity: 0.6, hand: 'gliding', props: 'murky water', symmetry: 'fluid', template: 'swimming through swamp water, only the head and upper back visible above ripples.', requirements: { race: ['naga', 'naga_m'] } },
    { id: 'pose_race_nag_charm', label: '鱗光魅惑 (Scale Charm)', category: '娜迦專屬', intensity: 0.5, hand: 'caressing scales', props: 'jeweled headpiece', symmetry: 'alluring', template: 'leaning back with arms raised, moonlight reflecting off iridescent scales.', requirements: { race: ['naga', 'naga_m'] } },
    { id: 'pose_race_nag_constrict', label: '強力絞殺 (Power Constrict)', category: '娜迦專屬', intensity: 0.8, hand: 'tensing body', props: 'crushed statue', symmetry: 'crushing', template: 'wrapping the powerful tail around a stone pillar until it begins to crack.', requirements: { race: ['naga', 'naga_m'] } },

    // --- 牛頭人專屬 (Minotaur) ---
    { id: 'pose_race_min_charge', label: '橫衝直撞 (Bull Charge)', category: '牛頭人專屬', intensity: 1.0, hand: 'lowering horns', props: 'dust clouds', symmetry: 'unstoppable', template: 'lowering the heavy horned head and slamming forward with earth-shaking force.', requirements: { race: ['minotaur'] } },
    { id: 'pose_race_min_roar', label: '迷宮咆哮 (Labyrinth Roar)', category: '牛頭人專屬', intensity: 0.9, hand: 'holding axe', props: 'stone walls', symmetry: 'epic', template: 'standing at a crossroad in a stone maze, head back in a thunderous bellow.', requirements: { race: ['minotaur'] } },
    { id: 'pose_race_min_med', label: '野性冥想 (Feral Med)', category: '牛頭人專屬', intensity: 0.3, hand: 'kneeling', props: 'ritual markings', symmetry: 'centered', template: 'kneeling in a quiet cavern, smoke rising from massive nostrils in deep thought.', requirements: { race: ['minotaur'] } },
    { id: 'pose_race_min_axe', label: '巨斧揮擊 (Great Axe Cleave)', category: '牛頭人專屬', intensity: 0.8, hand: 'swinging overhead', props: 'massive battleaxe', symmetry: 'circular', template: 'swinging a huge axe in a wide horizontal arc, cutting through everything.', requirements: { race: ['minotaur'] } },
    { id: 'pose_race_min_guard', label: '迷宮守望 (Maze Guardian)', category: '牛頭人專屬', intensity: 0.4, hand: 'leaning on weapon', props: 'heavy iron door', symmetry: 'loyal', template: 'standing guard before a massive iron gate, unmoving like a living statue.', requirements: { race: ['minotaur'] } },

    // --- 巨人專屬 (Giant) ---
    { id: 'pose_race_gia_stomp', label: '震地踐踏 (Earth Stomp)', category: '巨人專屬', intensity: 1.0, hand: 'heavy step', props: 'tiny houses', symmetry: 'monumental', template: 'stepping down with a foot larger than a cottage, shockwaves radiating outward.', requirements: { race: ['giant', 'cyclops'] } },
    { id: 'pose_race_gia_cloud', label: '雲端漫步 (Cloud Stride)', category: '巨人專屬', intensity: 0.6, hand: 'parting clouds', props: 'thick fog', symmetry: 'airy', template: 'upper body emerging from the clouds as if looking down from the heavens.', requirements: { race: ['giant', 'cyclops'] } },
    { id: 'pose_race_gia_throw', label: '投擲巨石 (Boulder Toss)', category: '巨人專屬', intensity: 0.9, hand: 'throwing', props: 'massive rock', symmetry: 'projectile', template: 'heaving a jagged mountain rock overhead, muscles straining with pure power.', requirements: { race: ['giant', 'cyclops'] } },
    { id: 'pose_race_gia_look', label: '高空俯視 (Aerial View)', category: '巨人專屬', intensity: 0.3, hand: 'on knee', props: 'valley below', symmetry: 'vertical', template: 'crouching low to look at a small village, a look of immense scale difference.', requirements: { race: ['giant', 'cyclops'] } },
    { id: 'pose_race_gia_pillar', label: '神廟支柱 (Temple Pillar)', category: '巨人專屬', intensity: 0.5, hand: 'holding roof', props: 'ruined temple', symmetry: 'architectural', template: 'using bare hands to hold up a collapsing temple ceiling, absolute strength.', requirements: { race: ['giant', 'cyclops'] } },

    // --- 蜥蜴人專屬 (Lizardfolk) ---
    { id: 'pose_race_liz_crawl', label: '低位爬行 (Low Crawl)', category: '蜥蜴專屬', intensity: 0.6, hand: 'claws on mud', props: 'swamp vines', symmetry: 'stealthy', template: 'belly close to the ground, tail trailing behind, moving through thick mud.', requirements: { race: ['lizardfolk'] } },
    { id: 'pose_race_liz_sun', label: '岩石日光 (Sun Basking)', category: '蜥蜴專屬', intensity: 0.2, hand: 'laid out', props: 'hot desert rock', symmetry: 'still', template: 'lying flat on a sun-warmed rock, eyes closed, body absorbing the heat.', requirements: { race: ['lizardfolk'] } },
    { id: 'pose_race_liz_tongue', label: '氣味捕捉 (Scent Catch)', category: '蜥蜴專屬', intensity: 0.5, hand: 'stillness', props: 'misty jungle', symmetry: 'sensory', template: 'standing perfectly still, flicking the tongue out to sample the air.', requirements: { race: ['lizardfolk'] } },
    { id: 'pose_race_liz_spear', label: '獵魚標槍 (Fish Spear)', category: '蜥蜴專屬', intensity: 0.7, hand: 'holding harpoon', props: 'river reeds', symmetry: 'precise', template: 'standing in a river, spear poised over the water, ready to strike.', requirements: { race: ['lizardfolk'] } },
    { id: 'pose_race_liz_hiss', label: '鼓喉威嚇 (Throat Snarl)', category: '蜥蜴專屬', intensity: 0.8, hand: 'claws raised', props: 'bone necklace', symmetry: 'intimidating', template: 'throat puffed out, mouth open to reveal sharp teeth, low crouch.', requirements: { race: ['lizardfolk'] } },

    // --- 蜘蛛精專屬 (Arachne/Spider Folk) ---
    { id: 'pose_race_ara_weave', label: '蛛網編織 (Web Weaving)', category: '織命專屬', intensity: 0.6, hand: 'spinning silk', props: 'massive glowing web', symmetry: 'multitasking', template: 'using four human arms and spider legs to weave a complex, glowing silk web in a dark corner.', requirements: { race: ['arachne'] } },
    { id: 'pose_race_ara_wall', label: '垂直守望 (Vertical Watch)', category: '織命專屬', intensity: 0.7, hand: 'gripping stone', props: 'cavern ceiling', symmetry: 'inverted', template: 'hanging upside down from the ceiling by spider legs, human torso looking down at the screen.', requirements: { race: ['arachne'] } },
    { id: 'pose_race_ara_coco', label: '繭中祭品 (Cocoon Ritual)', category: '織命專屬', intensity: 0.8, hand: 'wrapping prey', props: 'silk cocoon', symmetry: 'predatory', template: 'human body leaning over personal prey wrapped in thick silk, spider legs guarding the perimeter.', requirements: { race: ['arachne'] } },
    { id: 'pose_race_ara_skuttle', label: '八足掠行 (Eight-Legged Skuttle)', category: '織命專屬', intensity: 0.9, hand: 'sprinting', props: 'blurred tunnels', symmetry: 'dynamic hex', template: 'moving at high speed with eight sharp legs, human torso low and aerodynamic, motion blur.', requirements: { race: ['arachne'] } },
    { id: 'pose_race_ara_throne', label: '蛛絲寶座 (Silk Throne)', category: '織命專屬', intensity: 0.5, hand: 'resting chin', props: 'obsidian throne', symmetry: 'regal', template: 'sitting on a throne of black silk, spider legs folded elegantly like a skirt around the seat.', requirements: { race: ['arachne'] } },

    // --- 半人馬專屬 (Centaur) ---
    { id: 'pose_race_cen_gallop', label: '荒野馳騁 (Wild Gallop)', category: '荒野專屬', intensity: 1.0, hand: 'holding bow', props: 'grassy plains', symmetry: 'muscular', template: 'horse body at full gallop, human torso twisted back to fire an arrow, hair flowing in wind.', requirements: { race: ['centaur'] } },
    { id: 'pose_race_cen_rear', label: '前蹄騰空 (Rearing High)', category: '荒野專屬', intensity: 0.9, hand: 'raised weapon', props: 'mountain peaks', symmetry: 'vertical', template: 'horse body rearing up on hind legs, human torso letting out a battle cry, epic low angle.', requirements: { race: ['centaur'] } },
    { id: 'pose_race_cen_graze', label: '林間憩息 (Forest Grazing)', category: '荒野專屬', intensity: 0.3, hand: 'picking fruit', props: 'sun-dappled glade', symmetry: 'peaceful', template: 'horse body standing calmly in a glade, human torso reaching up to pick fruit from a tree.', requirements: { race: ['centaur'] } },
    { id: 'pose_race_cen_charge', label: '長矛衝擊 (Spear Charge)', category: '荒野專屬', intensity: 0.8, hand: 'leveling spear', props: 'battlefield dust', symmetry: 'forward', template: 'low charge with spear leveled, massive horse body muscles tense and powerful.', requirements: { race: ['centaur'] } },
    { id: 'pose_race_cen_water', label: '溪水映月 (Creek Reflection)', category: '荒野專屬', intensity: 0.4, hand: 'holding lantern', props: 'night river', symmetry: 'serene', template: 'standing in a shallow river at night, looking at the reflection of the human and horse halves.', requirements: { race: ['centaur'] } },

    // --- 史萊姆專屬 (Slime/Ooze) ---
    { id: 'pose_race_sli_melt', label: '液態消散 (Liquid Dissolve)', category: '異型專屬', intensity: 0.7, hand: 'melting away', props: 'puddle of ooze', symmetry: 'fluid', template: 'lower body completely melted into a pool of glowing jelly, upper torso trying to hold form.', requirements: { race: ['slime', 'ooze'] } },
    { id: 'pose_race_sli_form', label: '流變擬態 (Mimic Shifting)', category: '異型專屬', intensity: 0.6, hand: 'shaping blades', props: 'translucent body', symmetry: 'malleable', template: 'shaping the fluid arms into sharp translucent blades, internal cores visible.', requirements: { race: ['slime', 'ooze'] } },
    { id: 'pose_race_sli_absorb', label: '魔力吸收 (Mana Absorption)', category: '異型專屬', intensity: 0.5, hand: 'engulfing', props: 'magic crystals', symmetry: 'expanding', template: 'enveloping glowing crystals inside the translucent gelatinous body, glowing internally.', requirements: { race: ['slime', 'ooze'] } },
    { id: 'pose_race_sli_rebound', label: '彈力躍遷 (Elastic Leap)', category: '異型專屬', intensity: 0.9, hand: 'stretching', props: 'impact crater', symmetry: 'bouncy', template: 'mid-air leap with the body stretched like rubber, trailing viscous liquid.', requirements: { race: ['slime', 'ooze'] } },
    { id: 'pose_race_sli_split', label: '分裂孿生 (Divisional Twin)', category: '異型專屬', intensity: 0.8, hand: 'reaching self', props: 'cloned limbs', symmetry: 'duplicate', template: 'dividing into two identical half-formed beings linked by a thin strand of jelly.', requirements: { race: ['slime', 'ooze'] } },

    // --- 杜拉漢專屬 (Dullahan/Headless) ---
    { id: 'pose_race_dul_hold', label: '首級凝視 (Head Gaze)', category: '無頭專屬', intensity: 0.5, hand: 'cradling head', props: 'severed head', symmetry: 'eerie', template: 'headless body holding its own head by the hair, the head looking directly at the camera.', requirements: { race: ['dullahan'] } },
    { id: 'pose_race_dul_steed', label: '冥界奔襲 (Reaper Ride)', category: '無頭專屬', intensity: 1.0, hand: 'holding reins', props: 'phantom horse', symmetry: 'epic', template: 'riding a spectral horse with spine-whip in hand, head attached to the saddle looking back.', requirements: { race: ['dullahan'] } },
    { id: 'pose_race_dul_whisper', label: '死亡密談 (Death Whisper)', category: '無頭專屬', intensity: 0.6, hand: 'lifting head', props: 'dying soldier', symmetry: 'intimate', template: 'leaning over a target, holding its own head close to their ear to whisper their end.', requirements: { race: ['dullahan'] } },
    { id: 'pose_race_dul_whip', label: '脊椎長鞭 (Spine Whip)', category: '無頭專屬', intensity: 0.9, hand: 'cracking whip', props: 'human spine whip', symmetry: 'violent', template: 'headless body cracking a whip made of bone, blue soul-fire erupting from the neck.', requirements: { race: ['dullahan'] } },
    { id: 'pose_race_dul_search', label: '無頭尋夢 (Headless Search)', category: '無頭專屬', intensity: 0.4, hand: 'groping air', props: 'foggy graveyard', symmetry: 'lost', template: 'stumbling through the mist, hands reaching out blindly while searching for its lost head.', requirements: { race: ['dullahan'] } },

    // --- 樹人/乾枯妖精專屬 (Dryad/Treant) ---
    { id: 'pose_race_dry_root', label: '深根固柢 (Deep Rooting)', category: '森心專屬', intensity: 0.4, hand: 'becoming bark', props: 'forest floor', symmetry: 'static', template: 'legs transforming into wooden roots, arms turning into leafy branches, static and majestic.', requirements: { race: ['dryad', 'treant'] } },
    { id: 'pose_race_dry_sing', label: '萬物之歌 (Song of All)', category: '森心專屬', intensity: 0.6, hand: 'conducting', props: 'swirling leaves', symmetry: 'rhythmic', template: 'guiding the growth of vines with graceful hand movements, surrounded by green light.', requirements: { race: ['dryad', 'treant'] } },
    { id: 'pose_race_dry_bloom', label: '繁花盛放 (Floral Bloom)', category: '森心專屬', intensity: 0.8, hand: 'opening heart', props: 'blooming flowers', symmetry: 'vibrant', template: 'standing in a burst of flowers that grow instantly from the hair and skin, vibrant aura.', requirements: { race: ['dryad', 'treant'] } },
    { id: 'pose_race_dry_guard', label: '古樹守護 (Ancient Protector)', category: '森心專屬', intensity: 0.7, hand: 'merging with wood', props: 'giant oak', symmetry: 'protective', template: 'half-merged with a massive ancient tree, looking out with bark-like skin and green eyes.', requirements: { race: ['dryad', 'treant'] } },
    { id: 'pose_race_dry_wither', label: '凋零之秋 (Autumn Wither)', category: '森心專屬', intensity: 0.5, hand: 'falling leaves', props: 'orange sunset', symmetry: 'sad', template: 'sitting sadly as leaves fall from the body, skin turning cracked and brown like dry wood.', requirements: { race: ['dryad', 'treant'] } },

    // --- 惡魔專屬 (Demon/Devil) ---
    { id: 'pose_race_dem_throne', label: '硫磺寶座 (Brimstone Throne)', category: '淵罪專屬', intensity: 0.5, hand: 'leaning on fist', props: 'skulls/obsidian', symmetry: 'regal', template: 'sitting on a throne of cooling lava and obsidian, massive leathery wings folded behind.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },
    { id: 'pose_race_dem_hellfire', label: '獄火掌控 (Hellfire Command)', category: '淵罪專屬', intensity: 0.9, hand: 'erupting flames', props: 'crimson fire', symmetry: 'destructive', template: 'lifting both hands as red hellfire erupts from cracks in the ground, cinematic shadows.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },
    { id: 'pose_race_dem_contract', label: '靈魂契約 (Soul Contract)', category: '淵罪專屬', intensity: 0.6, hand: 'offering scroll', props: 'burning parchment', symmetry: 'tempting', template: 'offering a blackened parchment that glows with ominous purple runes, a wicked smile.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },
    { id: 'pose_race_dem_unfurl', label: '翼展遮天 (Wing Unfurl)', category: '淵罪專屬', intensity: 0.8, hand: 'arms wide', props: 'stormy sky', symmetry: 'monumental', template: 'standing on a peak, fully unfurling massive bat-like wings that create a silhouette against the moon.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },
    { id: 'pose_race_dem_tail', label: '尾刺突襲 (Tail Lash)', category: '淵罪專屬', intensity: 0.7, hand: 'claws out', props: 'pointed tail', symmetry: 'agile', template: 'leaning forward with a slender pointed tail curving overhead like a scorpion, ready to strike.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },

    // --- 兔耳族專屬 (Lagomorph) ---
    { id: 'pose_race_lag_ear', label: '長耳警覺 (Ear Alert)', category: '靈動專屬', intensity: 0.3, hand: 'shading eyes', props: 'tall grass', symmetry: 'asymmetric', template: 'standing in a field with long ears twitching, one hand shading eyes while looking at the horizon.', requirements: { race: ['lagomorph'] } },
    { id: 'pose_race_lag_leap', label: '月下奔躍 (Moon Shadow Leap)', category: '靈動專屬', intensity: 0.9, hand: 'tucked legs', props: 'huge moon', symmetry: 'curved', template: 'high leap across the sky, silhouetted against a massive moon, legs tucked for a perfect jump.', requirements: { race: ['lagomorph'] } },
    { id: 'pose_race_lag_burrow', label: '巢穴安居 (Burrow Comfort)', category: '靈動專屬', intensity: 0.4, hand: 'hugging clover', props: 'soft burrow', symmetry: 'piled', template: 'curled up in a cozy underground burrow filled with soft moss and glowing mushrooms.', requirements: { race: ['lagomorph'] } },
    { id: 'pose_race_lag_kick', label: '足技重攻 (Powerful Kick)', category: '靈動專屬', intensity: 0.8, hand: 'handstand', props: 'impact blur', symmetry: 'dynamic vertical', template: 'doing a handstand and delivering a powerful kick with large rabbit-like feet, impact dust.', requirements: { race: ['lagomorph'] } },
    { id: 'pose_race_lag_herb', label: '本草採擷 (Herb Gathering)', category: '靈動專屬', intensity: 0.5, hand: 'holding basket', props: 'magical carrots', symmetry: 'casual', template: 'happily picking glowing blue root vegetables in a fantasy garden, ears floppy.', requirements: { race: ['lagomorph'] } },

    // --- 鳳凰人專屬 (Phoenix) ---
    { id: 'pose_race_pho_rebirth', label: '涅槃浴火 (Born from Ash)', category: '神祉專屬', intensity: 1.0, hand: 'rising up', props: 'burning embers', symmetry: 'ascendant', template: 'rising from a pile of golden ash, hands transforming from fire into skin, majestic fire wings.', requirements: { race: ['phoenix_girl'] } },
    { id: 'pose_race_pho_fanning', label: '流火扇舞 (Fire Fan Dance)', category: '神祉專屬', intensity: 0.7, hand: 'fanning wings', props: 'smoke rings', symmetry: 'graceful', template: 'swaying gracefully while fanning out vibrant orange and gold feathered wings, leaving trails.', requirements: { race: ['phoenix_girl'] } },
    { id: 'pose_race_pho_sun', label: '擁抱烈日 (Sun Embrace)', category: '神祉專屬', intensity: 0.9, hand: 'reaching up', props: 'solar flare', symmetry: 'radiant', template: 'reaching towards the sun, the body becoming almost transparent and glowing like a star.', requirements: { race: ['phoenix_girl'] } },
    { id: 'pose_race_pho_feather', label: '灰燼之羽 (Ash Feather)', category: '神祉專屬', intensity: 0.4, hand: 'cradling feather', props: 'glowing plume', symmetry: 'delicate', template: 'looking sadly at a single glowing feather as it slowly turns into ash in the palm.', requirements: { race: ['phoenix_girl'] } },
    { id: 'pose_race_pho_perch', label: '神木棲息 (Divine Perch)', category: '神祉專屬', intensity: 0.6, hand: 'gripping branch', props: 'gold-leaf tree', symmetry: 'contemplative', template: 'perched high on a legendary golden tree, wings folded like a cloak of fire.', requirements: { race: ['phoenix_girl'] } },

    // --- 史芬克斯專屬 (Sphinx) ---
    { id: 'pose_race_sph_riddle', label: '古老謎語 (Ancient Riddle)', category: '神祉專屬', intensity: 0.4, hand: 'gesturing wait', props: 'sand dunes', symmetry: 'mystical', template: 'lying in a Sphinx pose on the sand, human head tilted with a knowing, enigmatic look.', requirements: { race: ['sphinx'] } },
    { id: 'pose_race_sph_guardian', label: '神殿守望 (Temple Guard)', category: '神祉專屬', intensity: 0.7, hand: 'claws on stone', props: 'pyramid entrance', symmetry: 'statuesque', template: 'standing firm at a stone gate, massive lion paws and feathered wings creating a wall.', requirements: { race: ['sphinx'] } },
    { id: 'pose_race_sph_dust', label: '塵沙之翼 (Dust Wings)', category: '神祉專屬', intensity: 0.8, hand: 'flapping wings', props: 'sandstorm', symmetry: 'massive', template: 'beating huge wings to create a localized sandstorm, gold ornaments shining through the dust.', requirements: { race: ['sphinx'] } },
    { id: 'pose_race_sph_scroll', label: '智慧卷軸 (Wisdom Scroll)', category: '神祉專屬', intensity: 0.5, hand: 'reading', props: 'papyrus scroll', symmetry: 'academic', template: 'sitting on lion haunches, using human hands to read a giant ancient papyrus scroll.', requirements: { race: ['sphinx'] } },
    { id: 'pose_race_sph_roar', label: '獅之怒吼 (Lion\'s Roar)', category: '神祉專屬', intensity: 0.9, hand: 'rearing up', props: 'cracked stone', symmetry: 'powerful', template: 'lion body rearing up, human face letting out a sound that shakes the desert, epic lighting.', requirements: { race: ['sphinx'] } },

    // --- 水中精靈專屬 (Undine/Water Spirit) ---
    { id: 'pose_race_und_flow', label: '水流化身 (Liquid Flow)', category: '水靈專屬', intensity: 0.6, hand: 'becoming water', props: 'fountain', symmetry: 'fluid', template: 'merging into a waterfall, body becoming translucent and indistinguishable from moving water.', requirements: { race: ['undine'] } },
    { id: 'pose_race_und_bubble', label: '水泡沉眠 (Bubble Sleep)', category: '水靈專屬', intensity: 0.3, hand: 'curled up', props: 'large bubble', symmetry: 'circular', template: 'sleeping inside a massive floating water bubble, hair swirling like liquid silk.', requirements: { race: ['undine'] } },
    { id: 'pose_race_und_surge', label: '巨浪奔騰 (Wave Surge)', category: '水靈專屬', intensity: 0.9, hand: 'guiding wave', props: 'tsunami', symmetry: 'colossal', template: 'riding at the crest of a massive wave, directing the water with graceful, fluid arm movements.', requirements: { race: ['undine'] } },
    { id: 'pose_race_und_mist', label: '晨霧漫步 (Morning Mist)', category: '水靈專屬', intensity: 0.4, hand: 'trailing mist', props: 'lake surface', symmetry: 'ethereal', template: 'walking on the surface of a lake, the body dissolving into white mist at the edges.', requirements: { race: ['undine'] } },
    { id: 'pose_race_und_drop', label: '純淨水珠 (Purest Drop)', category: '水靈專屬', intensity: 0.5, hand: 'cradling drop', props: 'glowing water', symmetry: 'delicate', template: 'holding a sphere of pure water that contains a tiny, living ecosystem.', requirements: { race: ['undine'] } },

    // --- 幻法加強 (Advanced Magic) ---

    // --- 吸血鬼專屬 (Vampire) ---
    { id: 'pose_race_vam_feast', label: '鮮血盛宴 (Blood Feast)', category: '吸血鬼專屬', intensity: 0.8, hand: 'holding goblet', props: 'blood red wine', symmetry: 'decadent', template: 'swirling a glass of thick red liquid in a gothic ballroom, eyes reflecting the moon.', requirements: { race: ['vampire', 'vampire_male'] } },
    { id: 'pose_race_vam_descent', label: '暗夜降臨 (Nightfall Descent)', category: '吸血鬼專屬', intensity: 0.7, hand: 'gliding', props: 'billowing cape', symmetry: 'gothic', template: 'stepping off a high balcony, a massive black cape fluttering like bat wings behind.', requirements: { race: ['vampire', 'vampire_male'] } },
    { id: 'pose_race_vam_bat', label: '蝙蝠化身 (Bat Embodiment)', category: '吸血鬼專屬', intensity: 0.6, hand: 'dissolving', props: 'swarm of bats', symmetry: 'mystical', template: 'half of the body dissolving into a cloud of tiny black bats near an ancient castle.', requirements: { race: ['vampire', 'vampire_male'] } },
    { id: 'pose_race_vam_etiquette', label: '優雅禮儀 (Elegant Etiquette)', category: '吸血鬼專屬', intensity: 0.4, hand: 'adjusting collar', props: 'victorian suit', symmetry: 'refined', template: 'standing before a tall mirror, adjusting a crimson cravat with long pale fingers.', requirements: { race: ['vampire', 'vampire_male'] } },
    { id: 'pose_race_vam_ash', label: '破曉灰燼 (Dawning Ash)', category: '吸血鬼專屬', intensity: 0.9, hand: 'covering face', props: 'first sunlight', symmetry: 'tragic', template: 'one hand blocking a ray of morning light, skin beginning to smoke and glow slightly.', requirements: { race: ['vampire', 'vampire_male'] } },

    // --- 狼人專屬 (Werewolf) ---
    { id: 'pose_race_wer_trans', label: '月下變身 (Moonlight Transformation)', category: '狼人專屬', intensity: 1.0, hand: 'clawing ground', props: 'shattered floor', symmetry: 'violent', template: 'mid-transformation, back arched, muscles bulging, clothes tearing under the moon.', requirements: { race: ['werewolf'] } },
    { id: 'pose_race_wer_tear', label: '撕裂大地 (Tear the Earth)', category: '狼人專屬', intensity: 0.8, hand: 'slamming paws', props: 'dirt/stones', symmetry: 'brutal', template: 'lunging forward, paws slamming into the forest floor, leaving deep gouges in soil.', requirements: { race: ['werewolf'] } },
    { id: 'pose_race_wer_howl', label: '狼首仰天 (Wolf Head Howl)', category: '狼人專屬', intensity: 0.9, hand: 'reaching for moon', props: 'shining moon', symmetry: 'primal', template: 'leaning head back in a full howl, breath visible in the cold night air.', requirements: { race: ['werewolf'] } },
    { id: 'pose_race_wer_sprint', label: '原野狂奔 (Wildland Sprint)', category: '狼人專屬', intensity: 0.7, hand: 'four-legged run', props: 'blurred trees', symmetry: 'dynamic', template: 'running on all fours with incredible speed through a dark, foggy forest.', requirements: { race: ['werewolf'] } },
    { id: 'pose_race_wer_watch', label: '爪痕守望 (Clawmark Watch)', category: '狼人專屬', intensity: 0.4, hand: 'holding tree', props: 'clawed bark', symmetry: 'protective', template: 'leaning against a tree marked with territory claws, looking guardedly around.', requirements: { race: ['werewolf'] } },

    // --- 女武神專屬 (Valkyrie) ---
    { id: 'pose_race_val_spear', label: '英靈長槍 (Einherjar Spear)', category: '戰神專屬', intensity: 0.8, hand: 'thrusting spear', props: 'winged spear', symmetry: 'dynamic', template: 'mid-thrust with a golden spear, white wings creating a powerful gust of wind.', requirements: { race: ['valkyrie'] } },
    { id: 'pose_race_val_shield', label: '聖盾守護 (Holy Shield)', category: '戰神專屬', intensity: 0.6, hand: 'holding shield', props: 'valkyrie shield', symmetry: 'defensive', template: 'crouched behind a large silver shield, wings wrapped forward for extra protection.', requirements: { race: ['valkyrie'] } },
    { id: 'pose_race_val_flight', label: '極光翱翔 (Aurora Flight)', category: '戰神專屬', intensity: 0.7, hand: 'trailing light', props: 'aurora borealis', symmetry: 'majestic', template: 'flying through a vibrant aurora sky, leaving a trail of sparkling light behind.', requirements: { race: ['valkyrie'] } },
    { id: 'pose_race_val_judgment', label: '戰場裁決 (Battle Judgment)', category: '戰神專屬', intensity: 0.5, hand: 'pointing sword', props: 'fallen warriors', symmetry: 'regal', template: 'standing amidst a battlefield, pointing a glowing sword at a worthy soul.', requirements: { race: ['valkyrie'] } },
    { id: 'pose_race_val_shrine', label: '瓦爾哈拉之門 (Gates of Valhalla)', category: '戰神專屬', intensity: 0.4, hand: 'opening gate', props: 'golden light', symmetry: 'divine', template: 'reaching towards a massive golden portal in the clouds, light bathing the face.', requirements: { race: ['valkyrie'] } },

    // --- 獸耳族專屬 (Beastkin Cat) ---
    { id: 'pose_race_bcat_jump', label: '靈動躍遷 (Cat-like Leap)', category: '獸領專屬', intensity: 0.7, hand: 'landing silent', props: 'rooftops', symmetry: 'acrobatic', template: 'landing silently on a narrow rooftop edge, tail balancing the body.', requirements: { race: ['beastkin_cat'] } },
    { id: 'pose_race_bcat_pounce', label: '野性撲擊 (Feral Pounce)', category: '獸領專屬', intensity: 0.9, hand: 'extended claws', props: 'prey shadow', symmetry: 'aggressive', template: 'mid-air pounce with hands claws-out, ears flattened for aerodynamics.', requirements: { race: ['beastkin_cat'] } },
    { id: 'pose_race_bcat_stretch', label: '日光拉伸 (Sunlight Stretch)', category: '獸領專屬', intensity: 0.3, hand: 'reaching up', props: 'window sill', symmetry: 'relaxed', template: 'stretching arms high above the head, arching the back in a sun-drenched room.', requirements: { race: ['beastkin_cat'] } },
    { id: 'pose_race_bcat_ear', label: '聆聽自然 (Listening to Nature)', category: '獸領專屬', intensity: 0.4, hand: 'hand near ear', props: 'whispering wind', symmetry: 'sensory', template: 'head tilted, ears twitching to pick up sounds humans can\'t hear.', requirements: { race: ['beastkin_cat'] } },
    { id: 'pose_race_bcat_tail', label: '尾外挑逗 (Tail Teasing)', category: '獸領專屬', intensity: 0.5, hand: 'twirling hair', props: 'moving tail', symmetry: 'charming', template: 'sitting with legs crossed, using the tail to playfully tap the shoulder.', requirements: { race: ['beastkin_cat'] } },

    // --- 狐狸精專屬 (Kitsune) ---
    { id: 'pose_race_kit_fire', label: '狐火操控 (Foxfire Control)', category: '靈狐專屬', intensity: 0.6, hand: 'holding orbs', props: 'blue foxfire', symmetry: 'mystical', template: 'multiple blue magical flames floating around the palms and tails.', requirements: { race: ['kitsune'] } },
    { id: 'pose_race_kit_tails', label: '九尾全開 (Nine Tails Bloom)', category: '靈狐專屬', intensity: 0.9, hand: 'standing center', props: 'fluffy golden tails', symmetry: 'radial', template: 'standing tall as nine massive fox tails fan out like a flower behind.', requirements: { race: ['kitsune'] } },
    { id: 'pose_race_kit_dance', label: '春祭之舞 (Spring Festival)', category: '靈狐專屬', intensity: 0.5, hand: 'holding fan', props: 'cherry blossoms', symmetry: 'oriental', template: 'performing a slow ritual dance with a silk fan, petals falling all around.', requirements: { race: ['kitsune'] } },
    { id: 'pose_race_kit_mask', label: '半面狐面 (Half-Mask Reveal)', category: '靈狐專屬', intensity: 0.4, hand: 'holding mask', props: 'kitsune mask', symmetry: 'mysterious', template: 'holding a traditional white fox mask slightly away from one eye, smirking.', requirements: { race: ['kitsune'] } },
    { id: 'pose_race_kit_shrine', label: '鳥居幽會 (Torii Gate Gate)', category: '靈狐專屬', intensity: 0.3, hand: 'leaning on wood', props: 'red torii gate', symmetry: 'thematic', template: 'leaning against a red torii gate in a misty mountain path, tail glowing.', requirements: { race: ['kitsune'] } },

    // --- 蜥蜴人專屬 (Lizardfolk) ---
    { id: 'pose_race_liz_crawl', label: '低位爬行 (Low Crawl)', category: '蜥蜴專屬', intensity: 0.6, hand: 'claws on mud', props: 'swamp vines', symmetry: 'stealthy', template: 'belly close to the ground, tail trailing behind, moving through thick mud.', requirements: { race: ['lizardfolk'] } },
    { id: 'pose_race_liz_sun', label: '岩石日光 (Sun Basking)', category: '蜥蜴專屬', intensity: 0.2, hand: 'laid out', props: 'hot desert rock', symmetry: 'still', template: 'lying flat on a sun-warmed rock, eyes closed, body absorbing the heat.', requirements: { race: ['lizardfolk'] } },
    { id: 'pose_race_liz_tongue', label: '氣味捕捉 (Scent Catch)', category: '蜥蜴專屬', intensity: 0.5, hand: 'stillness', props: 'misty jungle', symmetry: 'sensory', template: 'standing perfectly still, flicking the tongue out to sample the air.', requirements: { race: ['lizardfolk'] } },
    { id: 'pose_race_liz_spear', label: '獵魚標槍 (Fish Spear)', category: '蜥蜴專屬', intensity: 0.7, hand: 'holding harpoon', props: 'river reeds', symmetry: 'precise', template: 'standing in a river, spear poised over the water, ready to strike.', requirements: { race: ['lizardfolk'] } },
    { id: 'pose_race_liz_hiss', label: '鼓喉威嚇 (Throat Snarl)', category: '蜥蜴專屬', intensity: 0.8, hand: 'claws raised', props: 'bone necklace', symmetry: 'intimidating', template: 'throat puffed out, mouth open to reveal sharp teeth, low crouch.', requirements: { race: ['lizardfolk'] } },

    // --- 美杜莎專屬 (Medusa) ---
    { id: 'pose_race_med_gaze', label: '石化凝視 (Petrifying Gaze)', category: '蛇髮專屬', intensity: 1.0, hand: 'pulling mask', props: 'shattered stone statue', symmetry: 'fatal', template: 'lowering a veil or mask to reveal eyes that glow with a deadly petrifying light.', requirements: { race: ['medusa'] } },
    { id: 'pose_race_med_serpent', label: '蛇髮纏繞 (Serpent Hair Entwine)', category: '蛇髮專屬', intensity: 0.7, hand: 'touching hair', props: 'writhing snakes', symmetry: 'eerie', template: 'running fingers through hair made of living, hissing snakes, eyes reflecting venom.', requirements: { race: ['medusa'] } },
    { id: 'pose_race_med_coil', label: '陰影盤伏 (Shadow Slither)', category: '蛇髮專屬', intensity: 0.6, hand: 'crawling', props: 'underground cave', symmetry: 'low', template: 'moving low to the ground, snake-hair reaching out like sensory organs in the dark.', requirements: { race: ['medusa'] } },
    { id: 'pose_race_med_scorn', label: '石之冷笑 (Stone Cold Smirk)', category: '蛇髮專屬', intensity: 0.5, hand: 'hand on chin', props: 'marble garden', symmetry: 'aristocratic', template: 'leaning against a statue that was once a hero, looking with cruel amusement.', requirements: { race: ['medusa'] } },
    { id: 'pose_race_med_venom', label: '毒液淬鍊 (Venom Temper)', category: '蛇髮專屬', intensity: 0.8, hand: 'dripping fangs', props: 'bronze bow', symmetry: 'lethal', template: 'allowing one of the hair-snakes to bite the tip of an arrow, coating it in poison.', requirements: { race: ['medusa'] } },

    // --- 哈比專屬 (Harpy) ---
    { id: 'pose_race_har_dive', label: '高空俯衝 (Sky Dive)', category: '鳥妖專屬', intensity: 1.0, hand: 'claws extended', props: 'mountain peaks', symmetry: 'aerodynamic', template: 'diving vertically from the clouds with wings tucked, claws ready to snatch.', requirements: { race: ['harpy'] } },
    { id: 'pose_race_har_perch', label: '懸崖守望 (Cliff Perch)', category: '鳥妖專屬', intensity: 0.4, hand: 'gripping rock', props: 'nest with eggs', symmetry: 'vigilant', template: 'squatting on a narrow rock ledge, massive wings folded tightly against the back.', requirements: { race: ['harpy'] } },
    { id: 'pose_race_har_preen', label: '羽翼梳理 (Feather Preening)', category: '鳥妖專屬', intensity: 0.3, hand: 'cleaning wings', props: 'shed feathers', symmetry: 'relaxed', template: 'using fingers or mouth to carefully groom the large feathers of the arm-wings.', requirements: { race: ['harpy'] } },
    { id: 'pose_race_har_gust', label: '颶風拍擊 (Gale Flap)', category: '鳥妖專屬', intensity: 0.8, hand: 'beating wings', props: 'flying debris', symmetry: 'forceful', template: 'flapping wings powerfully to create a blast of wind that pushes everything back.', requirements: { race: ['harpy'] } },
    { id: 'pose_race_har_soar', label: '氣旋迴旋 (Thermal Soar)', category: '鳥妖專屬', intensity: 0.5, hand: 'arms wide', props: 'sunset clouds', symmetry: 'graceful', template: 'gliding effortlessly on warm air currents, feathers glowing in the golden light.', requirements: { race: ['harpy'] } },

    // --- 不死族專屬 (Undead/Skeleton/Lich) ---
    { id: 'pose_race_und_throne', label: '枯骨王座 (Reliquary Throne)', category: '不死專屬', intensity: 0.5, hand: 'hand on skull', props: 'throne of bone', symmetry: 'static', template: 'sitting regally on a throne made of thousands of bones, eyes glowing with soulfire.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },
    { id: 'pose_race_und_raise', label: '死靈喚醒 (Undead Raise)', category: '不死專屬', intensity: 1.0, hand: 'reaching ground', props: 'claws from earth', symmetry: 'powerful', template: 'raising both hands as skeletal fingers burst from the ground all around.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },
    { id: 'pose_race_und_phyl', label: '命匣守護 (Phylactery Guard)', category: '不死專屬', intensity: 0.7, hand: 'clasping gem', props: 'unholy phylactery', symmetry: 'obsessive', template: 'holding a glowing unholy gem close to the chest, shadows swirling around it.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },
    { id: 'pose_race_und_lev', label: '死亡懸浮 (Deathly Float)', category: '不死專屬', intensity: 0.6, hand: 'limp arms', props: 'ethereal mist', symmetry: 'eerie', template: 'floating inches above the ground, ragged robes fluttering in an unnatural wind.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },
    { id: 'pose_race_und_staff', label: '凋零之杖 (Wither Staff)', category: '不死專屬', intensity: 0.8, hand: 'holding staff', props: 'soul reaper staff', symmetry: 'menacing', template: 'pointing a staff topped with a skull, a beam of soul-draining energy firing out.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },

    // --- 幽靈專屬 (Ghost) ---
    { id: 'pose_race_gho_phase', label: '虛化穿牆 (Ethereal Phase)', category: '幽魂專屬', intensity: 0.6, hand: 'half-gone', props: 'stone wall', symmetry: 'transparent', template: 'half of the body passing through a solid wall, glowing with a soft blue light.', requirements: { race: ['ghost'] } },
    { id: 'pose_race_gho_haunt', label: '迴廊幽影 (Corridor Haunt)', category: '幽魂專屬', intensity: 0.5, hand: 'reaching out', props: 'old mansion', symmetry: 'spooky', template: 'gliding through a dark hallway, features blurred and shifting like smoke.', requirements: { race: ['ghost'] } },
    { id: 'pose_race_gho_posses', label: '靈魂附身 (Soul Possession)', category: '幽魂專屬', intensity: 0.9, hand: 'grabbing head', props: 'struggling shadow', symmetry: 'violent', template: 'diving into the shadow of another, eyes glowing with a malevolent light.', requirements: { race: ['ghost'] } },
    { id: 'pose_race_gho_view', label: '鏡中世界 (Mirror View)', category: '幽魂專屬', intensity: 0.4, hand: 'touching glass', props: 'cracked mirror', symmetry: 'reflective', template: 'looking out from inside a mirror, the reflection being much darker than reality.', requirements: { race: ['ghost'] } },
    { id: 'pose_race_gho_scream', label: '怨靈哀嚎 (Banshee Wail)', category: '幽魂專屬', intensity: 1.0, hand: 'clasping ears', props: 'shattered glass', symmetry: 'destructive', template: 'head back, jaw wide in a silent scream that causes everything around to vibrate.', requirements: { race: ['ghost'] } },

    // --- 幻法加強 (Advanced Magic) ---
];

export const FANTASY_EXPRESSIONS_V4: FantasyExpressionV8[] = [
    // Ranger
    { id: 'expr_ran_solitude', label: '荒野孤寂 (Wilderness Solitude)', category: '遊俠專屬', intensity: 0.3, cues: 'distant, melancholic eyes, looking at a far-off horizon.', requirements: { job: ['ranger', 'druid'] } },
    { id: 'expr_ran_alert', label: '獵人警覺 (Hunter Alertness)', category: '遊俠專屬', intensity: 0.6, cues: 'eyes darting, pupils narrowed, sharp focused perception.', requirements: { job: ['ranger', 'assassin'] } },
    { id: 'expr_ran_affinity', label: '自然親和 (Nature Affinity)', category: '遊俠專屬', intensity: 0.5, cues: 'gentle smile while looking at a small animal, soft eyes.', requirements: { job: ['ranger', 'shrine_maiden'] } },
    { id: 'expr_ran_zeal', label: '追蹤狂熱 (Tracking Zeal)', category: '遊俠專屬', intensity: 0.8, cues: 'intense focus on the trail, beads of sweat, gritted teeth.', requirements: { job: ['ranger', 'bounty_hunter'] } },
    { id: 'expr_ran_mirage', label: '密林假象 (Forest Mirage)', category: '遊俠專屬', intensity: 0.4, cues: 'unreadable expression, eyes blending with forest shadows.', requirements: { job: ['ranger', 'ninja'] } },

    // Warrior
    { id: 'expr_war_berserker', label: '狂暴之血 (Berserker Blood)', category: '戰士專屬', intensity: 0.9, cues: 'veins on temple, bloodshot eyes, intense primal rage.', requirements: { job: ['swordsman', 'berserker'] } },
    { id: 'expr_war_honor', label: '戰士榮耀 (Warrior Pride)', category: '戰士專屬', intensity: 0.4, cues: 'stern, dignified, and scarred features, a look of duty.', requirements: { job: ['swordsman', 'knight'] } },
    { id: 'expr_war_endurance', label: '痛楚忍耐 (Enduring Pain)', category: '戰士專屬', intensity: 0.7, cues: 'gritting teeth, one eye shut, face contorted in pain.', requirements: { job: ['swordsman', 'paladin'] } },
    { id: 'expr_war_commander', label: '領袖氣概 (Commander Aura)', category: '戰士專屬', intensity: 0.6, cues: 'authoritative and steady gaze, commanding presence.', requirements: { job: ['swordsman', 'pirate_captain'] } },
    { id: 'expr_war_aftermath', label: '餘火餘生 (Aftermath Embers)', category: '戰士專屬', intensity: 0.5, cues: 'looking at a battle-scarred sky with a somber look.', requirements: { job: ['swordsman', 'samurai'] } },

    // Samurai
    { id: 'expr_sam_resolve', label: '極道堅定 (Sword-Way Resolve)', category: '武士專屬', intensity: 0.3, cues: 'immovable and cold precision, sharp steady eyes.', requirements: { job: ['samurai', 'swordsman'] } },
    { id: 'expr_sam_stillness', label: '禪意平靜 (Zen Stillness)', category: '武士專屬', intensity: 0.2, cues: 'nothingness in the eyes, absolute mental vacuum.', requirements: { job: ['samurai', 'monk'] } },
    { id: 'expr_sam_burden', label: '名譽負擔 (Burden of Honor)', category: '武士專屬', intensity: 0.5, cues: 'somber and heavy look, weight of tradition on features.', requirements: { job: ['samurai', 'knight'] } },
    { id: 'expr_sam_intent', label: '決鬥殺氣 (Duelist Intent)', category: '武士專屬', intensity: 0.8, cues: 'sharp focus on the opponent\'s hands, killing intent.', requirements: { job: ['samurai', 'ninja'] } },
    { id: 'expr_sam_aloof', label: '浪人孤傲 (Ronin Aloofness)', category: '武士專屬', intensity: 0.4, cues: 'cynical smirk, unbothered by worldly concerns.', requirements: { job: ['samurai', 'bounty_hunter'] } },

    // Monk
    { id: 'expr_mon_compassion', label: '內生慈悲 (Inner Compassion)', category: '武鬥家專屬', intensity: 0.4, cues: 'looking at the world with pity and love, soft eyes.', requirements: { job: ['monk', 'cleric'] } },
    { id: 'expr_mon_surge', label: '氣力爆發 (Ki Surge)', category: '武鬥家專屬', intensity: 0.9, cues: 'eyes glowing with internal blue power, skin vibrating.', requirements: { job: ['monk', 'elementalist'] } },
    { id: 'expr_mon_ascetic', label: '苦修意志 (Ascetic Will)', category: '武鬥家專屬', intensity: 0.3, cues: 'weathered face, absolute mental and physical control.', requirements: { job: ['monk', 'druid'] } },
    { id: 'expr_mon_serenity', label: '靈魂平靜 (Spirit Peace)', category: '武鬥家專屬', intensity: 0.5, cues: 'serene and weightless expression, peaceful gaze.', requirements: { job: ['monk', 'cleric'] } },
    { id: 'expr_mon_zen', label: '戰鬥禪師 (Combat Zen)', category: '武鬥家專屬', intensity: 0.7, cues: 'moving with closed eyes, sensing everything through ki.', requirements: { job: ['monk', 'swordsman'] } },

    // Thief
    { id: 'expr_thi_surprise', label: '小偷驚喜 (Thief Surprise)', category: '盜賊專屬', intensity: 0.8, cues: 'eyes wide at finding a massive glowing gemstone.', requirements: { job: ['phantom_thief', 'bard'] } },
    { id: 'expr_thi_hooded', label: '黑暗融入 (Melting Shadows)', category: '盜賊專屬', intensity: 0.3, cues: 'looking back from a dark velvet hood, unreadable face.', requirements: { job: ['phantom_thief', 'assassin'] } },
    { id: 'expr_thi_cunning', label: '街頭狡黠 (Street Smart Smirk)', category: '盜賊專屬', intensity: 0.5, cues: 'winking with a knowing grin, street-wise look.', requirements: { job: ['phantom_thief', 'pirate_captain'] } },
    { id: 'expr_thi_panic', label: '被捕恐懼 (Caught in Act)', category: '盜賊專屬', intensity: 0.7, cues: 'panic-stricken eyes, heavy breath, sweat beads.', requirements: { job: ['phantom_thief', 'assassin'] } },
    { id: 'expr_thi_smug', label: '隱形自信 (Invisible Confidence)', category: '盜賊專屬', intensity: 0.4, cues: 'calm and smug confidence, looking through the crowd.', requirements: { job: ['phantom_thief', 'assassin'] } },

    // Bard
    { id: 'expr_bar_master', label: '絕世名演 (Master Performance)', category: '吟遊詩人專屬', intensity: 0.4, cues: 'blissful and dramatic closed eyes, complete immersion.', requirements: { job: ['bard', 'elementalist'] } },
    { id: 'expr_bar_taunt', label: '嘲諷毒舌 (Taunting Mockery)', category: '吟遊詩人專屬', intensity: 0.6, cues: 'sticking tongue out slightly, mocking grin, playful eyes.', requirements: { job: ['bard', 'phantom_thief'] } },
    { id: 'expr_bar_pining', label: '藝術憂鬱 (Artistic Melancholy)', category: '吟遊詩人專屬', intensity: 0.4, cues: 'pining for a lost muse, sad distant look.', requirements: { job: ['bard', 'druid'] } },
    { id: 'expr_bar_storyteller', label: '傳奇傳頌 (Legendary Tale)', category: '吟遊詩人專屬', intensity: 0.5, cues: 'wide-eyed and animated, telling a tall tale.', requirements: { job: ['bard', 'cleric'] } },
    { id: 'expr_bar_merry', label: '節慶狂歡 (Festival Heart)', category: '吟遊詩人專屬', intensity: 0.8, cues: 'sparkling eyes and flushed cheeks, joy and energy.', requirements: { job: ['bard', 'cleric'] } },

    // Necromancer
    { id: 'expr_nec_decay', label: '凋零喜悅 (Decay Joy)', category: '死靈法師專屬', intensity: 0.8, cues: 'pale sinister smile amidst rotting things, ghoulish focus.', requirements: { job: ['necromancer', 'necromancer'] } },
    { id: 'expr_nec_master', label: '冷酷主宰 (Cold Overlord)', category: '死靈法師專屬', intensity: 0.5, cues: 'looking down with a neutral but powerful authority.', requirements: { job: ['necromancer', 'knight'] } },
    { id: 'expr_nec_mortality', label: '靈魂碎片 (Soul Fragility)', category: '死靈法師專屬', intensity: 0.4, cues: 'seeing the mortality of all living things, haunted eyes.', requirements: { job: ['necromancer', 'cleric'] } },
    { id: 'expr_nec_meditations', label: '墓園冥想 (Grave Meditations)', category: '死靈法師專屬', intensity: 0.3, cues: 'talking to the dead with a neutral, calm face.', requirements: { job: ['necromancer', 'necromancer'] } },
    { id: 'expr_nec_void', label: '暗影沉淪 (Drowning Shadows)', category: '死靈法師專屬', intensity: 0.9, cues: 'eyes becoming totally black, losing humanity.', requirements: { job: ['necromancer', 'assassin'] } },
    // Ninja
    { id: 'expr_nin_calm', label: '極限冷靜 (Ultimate Calm)', category: '忍者專屬', intensity: 0.2, cues: 'absolutely no visible emotion, eyes like cold deep wells, unblinking.', requirements: { job: ['assassin', 'assassin'] } },
    { id: 'expr_nin_insight', label: '忍者秘奧意 (Shinobi Insight)', category: '忍者專屬', intensity: 0.8, cues: 'one eye glowing with a sharp red or violet pattern, intense look.', requirements: { job: ['assassin', 'cleric'] } },
    { id: 'expr_nin_numb', label: '疼痛麻木 (Numb to Pain)', category: '忍者專屬', intensity: 0.4, cues: 'looking at own wound with complete indifference, robotic endurance.', requirements: { job: ['assassin', 'swordsman'] } },
    { id: 'expr_nin_thrill', label: '暗殺快感 (Assassination Thrill)', category: '忍者專屬', intensity: 0.5, cues: 'subtle, creepy smile hidden behind a dark silk mask, narrowed eyes.', requirements: { job: ['assassin', 'phantom_thief'] } },
    { id: 'expr_nin_loyalty', label: '永恆忠誠 (Eternal Loyalty)', category: '忍者專屬', intensity: 0.3, cues: 'lower head slightly, looking with deep reverence and absolute duty.', requirements: { job: ['assassin', 'knight'] } },

    // Summoner
    { id: 'expr_sum_link', label: '感官連結 (Sensory Link)', category: '召喚師專屬', intensity: 0.7, cues: 'pupils changing to match the summon irises, strange glow.', requirements: { job: ['elementalist', 'druid'] } },
    { id: 'expr_sum_dominant', label: '主宰意志 (Dominant Will)', category: '召喚師專屬', intensity: 0.5, cues: 'stern and unyielding control, deep concentration.', requirements: { job: ['elementalist', 'knight'] } },
    { id: 'expr_sum_resonance', label: '靈魂共鳴 (Soul Resonance)', category: '召喚師專屬', intensity: 0.8, cues: 'glowing symbols on the forehead and cheeks, high energy.', requirements: { job: ['elementalist', 'cleric'] } },
    { id: 'expr_sum_awe', label: '狂喜驚嘆 (Ecstatic Awe)', category: '召喚師專屬', intensity: 0.9, cues: 'laughing at the magnificent creature summoned, wide eyes.', requirements: { job: ['elementalist', 'bard'] } },
    { id: 'expr_sum_beyond', label: '彼方思緒 (Beyond Thoughts)', category: '召喚師專屬', intensity: 0.3, cues: 'absent-minded and otherworldly look, looking past reality.', requirements: { job: ['elementalist', 'cleric'] } },

    // Bounty Hunter
    { id: 'expr_bou_cold', label: '職業冷酷 (Professional Cold)', category: '賞金獵人專屬', intensity: 0.3, cues: 'eyes hidden behind a visor or hat, unreadable and cold.', requirements: { job: ['assassin', 'assassin'] } },
    { id: 'expr_bou_scent', label: '獎金嗅覺 (Scent of Money)', category: '賞金獵人專屬', intensity: 0.6, cues: 'calculating squint, eyes focused on coin-filled pouch.', requirements: { job: ['assassin', 'phantom_thief'] } },
    { id: 'expr_bou_fatigue', label: '戰鬥疲勞 (Combat Fatigue)', category: '賞金獵人專屬', intensity: 0.4, cues: 'sighing with dirt on face, heavy eyes, signs of exhaustion.', requirements: { job: ['assassin', 'swordsman'] } },
    { id: 'expr_bou_obsession', label: '追捕執念 (Capture Obsession)', category: '賞金獵人專屬', intensity: 0.8, cues: 'gritted teeth, eyes locked on the target with no mercy.', requirements: { job: ['assassin', 'assassin'] } },
    { id: 'expr_bou_scorn', label: '戰利品蔑視 (Loot Scorn)', category: '賞金獵人專屬', intensity: 0.5, cues: 'smirking at a low-value bounty, arrogant and mocking.', requirements: { job: ['assassin', 'knight'] } },

    // Shrine Maiden
    { id: 'expr_shr_solemnity', label: '神性肅穆 (Divine Solemnity)', category: '巫女專屬', intensity: 0.3, cues: 'impenetrable purity and calm, looking through the soul.', requirements: { job: ['nun', 'cleric'] } },
    { id: 'expr_shr_cunning', label: '狐仙狡黠 (Kitsune Cunning)', category: '巫女專屬', intensity: 0.6, cues: 'narrowed, mysterious, and playful eyes, kitsune grin.', requirements: { job: ['nun', 'druid'] } },
    { id: 'expr_shr_resolve', label: '守護決心 (Protective Resolve)', category: '巫女專屬', intensity: 0.7, cues: 'tears in eyes but a very firm, brave jawline.', requirements: { job: ['nun', 'paladin'] } },
    { id: 'expr_shr_exorcism', label: '退魔威壓 (Exorcism Aura)', category: '巫女專屬', intensity: 0.9, cues: 'sharp, terrifying glare at evil, eyes like white fire.', requirements: { job: ['nun', 'knight'] } },
    { id: 'expr_shr_gentle', label: '櫻下溫柔 (Cherry Blossom Soft)', category: '巫女專屬', intensity: 0.4, cues: 'soft beautiful smile, feeling like a spring breeze.', requirements: { job: ['nun', 'cleric'] } },

    // Oracle
    { id: 'expr_ora_shock', label: '預見驚愕 (Prescience Shock)', category: '占卜師專屬', intensity: 0.8, cues: 'eyes wide at a terrible future vision, dilated pupils.', requirements: { job: ['cleric', 'necromancer'] } },
    { id: 'expr_ora_mockery', label: '命運嘲諷 (Fate Mockery)', category: '占卜師專屬', intensity: 0.5, cues: 'knowing, ironic smile at the foolishness of destiny.', requirements: { job: ['cleric', 'bard'] } },
    { id: 'expr_ora_idol', label: '空虛神像 (Empty Idol)', category: '占卜師專屬', intensity: 0.3, cues: 'looking through everything as if it\'s all just dust.', requirements: { job: ['cleric', 'mage'] } },
    { id: 'expr_ora_stardust', label: '星塵之眼 (Stardust Eyes)', category: '占卜師專屬', intensity: 0.7, cues: 'irises looking like spinning colorful galaxies.', requirements: { job: ['cleric', 'cleric'] } },
    { id: 'expr_ora_wisdom', label: '智慧沉重 (Weight of Wisdom)', category: '占卜師專屬', intensity: 0.4, cues: 'deeply tired and ancient expression, seeing all truths.', requirements: { job: ['cleric', 'mage'] } },

    // Vampire Hunter
    { id: 'expr_vam_dawn', label: '黎明期待 (Waiting for Dawn)', category: '吸血鬼獵人專屬', intensity: 0.4, cues: 'looking at horizon with hope, soft light on face.', requirements: { job: ['paladin', 'cleric'] } },
    { id: 'expr_vam_hatred', label: '獵魔仇恨 (Hunter Hatred)', category: '吸血鬼獵人專屬', intensity: 0.8, cues: 'intense focused rage, ready to strike, lethal look.', requirements: { job: ['paladin', 'berserker'] } },
    { id: 'expr_vam_watch', label: '孤獨守望 (Lonely Watch)', category: '吸血鬼獵人專屬', intensity: 0.3, cues: 'melancholy profile in the moonlight, sad duty.', requirements: { job: ['paladin', 'knight'] } },
    { id: 'expr_vam_vigilance', label: '血色警醒 (Crimson Vigilance)', category: '吸血鬼獵人專屬', intensity: 0.6, cues: 'wiping blood from the lip, sharp wary eyes.', requirements: { job: ['paladin', 'swordsman'] } },
    { id: 'expr_vam_baptism', label: '銀之洗禮 (Silver Baptism)', category: '吸血鬼獵人專屬', intensity: 0.5, cues: 'peaceful look after a successful holy hunt.', requirements: { job: ['paladin', 'paladin'] } },

    // Engineer
    { id: 'expr_eng_zeal', label: '文明狂熱 (Civilization Zeal)', category: '機械師專屬', intensity: 0.8, cues: 'manic excitement over a mechanical breakthrough.', requirements: { job: ['alchemist', 'alchemist'] } },
    { id: 'expr_eng_precision', label: '機械精準 (Mech Precision)', category: '機械師專屬', intensity: 0.4, cues: 'one eye squinting through a specialized brass lens.', requirements: { job: ['alchemist', 'cleric'] } },
    { id: 'expr_eng_grease', label: '油污之光 (Grease Smile)', category: '機械師專屬', intensity: 0.5, cues: 'smirking despite charcoal and grease mess on face.', requirements: { job: ['alchemist', 'phantom_thief'] } },
    { id: 'expr_eng_rhythm', label: '齒輪律動 (Rhythm of Gears)', category: '機械師專屬', intensity: 0.6, cues: 'looking at a running engine with pure adoration.', requirements: { job: ['alchemist', 'elementalist'] } },
    { id: 'expr_eng_surprise', label: '爆炸意外 (Explosive Surprise)', category: '機械師專屬', intensity: 0.9, cues: 'charred face, soot clouds, wide eyes, hair vertical.', requirements: { job: ['alchemist', 'bard'] } },

    // Wizard
    { id: 'expr_wiz_frenzy', label: '奧法狂擊 (Arcane Frenzy)', category: '法師專屬', intensity: 0.9, cues: 'crazed intensity in eyes, glowing irises, crackling magical energy reflected in gaze.', requirements: { job: ['mage', 'warlock'] } },
    { id: 'expr_wiz_scrutiny', label: '智識考究 (Intellectual Scrutiny)', category: '法師專屬', intensity: 0.3, cues: 'deep concentration, brow furrowed, eyes analyzing magical formulas.', requirements: { job: ['mage', 'alchemist'] } },
    { id: 'expr_wiz_erosion', label: '秘法侵蝕 (Arcane Corruption)', category: '法師專屬', intensity: 0.8, cues: 'look of painful ecstasy, veins glowing near eyes, mana overload.', requirements: { job: ['mage', 'necromancer'] } },
    { id: 'expr_wiz_wisdom', label: '平靜智慧 (Calm Wisdom)', category: '法師專屬', intensity: 0.2, cues: 'stoic and all-knowing, a look that has seen centuries.', requirements: { job: ['mage', 'cleric'] } },
    { id: 'expr_wiz_harmony', label: '元素共鳴 (Elemental Harmony)', category: '法師專屬', intensity: 0.5, cues: 'blissful connection, eyes changing color to match elements.', requirements: { job: ['mage', 'druid'] } },

    // Assassin
    { id: 'expr_asn_reaper', label: '冷漠死神 (Cold Reaper)', category: '刺客專屬', intensity: 0.7, cues: 'absolute void in the eyes, unblinking and predatory.', requirements: { job: ['assassin', 'assassin'] } },
    { id: 'expr_asn_smirk', label: '狡黠微笑 (Cunning Smirk)', category: '刺客專屬', intensity: 0.5, cues: 'narrowed eyes, knowing your enemy is already dead.', requirements: { job: ['assassin', 'phantom_thief'] } },
    { id: 'expr_asn_instinct', label: '獵殺本能 (Hunting Instinct)', category: '刺客專屬', intensity: 0.8, cues: 'sharp predator-like focus, pupils dilated.', requirements: { job: ['assassin', 'ranger'] } },
    { id: 'expr_asn_silence', label: '隱匿之息 (Silenced Breath)', category: '刺客專屬', intensity: 0.6, cues: 'holding breath, intense auditory focus, stillness.', requirements: { job: ['assassin', 'ninja'] } },
    { id: 'expr_asn_satisfaction', label: '黑暗愉悅 (Dark Satisfaction)', category: '刺客專屬', intensity: 0.4, cues: 'slight dark grin after a successful strike, bloodlust.', requirements: { job: ['assassin', 'warlock'] } },

    // Paladin
    { id: 'expr_pal_wrath', label: '正義之怒 (Righteous Wrath)', category: '聖騎士專屬', intensity: 0.9, cues: 'burning eyes of judgment, gritted teeth, righteous fury.', requirements: { job: ['paladin', 'swordsman'] } },
    { id: 'expr_pal_mercy', label: '聖光慈悲 (Holy Mercy)', category: '聖騎士專屬', intensity: 0.3, cues: 'look of pity and forgiveness, soft and warm features.', requirements: { job: ['paladin', 'cleric'] } },
    { id: 'expr_pal_resolve', label: '鋼鐵決心 (Iron Resolve)', category: '聖騎士專屬', intensity: 0.7, cues: 'unshakeable determination, forward-looking and brave.', requirements: { job: ['paladin', 'knight'] } },
    { id: 'expr_pal_shout', label: '英勇吶喊 (Heroic Shout)', intensity: 1.0, category: '聖騎士專屬', cues: 'wide open mouth in a powerful battle cry, veins visible.', requirements: { job: ['paladin', 'swordsman'] } },
    { id: 'expr_pal_martyr', label: '殉道之光 (Martyrdom Light)', category: '聖騎士專屬', intensity: 0.6, cues: 'serene face amidst chaos, selfless devotion.', requirements: { job: ['paladin', 'exorcist'] } },

    // Archer
    { id: 'expr_arc_lock', label: '鷹眼鎖定 (Hawk-Eye Lock)', category: '弓箭手專屬', intensity: 0.8, cues: 'narrowed eyes focused on a distant point, absolute mental quiet.', requirements: { job: ['archer', 'ranger'] } },
    { id: 'expr_arc_wind', label: '風中凌亂 (Wind-Swept Focus)', category: '弓箭手專屬', intensity: 0.5, cues: 'squinting against harsh winds, grit and perseverance.', requirements: { job: ['archer', 'pirate_captain'] } },
    { id: 'expr_arc_confidence', label: '輕盈自信 (Agile Confidence)', category: '弓箭手專屬', intensity: 0.4, cues: 'playful smirk, effortless grace under pressure.', requirements: { job: ['archer', 'phantom_thief'] } },
    { id: 'expr_arc_solitude', label: '荒野孤獨 (Wilderness Solitude)', category: '弓箭手專屬', intensity: 0.3, cues: 'look of an outlander, distant yet sharp eyes.', requirements: { job: ['archer', 'druid'] } },
    { id: 'expr_arc_immersion', label: '極限沉浸 (Peak Immersion)', category: '弓箭手專屬', intensity: 0.9, cues: 'beads of sweat, total immersion in the shot.', requirements: { job: ['archer'] } },

    // Priest
    { id: 'expr_pri_trance', label: '神聖迷醉 (Divine Trance)', category: '祭司專屬', intensity: 0.4, cues: 'eyes rolled back or closed, communicating with the divine.', requirements: { job: ['cleric', 'exorcist'] } },
    { id: 'expr_pri_pleading', label: '救贖祈願 (Redemption Prayer)', category: '祭司專屬', intensity: 0.5, cues: 'pleading but hopeful look, small tears of devotion.', requirements: { job: ['cleric'] } },
    { id: 'expr_pri_lament', label: '聖徒哀慟 (Saintly Lament)', category: '祭司專屬', intensity: 0.7, cues: 'pure sorrow for the suffering of others, somber features.', requirements: { job: ['cleric', 'necromancer'] } },
    { id: 'expr_pri_radiance', label: '光明讚頌 (Radiant Praise)', category: '祭司專屬', intensity: 0.6, cues: 'joyous look of divine connection, shining eyes.', requirements: { job: ['cleric', 'exorcist'] } },
    { id: 'expr_pri_vigil', label: '聖壇守候 (Altar Vigilance)', category: '祭司專屬', intensity: 0.3, cues: 'patient and unwavering gaze, waiting for a sign.', requirements: { job: ['cleric'] } },

    // Knight
    { id: 'expr_kni_grit', label: '戰鬥嘶吼 (Combat Roar)', category: '騎士專屬', intensity: 0.9, cues: 'traditional warrior grit, baring teeth in a shout.', requirements: { job: ['knight', 'swordsman'] } },
    { id: 'expr_kni_oath', label: '誓言守護 (Oathbound Guard)', category: '騎士專屬', intensity: 0.4, cues: 'serious and protective, a look of unyielding service.', requirements: { job: ['knight', 'paladin'] } },
    { id: 'expr_kni_exhaustion', label: '戰場餘生 (Battle Survival)', category: '騎士專屬', intensity: 0.6, cues: 'exhausted but prideful, dirt-stained face, heavy breath.', requirements: { job: ['knight', 'bounty_hunter'] } },
    { id: 'expr_kni_reflection', label: '榮耀反思 (Reflection on Honor)', category: '騎士專屬', intensity: 0.3, cues: 'somber look after victory, questioning the cost.', requirements: { job: ['knight', 'samurai'] } },
    { id: 'expr_kni_professional', label: '鋼鐵面紗 (Iron Veil)', category: '騎士專屬', intensity: 0.5, cues: 'cold and professional martial focus, eyes like steel.', requirements: { job: ['knight'] } },

    // Swordsman
    { id: 'expr_swd_clarity', label: '劍心通明 (Sword Heart Clarity)', category: '御劍士專屬', intensity: 0.2, cues: 'calm and sharp as a blade, absolute inner peace.', requirements: { job: ['swordsman', 'monk'] } },
    { id: 'expr_swd_wild', label: '狂氣劍豪 (Mad Swordmaster)', category: '御劍士專屬', intensity: 0.8, cues: 'wild hair, intense and slightly crazed grin, eyes sparking.', requirements: { job: ['swordsman', 'ninja'] } },
    { id: 'expr_swd_melancholy', label: '櫻下惆悵 (Petal Melancholy)', category: '御劍士專屬', intensity: 0.4, cues: 'gentle sadness, looking at falling cherry blossoms.', requirements: { job: ['swordsman', 'samurai'] } },
    { id: 'expr_swd_intent', label: '瞬獄殺意 (Instant Kill Intent)', category: '御劍士專屬', intensity: 1.0, cues: 'sharp contraction of pupils, predatory focus just before a strike.', requirements: { job: ['swordsman', 'assassin'] } },
    { id: 'expr_swd_focus', label: '極致專注 (Peak Concentration)', category: '御劍士專屬', intensity: 0.7, cues: 'beads of sweat, eyes narrowed down to a single point.', requirements: { job: ['swordsman', 'archer'] } },

    // Spellblade
    { id: 'expr_sb_unity', label: '劍咒合一 (Sword-Spell Unity)', category: '魔法劍士專屬', intensity: 0.6, cues: 'smirking with confidence, eyes glowing with magical runes, perfect focus.', requirements: { job: ['spellblade', 'swordsman'] } },
    { id: 'expr_sb_analysis', label: '冷酷解析 (Cold Analysis)', category: '魔法劍士專屬', intensity: 0.4, cues: 'narrowed eyes reading magical ley lines, calculating expression.', requirements: { job: ['spellblade', 'mage'] } },
    { id: 'expr_sb_overload', label: '能量過載 (Energy Overload)', category: '魔法劍士專屬', intensity: 0.8, cues: 'gritting teeth against magical feedback, sweat on brow, glowing veins.', requirements: { job: ['spellblade', 'swordsman'] } },
    { id: 'expr_sb_tactical', label: '戰術專注 (Tactical Focus)', category: '魔法劍士專屬', intensity: 0.5, cues: 'calculating the next portal jump, rapid pupil movement.', requirements: { job: ['spellblade', 'assassin'] } },
    { id: 'expr_sb_will', label: '劍聖意志 (Blade Master\'s Will)', category: '魔法劍士專屬', intensity: 0.7, cues: 'sharp and immovable gaze, eyes like forged steel.', requirements: { job: ['spellblade', 'paladin'] } },

    // Pirate Captain
    { id: 'expr_pir_laughter', label: '豪邁狂笑 (Boisterous Laughter)', category: '海盜船長專屬', intensity: 0.9, cues: 'wide hearty laugh, wild and free look, eye-crinkles of joy.', requirements: { job: ['pirate_captain', 'bard'] } },
    { id: 'expr_pir_storm', label: '風浪挑戰 (Defying the Storm)', category: '海盜船長專屬', intensity: 0.6, cues: 'looking into the wind with one eye shut, grit and adventure.', requirements: { job: ['pirate_captain', 'ranger'] } },
    { id: 'expr_pir_greed', label: '寶藏貪婪 (Glint of Greed)', category: '海盜船長專屬', intensity: 0.5, cues: 'eyes reflecting gold coins, sharp and cunning look.', requirements: { job: ['pirate_captain', 'phantom_thief'] } },
    { id: 'expr_pir_somber', label: '孤立船長 (Isolated Captain)', category: '海盜船長專屬', intensity: 0.4, cues: 'somber look at the empty horizon, weight of command.', requirements: { job: ['pirate_captain', 'knight'] } },
    { id: 'expr_pir_defiance', label: '叛逆不羈 (Rebellious Defiance)', category: '海盜船長專屬', intensity: 0.7, cues: 'arrogant tilt of the head, looking down at authority.', requirements: { job: ['pirate_captain', 'assassin'] } },

    // Alchemist
    { id: 'expr_alc_mad', label: '瘋狂學者 (Mad Scholar)', category: '煉金術士專屬', intensity: 0.8, cues: 'eyes wide with curiosity, chemical reflections, slightly crazed look.', requirements: { job: ['alchemist', 'mage'] } },
    { id: 'expr_alc_success', label: '實驗成功 (Success!)', category: '煉金術士專屬', intensity: 0.9, cues: 'euphoric grin, face covered in soot, eyes sparkling with victory.', requirements: { job: ['alchemist', 'summoner'] } },
    { id: 'expr_alc_filter', label: '毒性過濾 (Toxic Filter)', category: '煉金術士專屬', intensity: 0.6, cues: 'focused through goggles, gritting teeth against fumes.', requirements: { job: ['alchemist', 'bounty_hunter'] } },
    { id: 'expr_alc_musing', label: '煉金沉思 (Alchemical Musing)', category: '煉金術士專屬', intensity: 0.4, cues: 'deeply focused on a microscopic reaction, quiet calculation.', requirements: { job: ['alchemist', 'cleric'] } },
    { id: 'expr_alc_measurement', label: '精準計量 (Precise Measurement)', category: '煉金術士專屬', intensity: 0.5, cues: 'one eye closed for better focus, intense and steady gaze.', requirements: { job: ['alchemist', 'archer'] } },

    // Druid
    { id: 'expr_dru_whisper', label: '自然低語 (Nature\'s Whisper)', category: '德魯伊專屬', intensity: 0.3, cues: 'looking as if hearing something in the wind, tilted head.', requirements: { job: ['druid', 'cleric'] } },
    { id: 'expr_dru_dream', label: '翡翠夢境 (Emerald Dream)', category: '德魯伊專屬', intensity: 0.4, cues: 'eyes glowing soft green, peaceful and detached look.', requirements: { job: ['druid', 'elementalist'] } },
    { id: 'expr_dru_fury', label: '野性怒火 (Primal Fury)', category: '德魯伊專屬', intensity: 0.8, cues: 'growling, pupils becoming slit-like and amber.', requirements: { job: ['druid', 'swordsman'] } },
    { id: 'expr_dru_empty', label: '萬物皆空 (Empty as the Wild)', category: '德魯伊專屬', intensity: 0.5, cues: 'ancient and detached gaze, seeing the world as energy.', requirements: { job: ['druid', 'cleric'] } },
    { id: 'expr_dru_joy', label: '森林喜悅 (Forest Joy)', category: '德魯伊專屬', intensity: 0.5, cues: 'gentle smile, eyes full of life and warmth.', requirements: { job: ['druid', 'bard'] } },

    // Elementalist
    { id: 'expr_ele_conflict', label: '元素衝突 (Elemental Conflict)', category: '元素師專屬', intensity: 0.8, cues: 'face split by fire and ice reflections, intense focus.', requirements: { job: ['elementalist', 'warlock'] } },
    { id: 'expr_ele_storm', label: '暴風狂怒 (Storm\'s Fury)', category: '元素師專屬', intensity: 0.9, cues: 'eyes crackling with electrical sparks, wind-blown features.', requirements: { job: ['elementalist', 'summoner'] } },
    { id: 'expr_ele_ice', label: '冷若冰霜 (Cold as Ice)', category: '元素師專屬', intensity: 0.6, cues: 'chilled features, frosted eyelashes, unreadable cold eyes.', requirements: { job: ['elementalist', 'paladin'] } },
    { id: 'expr_ele_heat', label: '熔岩之熱 (Heat of Magma)', category: '元素師專屬', intensity: 0.7, cues: 'intense glowing warmth on skin, sweating, fierce gaze.', requirements: { job: ['elementalist', 'monk'] } },
    { id: 'expr_ele_vision', label: '全能視界 (Omni-Sighted)', category: '元素師專屬', intensity: 0.5, cues: 'looking at the world as pure elemental energy, glowing pupils.', requirements: { job: ['elementalist', 'mage'] } },

    // Warlock
    { id: 'expr_war_pact', label: '邪神契約 (Eldritch Contract)', category: '暗影術士專屬', intensity: 0.8, cues: 'sinister smile, one eye totally black, dark arcane pulse.', requirements: { job: ['warlock', 'necromancer'] } },
    { id: 'expr_war_whisper', label: '虛空呢喃 (Whispering Void)', category: '暗影術士專屬', intensity: 0.7, cues: 'head tilted, listening to shadows, haunting expression.', requirements: { job: ['warlock', 'assassin'] } },
    { id: 'expr_war_satisfied', label: '靈魂飽足 (Soul-Satisfied)', category: '暗影術士專屬', intensity: 0.6, cues: 'refreshed and dangerous look after dark magic, slight grin.', requirements: { job: ['warlock', 'assassin'] } },
    { id: 'expr_war_mockery', label: '黑暗嘲弄 (Shadow\'s Mockery)', category: '暗影術士專屬', intensity: 0.5, cues: 'arrogant tilt of head, eyes full of dark superiority.', requirements: { job: ['warlock', 'cleric'] } },
    { id: 'expr_war_pain', label: '痛苦契合 (Pact of Pain)', category: '暗影術士專屬', intensity: 0.9, cues: 'sweating, gritting teeth, eyes showing the price of power.', requirements: { job: ['warlock', 'swordsman'] } },

    // Cleric
    { id: 'expr_cle_inspire', label: '聖光感召 (Holy Inspiration)', category: '聖職者專屬', intensity: 0.4, cues: 'looking up with tears of joy, face illuminated by light.', requirements: { job: ['cleric'] } },
    { id: 'expr_cle_blessed', label: '祈福祝禱 (Blessed Prayer)', category: '聖職者專屬', intensity: 0.5, cues: 'gentle and selfless eyes, radiating healing warmth.', requirements: { job: ['cleric', 'druid'] } },
    { id: 'expr_cle_faith', label: '堅信不疑 (Unwavering Faith)', category: '聖職者專屬', intensity: 0.6, cues: 'strong and calm gaze, absolute spiritual confidence.', requirements: { job: ['cleric', 'paladin'] } },
    { id: 'expr_cle_tranquil', label: '聖所寧靜 (Sanctum Tranquility)', category: '聖職者專屬', intensity: 0.3, cues: 'meditative and pure features, eyes closed in peace.', requirements: { job: ['cleric', 'exorcist'] } },
    { id: 'expr_cle_resolve', label: '淨化決心 (Purifying Resolve)', category: '聖職者專屬', intensity: 0.8, cues: 'serious and intense against the darkness, burning white eyes.', requirements: { job: ['cleric', 'necromancer'] } },
    // --- 人類表情 (Human) ---
    { id: 'expr_race_hum_will', label: '頑強意志 (Iron Will)', category: '人類專屬', intensity: 0.7, cues: 'clenched jaw, sweat on brow, eyes showing human defiance.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_wonder', label: '孩提驚奇 (Childlike Wonder)', category: '人類專屬', intensity: 0.4, cues: 'wide eyes reflecting magic, mouth slightly agape, pure curiosity.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_cunning', label: '狡黠商談 (Cunning Negotiator)', category: '人類專屬', intensity: 0.5, cues: 'one eyebrow raised, subtle smirk, eyes evaluating the deal.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_grief', label: '凡夫之慟 (Mortal Grief)', category: '人類專屬', intensity: 0.8, cues: 'quiet tears, looking at a lost item, deep human sorrow.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_ambition', label: '開拓野心 (Pioneer Ambition)', category: '人類專屬', intensity: 0.6, cues: 'intense gaze at the horizon, visionary and hungry look.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_serene', label: '午後安詳 (Noon Serenity)', category: '人類專屬', intensity: 0.3, cues: 'gentle smile, eyes closed, enjoying the sun on the face.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_pride', label: '文明自豪 (Civilized Pride)', category: '人類專屬', intensity: 0.5, cues: 'chin tilted up, dignified and confident gaze.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_exhaust', label: '歸途疲憊 (Homeward Fatigue)', category: '人類專屬', intensity: 0.4, cues: 'heavy eyelids, sighing, satisfied but worn out.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_doubt', label: '凡人猶豫 (Mortal Doubt)', category: '人類專屬', intensity: 0.5, cues: 'biting lip, eyes darting, unsure of the next step.', requirements: { race: ['human'] } },
    { id: 'expr_race_hum_cheer', label: '慶典狂歡 (Festival Cheer)', category: '人類專屬', intensity: 0.9, cues: 'huge genuine laugh, eyes crinkled with pure joy.', requirements: { race: ['human'] } },

    // --- 精靈表情 (Elf) ---
    { id: 'expr_race_elf_ageless', label: '無盡歲月 (Timeless Gaze)', category: '精靈專屬', intensity: 0.3, cues: 'distant eyes that have seen eras pass, serene and alien.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_scorn', label: '優雅輕蔑 (Elegant Scorn)', category: '精靈專屬', intensity: 0.5, cues: 'subtle curl of the lip, looking down with superiority.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_trance', label: '奧術入神 (Arcane Trance)', category: '精靈專屬', intensity: 0.8, cues: 'pupils dissolved into magic light, totally detached from reality.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_gentle', label: '古木溫柔 (Ancient Tenderness)', category: '精靈專屬', intensity: 0.4, cues: 'a look filled with the softness of a thousand springs.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_alert', label: '密林警訊 (Forest Warning)', category: '精靈專屬', intensity: 0.7, cues: 'eyes wide and vibrating, hearing something the user can\'t.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_frost', label: '冰冷疏離 (Icy Detachment)', category: '精靈專屬', intensity: 0.6, cues: 'face like perfectly carved marble, no emotion, cold eyes.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_mischief', label: '森林惡作劇 (Fey Mischief)', category: '精靈專屬', intensity: 0.5, cues: 'wicked playful glint in eyes, tilting head like a fox.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_mourn', label: '凋零哀悼 (Wither Mourning)', category: '精靈專屬', intensity: 0.4, cues: 'seeing the end of a cycle, profound but quiet sadness.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_focus', label: '極致瞄準 (Zen Aim)', category: '精靈專屬', intensity: 0.9, cues: 'breath held, eyes become predator-like and unblinking.', requirements: { race: ['elf'] } },
    { id: 'expr_race_elf_flow', label: '萬物連結 (Universal Flow)', category: '精靈專屬', intensity: 0.5, cues: 'slight smile as if feeling the energy of every leaf.', requirements: { race: ['elf'] } },

    // --- 矮人表情 (Dwarf) ---
    { id: 'expr_race_dwa_stubborn', label: '花崗岩固執 (Granite Stubborn)', category: '矮人專屬', intensity: 0.7, cues: 'frowning deeply, jaw set like stone, looking immovable.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_jolly', label: '爐火喜悅 (Hearthside Jolly)', category: '矮人專屬', intensity: 0.6, cues: 'cheeks red from ale and laughter, merry eyes.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_gold', label: '黃金痴迷 (Gold Fever)', category: '矮人專屬', intensity: 0.8, cues: 'eyes reflecting glowing gold, pupils dilated with greed.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_ancient', label: '地底睿智 (Cavern Wisdom)', category: '矮人專屬', intensity: 0.4, cues: 'heavy brows, eyes knowing the secrets of the deep earth.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_rage', label: '山崩之怒 (Avalanche Rage)', category: '矮人專屬', intensity: 1.0, cues: 'roaring, face turning red, eyes bulging with power.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_focus', label: '匠心獨具 (Craftsman Focus)', category: '矮人專屬', intensity: 0.5, cues: 'tongue slightly out, eyes focused on a tiny gear.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_proud', label: '氏族榮耀 (Clan Pride)', category: '矮人專屬', intensity: 0.6, cues: 'stroking beard with a satisfied, powerful look.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_gloom', label: '地底憂鬱 (Deep Gloom)', category: '矮人專屬', intensity: 0.4, cues: 'dark circles under eyes, looking tired of the dark.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_stern', label: '守門嚴厲 (Gatekeeper Stern)', category: '矮人專屬', intensity: 0.5, cues: 'unblinking hard gaze, assessing a stranger\'s worth.', requirements: { race: ['dwarf'] } },
    { id: 'expr_race_dwa_drunk', label: '微醺微醺 (A Bit Tipsy)', category: '矮人專屬', intensity: 0.5, cues: 'lazy eyelids, crooked smile, general relaxation.', requirements: { race: ['dwarf'] } },

    // --- 獸人表情 (Orc) ---
    { id: 'expr_race_orc_primal', label: '原始戰意 (Primal Intent)', category: '獸族專屬', intensity: 0.9, cues: 'lower jaw jutting forward, eyes wide and bloodshot, heavy breathing.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_honor', label: '血之榮耀 (Honor in Blood)', category: '獸族專屬', intensity: 0.4, cues: 'solemn nod, one hand over heart, eyes full of tribal respect.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_hunger', label: '荒野飢渴 (Wild Hunger)', category: '獸族專屬', intensity: 0.7, cues: 'licking lips with a rough tongue, focused stare at prey.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_scars', label: '傷疤詩篇 (Psalm of Scars)', category: '獸族專屬', intensity: 0.5, cues: 'tracing a deep scar on the face, a look of grim remembrance.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_laugh', label: '雷鳴大笑 (Thundering Laugh)', category: '獸族專屬', intensity: 0.8, cues: 'mouth wide open, head back, shaking with powerful mirth.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_sneer', label: '部落蔑視 (Tribal Sneer)', category: '獸族專屬', intensity: 0.6, cues: 'lifting one upper lip to show a tusk, eyes full of disdain.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_pain', label: '鋼鐵痛覺 (Iron Pain)', category: '獸族專屬', intensity: 0.5, cues: 'ignoring a bleeding wound with a look of extreme toughness.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_calm', label: '戰前寧靜 (Pre-Battle Calm)', category: '獸族專屬', intensity: 0.3, cues: 'closing eyes and breathing deeply, centering the internal beast.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_mourn', label: '荒原哀悼 (Wasteland Mourn)', category: '獸族專屬', intensity: 0.4, cues: 'looking up at the stars with a heavy, lonely soul.', requirements: { race: ['orc'] } },
    { id: 'expr_race_orc_savagery', label: '純粹野性 (Pure Savagery)', category: '獸族專屬', intensity: 1.0, cues: 'face covered in war paint, eyes glowing with a dark beastly light.', requirements: { race: ['orc'] } },

    // --- 貓靈表情 (Cat Sith) ---
    { id: 'expr_race_cat_dilated', label: '全神貫注 (Full Focus)', category: '貓靈專屬', intensity: 0.8, cues: 'pupils becoming huge black orbs, tail tip twitching rapidly.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_narrow', label: '慵懶凝視 (Lazy Gaze)', category: '貓靈專屬', intensity: 0.3, cues: 'eyes narrowed to slits, blinking slowly in a cozy manner.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_hiss', label: '威嚇哈氣 (Hissing Alert)', category: '貓靈專屬', intensity: 0.9, cues: 'mouth open showing small fangs, ears flattened backwards.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_smug', label: '得逞壞笑 (Smug Grin)', category: '貓靈專屬', intensity: 0.6, cues: 'one corner of the mouth up, whiskers vibrating with glee.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_fear', label: '炸毛驚嚇 (Puffed Fear)', category: '貓靈專屬', intensity: 0.7, cues: 'wide eyes, hair and tail puffing up, startled posture.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_pleased', label: '呼嚕滿足 (Purring Bliss)', category: '貓靈專屬', intensity: 0.4, cues: 'cheeks looking soft, eyes closed in absolute comfort.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_curious', label: '歪頭殺 (Head Tilt)', category: '貓靈專屬', intensity: 0.5, cues: 'head tilted 45 degrees, one ear twitching forward.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_hunt', label: '獵食律動 (Hunting Rhythm)', category: '貓靈專屬', intensity: 0.8, cues: 'intense staring at the ground, butt wiggling slightly.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_shy', label: '尾巴遮面 (Shy Behind Tail)', category: '貓靈專屬', intensity: 0.4, cues: 'looking from over the top of a fluffy tail, blushing.', requirements: { race: ['cat_sith'] } },
    { id: 'expr_race_cat_chaotic', label: '混亂邪惡 (Chaotic Energy)', category: '貓靈專屬', intensity: 0.7, cues: 'looking at a glass on the edge of a table with intent.', requirements: { race: ['cat_sith'] } },

    // --- 龍裔表情 (Dragonborn) ---
    { id: 'expr_race_dra_slit', label: '豎瞳威壓 (Slit-Pupil Gaze)', category: '龍裔專屬', intensity: 0.9, cues: 'golden eyes with narrow vertical pupils, unblinking cold stare.', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_smoke', label: '鼻息冒煙 (Steam Nostrils)', category: '龍裔專屬', intensity: 0.6, cues: 'smoke drifting from nostrils, face heated with anger.', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_draconic', label: '真龍傲視 (Draconic Pride)', category: '龍裔專屬', intensity: 0.5, cues: 'chin held high, looking down on lesser beings with calm power.', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_glow', label: '鱗片微光 (Scale Glow)', category: '龍裔專屬', intensity: 0.4, cues: 'faint glowing patterns appearing on the facial scales.', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_vocal', label: '喉間震動 (Vocal Rumble)', category: '龍裔專屬', intensity: 0.7, cues: 'throat glowing with elemental energy (fire/lightning).', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_fury', label: '古龍之怒 (Ancient Fury)', category: '龍裔專屬', intensity: 1.0, cues: 'teeth bared, jaw wide, eyes burning with internal fire.', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_wisdom', label: '長生智慧 (Ageless Wisdom)', category: '龍裔專屬', intensity: 0.3, cues: 'heavy eyelids, a look of having seen the birth of mountains.', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_neutral', label: '如石之毅 (Stone-Like Resolve)', category: '龍裔專屬', intensity: 0.4, cues: 'completely expressionless reptilian face, impenetrable.', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_curiosity', label: '類龍好奇 (Reptilian Curiosity)', category: '龍裔專屬', intensity: 0.5, cues: 'tilting head, tongue flickering out to "taste" the air.', requirements: { race: ['dragonborn'] } },
    { id: 'expr_race_dra_noble', label: '高貴血脈 (Noble Bloodline)', category: '龍裔專屬', intensity: 0.6, cues: 'dignified and sharp features, reflecting royal dragon lineage.', requirements: { race: ['dragonborn'] } },

    // --- 人魚表情 (Mermaid/Siren) ---
    { id: 'expr_race_mer_melancholy', label: '深海憂鬱 (Ocean Melancholy)', category: '人魚專屬', intensity: 0.4, cues: 'looking into the distance with eyes full of the ocean\'s depth.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_enchant', label: '人魚魅惑 (Siren Enchantment)', category: '人魚專屬', intensity: 0.7, cues: 'alluring gaze with subtle glowing eyes, wet hair highlights.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_awe', label: '缺氧驚嘆 (Breathless Awe)', category: '人魚專屬', intensity: 0.8, cues: 'mouth slightly open, eyes wide, marveling at the surface world.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_joy', label: '珍珠喜悅 (Pearl-Like Joy)', category: '人魚專屬', intensity: 0.5, cues: 'shimmering smile, eyes reflecting the glow of a pearl.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_fume', label: '怒海咆哮 (Fuming Tide)', category: '人魚專屬', intensity: 0.9, cues: 'sharp teeth showing, eyes burning with sea-tempest rage.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_song', label: '月下詠嘆 (Moonlight Aria)', category: '人魚專屬', intensity: 0.6, cues: 'singing with eyes closed, face illuminated by moonlight.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_secret', label: '珊瑚秘密 (Coral Secret)', category: '人魚專屬', intensity: 0.3, cues: 'one finger to the lips, a knowing and mysterious gaze.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_scared', label: '深淵恐懼 (Abyssal Dread)', category: '人魚專屬', intensity: 0.7, cues: 'looking down into the dark, pupils dilated with fear.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_grace', label: '潮汐優雅 (Tidal Grace)', category: '人魚專屬', intensity: 0.5, cues: 'serene and royal presence, the look of an ocean princess.', requirements: { race: ['mermaid', 'siren'] } },
    { id: 'expr_race_mer_curious', label: '船艦好奇 (Vessel Curiosity)', category: '人魚專屬', intensity: 0.4, cues: 'peeking over the water line with interested eyes.', requirements: { race: ['mermaid', 'siren'] } },

    // --- 魅魔/夢魔表情 (Succubus/Incubus) ---
    { id: 'expr_race_suc_smirk', label: '玩味笑容 (Playful Smirk)', category: '惡魔專屬', intensity: 0.5, cues: 'one corner of the mouth lifted, eyes full of mischief.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_hungry', label: '渴望凝視 (Hungry Gaze)', category: '惡魔專屬', intensity: 0.8, cues: 'dilated pupils, looking at the viewer as if they are a feast.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_mockery', label: '惡魔調笑 (Demonic Mockery)', category: '惡魔專屬', intensity: 0.6, cues: 'arrogant tilt of the head, eyes showing dark superiority.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_lethal', label: '致命溫柔 (Lethal Tenderness)', category: '惡魔專屬', intensity: 0.4, cues: 'soft smile that doesn\'t reach the cold, dangerous eyes.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_hollow', label: '虛空空洞 (Hollow Ambition)', category: '惡魔專屬', intensity: 0.7, cues: 'eyes becoming totally black or purple, losing focus.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_bored', label: '永恆無聊 (Eternal Boredom)', category: '惡魔專屬', intensity: 0.3, cues: 'resting head on hand, looking totally unimpressed.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_rage', label: '地獄怒火 (Hellfire Rage)', category: '惡魔專屬', intensity: 1.0, cues: 'vibrant red glow from the eyes, gritted fangs.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_seduce', label: '純粹魅惑 (Pure Seduction)', category: '惡魔專屬', intensity: 0.9, cues: 'half-closed heavy eyelids, beckoning look.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_calculated', label: '計算靈魂 (Calculating Soul)', category: '惡魔專屬', intensity: 0.5, cues: 'squinting eyes as if reading an unseen contract.', requirements: { race: ['succubus', 'incubus'] } },
    { id: 'expr_race_suc_pleasure', label: '暗影快感 (Shadowy Pleasure)', category: '惡魔專屬', intensity: 0.6, cues: 'head tilted back, eyes half-lidded, a look of dark satisfaction.', requirements: { race: ['succubus', 'incubus'] } },

    // --- 墮天使表情 (Fallen Angel) ---
    { id: 'expr_race_fal_tragic', label: '悲劇壯美 (Tragic Splendor)', category: '墮天使專屬', intensity: 0.4, cues: 'beautiful but deeply scarred features, weeping eyes.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_scorn', label: '天界蔑視 (Celestial Scorn)', category: '墮天使專屬', intensity: 0.6, cues: 'looking up with a cold, rebellious smirk targeted at the sky.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_shattered', label: '靈魂破碎 (Soul Shattered)', category: '墮天使專屬', intensity: 0.8, cues: 'eyes with cracks like broken glass, a look of total loss.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_defiance', label: '永恆反叛 (Eternal Defiance)', category: '墮天使專屬', intensity: 0.7, cues: 'jaw set hard, eyes burning with dark conviction.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_lost', label: '迷失荒原 (Lost in Void)', category: '墮天使專屬', intensity: 0.3, cues: 'empty, hollow gaze seeing nothing but the past.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_reborn', label: '黑暗新生 (Dark Rebirth)', category: '墮天使專屬', intensity: 0.9, cues: 'eyes snapping open with dark purple light, aura of power.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_bitter', label: '苦澀微笑 (Bitter Smile)', category: '墮天使專屬', intensity: 0.5, cues: 'a smile that shows the weight of falling from grace.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_vengeance', label: '復仇心切 (Burning Vengeance)', category: '墮天使專屬', intensity: 1.0, cues: 'bloodshot eyes, face contorted in shadow-rage.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_stoic', label: '冷寂堅毅 (Cold Stoicism)', category: '墮天使專屬', intensity: 0.4, cues: 'emotionless face like a frozen gothic statue.', requirements: { race: ['fallen_angel'] } },
    { id: 'expr_race_fal_envy', label: '光之嫉妒 (Envy of Light)', category: '墮天使專屬', intensity: 0.5, cues: 'looking at a golden source of light with longing and hate.', requirements: { race: ['fallen_angel'] } },

    // --- 妖精表情 (Fairy) ---
    { id: 'expr_race_fai_spark', label: '靈光一閃 (Magic Sparkle)', category: '妖精專屬', intensity: 0.5, cues: 'eyes vibrant and sparkling with a thousand colors.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_pout', label: '嬌嗔不滿 (Cute Pout)', category: '妖精專屬', intensity: 0.4, cues: 'cheeks puffed out, arms crossed, looking adorably annoyed.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_ecstasy', label: '自然狂喜 (Nature Ecstasy)', category: '妖精專屬', intensity: 0.8, cues: 'laughing while twirling, eyes closed in joy.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_shy', label: '含羞待放 (Shy Petal)', category: '妖精專屬', intensity: 0.3, cues: 'blushing deeply, peeking from behind the hands.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_naughty', label: '惡作劇中 (Mid-Prank)', category: '妖精專屬', intensity: 0.6, cues: 'tongue sticking out slightly, one eye closed in a wink.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_scared', label: '露珠驚魂 (Dewdrop Scare)', category: '妖精專屬', intensity: 0.7, cues: 'wide eyes at a "giant" insect, mouth in an "O" shape.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_sleepy', label: '月夜倦意 (Moonlight Drowse)', category: '妖精專屬', intensity: 0.2, cues: 'yawning, one eye rubbing with the back of a small hand.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_focus', label: '粉塵凝練 (Dust Focus)', category: '妖精專屬', intensity: 0.5, cues: 'steady intense focus on a glowing magical spark.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_curious', label: '巨人觀察 (Giant Watching)', category: '妖精專屬', intensity: 0.4, cues: 'looking up with head tilted, fascinated by a bigger world.', requirements: { race: ['fairy'] } },
    { id: 'expr_race_fai_brave', label: '小小勇者 (Tiny Hero)', category: '妖精專屬', intensity: 0.7, cues: 'determined scowl, eyes full of "big" bravery.', requirements: { race: ['fairy'] } },

    // --- 暗精靈表情 (Dark Elf) ---
    { id: 'expr_race_delf_cold', label: '地底冷酷 (Underdark Cold)', category: '暗精靈專屬', intensity: 0.6, cues: 'face like obsidian, no warmth, eyes like predatory gems.', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_malice', label: '蛛網惡意 (Spider Malice)', category: '暗精靈專屬', intensity: 0.8, cues: 'sinister grin, eyes glowing with a sharp purple light.', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_arrogant', label: '血脈傲慢 (Bloodline Pride)', category: '暗精靈專屬', intensity: 0.5, cues: 'chin raised, looking down the nose at the "surface trash".', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_focused', label: '狩獵專注 (Hunt Focus)', category: '暗精靈專屬', intensity: 0.7, cues: 'unblinking silver eyes, tracking a target in total dark.', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_cunning', label: '致命詭計 (Lethal Cunning)', category: '暗精靈專屬', intensity: 0.6, cues: 'one corner of the mouth up, a look of a master schemer.', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_pain', label: '毒液反噬 (Venom Sting)', category: '暗精靈專屬', intensity: 0.9, cues: 'gritting teeth, sweating, eyes showing internal agony.', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_pleas', label: '黑暗愉悅 (Dark Delights)', category: '暗精靈專屬', intensity: 0.7, cues: 'head back, eyes half-closed, enjoying the scent of fear.', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_stern', label: '母系嚴律 (Matriarch Stern)', category: '暗精靈專屬', intensity: 0.5, cues: 'unyielding authoritative look, eyes reflecting power.', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_vigen', label: '復仇火種 (Seeds of Revenge)', category: '暗精靈專屬', intensity: 0.4, cues: 'smoldering red glow in the depth of the eyes.', requirements: { race: ['dark_elf'] } },
    { id: 'expr_race_delf_mockery', label: '地底嘲弄 (Loro Mockery)', category: '暗精靈專屬', intensity: 0.6, cues: 'laughing silently, eyes full of cruel amusement.', requirements: { race: ['dark_elf'] } },

    // --- 哥布林表情 (Goblin) ---
    { id: 'expr_race_gob_grin', label: '狡詰邪笑 (Cunning Grin)', category: '哥布林專屬', intensity: 0.6, cues: 'showing needle-like teeth, yellow eyes glowing with greed.', requirements: { race: ['goblin'] } },
    { id: 'expr_race_gob_whine', label: '求饒哭喪 (Cowardly Whine)', category: '哥布林專屬', intensity: 0.5, cues: 'watery eyes, lower lip trembling, looking for an escape.', requirements: { race: ['goblin'] } },
    { id: 'expr_race_gob_rage', label: '瘋狂尖叫 (Mad Screaming)', category: '哥布林專屬', intensity: 0.9, cues: 'veins popping on green forehead, chaotic wide eyes.', requirements: { race: ['goblin'] } },
    { id: 'expr_race_gob_shock', label: '意外橫財 (Surprise Fortune)', category: '哥布林專屬', intensity: 0.7, cues: 'eyes wide at fixed on a piece of shiny loot, jaw dropped.', requirements: { race: ['goblin'] } },
    { id: 'expr_race_gob_sneaked', label: '潛行快感 (Stealthy Thrill)', category: '哥布林專屬', intensity: 0.4, cues: 'one eye closed, looking focused but mischievous.', requirements: { race: ['goblin'] } },

    // --- 娜迦/蛇人表情 (Naga) ---
    { id: 'expr_race_nag_prey', label: '獵物鎖定 (Target Locked)', category: '娜迦專屬', intensity: 0.8, cues: 'vertical slit pupils, flickering tongue, intense cold stare.', requirements: { race: ['naga', 'naga_m'] } },
    { id: 'expr_race_nag_noble', label: '遠古尊貴 (Ancient Nobility)', category: '娜迦專屬', intensity: 0.5, cues: 'chin held high, looking down with calm reptilian superiority.', requirements: { race: ['naga', 'naga_m'] } },
    { id: 'expr_race_nag_hiss', label: '低頻嘶吼 (Low Frequency Hiss)', category: '娜迦專屬', intensity: 0.9, cues: 'mouth half-open, fangs visible, eyes reflecting predator heat.', requirements: { race: ['naga', 'naga_m'] } },
    { id: 'expr_race_nag_dream', label: '深水幻夢 (Deep Water Dream)', category: '娜迦專屬', intensity: 0.4, cues: 'misty eyes, a look of being underwater even on land.', requirements: { race: ['naga', 'naga_m'] } },
    { id: 'expr_race_nag_venom', label: '劇毒思緒 (Venomous Thoughts)', category: '娜迦專屬', intensity: 0.7, cues: 'sinister foxy smile (for snake folk), very calculating eyes.', requirements: { race: ['naga', 'naga_m'] } },

    // --- 牛頭人表情 (Minotaur) ---
    { id: 'expr_race_min_rage', label: '公牛之怒 (Bull Rage)', category: '牛頭人專屬', intensity: 1.0, cues: 'flared nostrils, bloodshot eyes, head lowered for a charge.', requirements: { race: ['minotaur'] } },
    { id: 'expr_race_min_burden', label: '迷宮負擔 (Maze Burden)', category: '牛頭人專屬', intensity: 0.4, cues: 'heavy eyelids, a look of immense physical and mental weight.', requirements: { race: ['minotaur'] } },
    { id: 'expr_race_min_proud', label: '獸角榮耀 (Horned Pride)', category: '牛頭人專屬', intensity: 0.6, cues: 'stern and powerful look, reflecting the strength of the labyrinth.', requirements: { race: ['minotaur'] } },
    { id: 'expr_race_min_wild', label: '原始本能 (Primal Instinct)', category: '牛頭人專屬', intensity: 0.8, cues: 'shining pupils in the dark, jaw set in a low growl.', requirements: { race: ['minotaur'] } },
    { id: 'expr_race_min_calm', label: '止戰寧靜 (Warrior Silence)', category: '牛頭人專屬', intensity: 0.3, cues: 'closing eyes, smoke drifting from nose, peaceful resolve.', requirements: { race: ['minotaur'] } },

    // --- 巨人表情 (Giant) ---
    { id: 'expr_race_gia_ponder', label: '如山沉思 (Mountain Pondering)', category: '巨人專屬', intensity: 0.4, cues: 'looking down at tiny things with curiosity and slow thought.', requirements: { race: ['giant', 'cyclops'] } },
    { id: 'expr_race_gia_roar', label: '震天咆哮 (Heaven-Shaking Roar)', category: '巨人專屬', intensity: 1.0, cues: 'mouth wide as a cavern, face contorted in massive sound.', requirements: { race: ['giant', 'cyclops'] } },
    { id: 'expr_race_gia_gentle', label: '溫和巨人 (Gentle Giant)', category: '巨人專屬', intensity: 0.3, cues: 'soft smile, eyes like large warm pools of kindness.', requirements: { race: ['giant', 'cyclops'] } },
    { id: 'expr_race_gia_sleep', label: '雲海沈睡 (Cloud Sleep)', category: '巨人專屬', intensity: 0.2, cues: 'heavy eyelids closed, face peaceful as a winter mountain.', requirements: { race: ['giant', 'cyclops'] } },
    { id: 'expr_race_gia_watch', label: '守望孤世 (Lonely Watch)', category: '巨人專屬', intensity: 0.5, cues: 'looking at the far horizon with a sense of eternal scale.', requirements: { race: ['giant', 'cyclops'] } },

    // --- 蜥蜴人表情 (Lizardfolk) ---
    { id: 'expr_race_liz_cold', label: '冷血凝視 (Cold-Blooded Stare)', category: '蜥蜴專屬', intensity: 0.6, cues: 'flickering tongue, unblinking eyes, absolute biological focus.', requirements: { race: ['lizardfolk'] } },
    { id: 'expr_race_liz_angry', label: '沼澤怒火 (Swamp Rage)', category: '蜥蜴專屬', intensity: 0.9, cues: 'throat sac inflated, mouth open to show backward teeth.', requirements: { race: ['lizardfolk'] } },
    { id: 'expr_race_liz_warm', label: '日光滿足 (Solar Satisfaction)', category: '蜥蜴專屬', intensity: 0.3, cues: 'relaxed reptilian eyes, slight tilt of the head to the sun.', requirements: { race: ['lizardfolk'] } },
    { id: 'expr_race_liz_alert', label: '泥水警覺 (Mud-Water Alert)', category: '蜥蜴專屬', intensity: 0.7, cues: 'staying perfectly still, eyes tracking every ripple in water.', requirements: { race: ['lizardfolk'] } },
    { id: 'expr_race_liz_pride', label: '鱗片榮耀 (Scale Pride)', category: '蜥蜴專屬', intensity: 0.5, cues: 'standing tall, chest out, reflective pattern on facial scales.', requirements: { race: ['lizardfolk'] } },

    // --- 戰鬥/狂想 (Intense) ---

    // --- 吸血鬼表情 (Vampire) ---
    { id: 'expr_race_vam_hunger', label: '永恆飢渴 (Eternal Hunger)', category: '吸血鬼專屬', intensity: 0.8, cues: 'mouth slightly open, showing sharp fangs, eyes fixed on target.', requirements: { race: ['vampire', 'vampire_male'] } },
    { id: 'expr_race_vam_noble', label: '冷漠尊貴 (Cold Nobility)', category: '吸血鬼專屬', intensity: 0.4, cues: 'pale impassive face, eyes that have seen centuries, noble aura.', requirements: { race: ['vampire', 'vampire_male'] } },
    { id: 'expr_race_vam_blood', label: '沉溺鮮血 (Blood Indulgence)', category: '吸血鬼專屬', intensity: 0.7, cues: 'head tilted back, eyes half-closed in pleasure, red stains on lips.', requirements: { race: ['vampire', 'vampire_male'] } },
    { id: 'expr_race_vam_fangs', label: '尖牙外露 (Fangs Bared)', category: '吸血鬼專屬', intensity: 1.0, cues: 'full display of vampire fangs, eyes turning bright red.', requirements: { race: ['vampire', 'vampire_male'] } },
    { id: 'expr_race_vam_lonely', label: '長夜孤獨 (Long Night Loneliness)', category: '吸血鬼專屬', intensity: 0.3, cues: 'looking out of a window with intense sorrow and weariness.', requirements: { race: ['vampire', 'vampire_male'] } },

    // --- 狼人表情 (Werewolf) ---
    { id: 'expr_race_wer_kill', label: '狂野殺意 (Wild Killing Intent)', category: '狼人專屬', intensity: 0.9, cues: 'furrowed brow, amber eyes glowing with primal aggression.', requirements: { race: ['werewolf'] } },
    { id: 'expr_race_wer_mania', label: '滿月狂躁 (Full Moon Mania)', category: '狼人專屬', intensity: 1.0, cues: 'manic crazy eyes, dilated pupils, wide unsettling grin.', requirements: { race: ['werewolf'] } },
    { id: 'expr_race_wer_focus', label: '捕獵專注 (Hunting Focus)', category: '狼人專屬', intensity: 0.7, cues: 'eyes tracking a target with absolute focus, smelling the air.', requirements: { race: ['werewolf'] } },
    { id: 'expr_race_wer_roar', label: '獸性咆哮 (Beastly Roar)', category: '狼人專屬', intensity: 1.0, cues: 'jaw wide open, vocal cords strained, face mid-transition.', requirements: { race: ['werewolf'] } },
    { id: 'expr_race_wer_lone', label: '孤狼遺世 (Lone Wolf Solitude)', category: '狼人專屬', intensity: 0.4, cues: 'solemn and lonely look, distance in the yellow eyes.', requirements: { race: ['werewolf'] } },

    // --- 女武神表情 (Valkyrie) ---
    { id: 'expr_race_val_hero', label: '英靈勇氣 (Heroic Bravery)', category: '戰神專屬', intensity: 0.5, cues: 'steadfast and heroic gaze, slight confident smile.', requirements: { race: ['valkyrie'] } },
    { id: 'expr_race_val_stern', label: '戰場嚴酷 (Battlefield Stern)', category: '戰神專屬', intensity: 0.6, cues: 'unyielding and serious face, covered in a bit of dust/light.', requirements: { race: ['valkyrie'] } },
    { id: 'expr_race_val_sacred', label: '聖光之吻 (Sacred Glow)', category: '戰神專屬', intensity: 0.8, cues: 'eyes glowing with pure white light, skin luminous.', requirements: { race: ['valkyrie'] } },
    { id: 'expr_race_val_mercy', label: '戰神慈悲 (God of War Mercy)', category: '戰神專屬', intensity: 0.4, cues: 'soft saddened look while guiding a soul, empathetic eyes.', requirements: { race: ['valkyrie'] } },
    { id: 'expr_race_val_wrath', label: '神域之怒 (Divine Wrath)', category: '戰神專屬', intensity: 1.0, cues: 'eyes crackling with lightning, an expression of total judgment.', requirements: { race: ['valkyrie'] } },

    // --- 獸耳族表情 (Beastkin Cat) ---
    { id: 'expr_race_bcat_pounce', label: '獵物鎖定 (Target Locked)', category: '獸領專屬', intensity: 0.8, cues: 'pupils wide, focused stare, ears pointing forward sharply.', requirements: { race: ['beastkin_cat'] } },
    { id: 'expr_race_bcat_purr', label: '呼嚕喜悅 (Purring Joy)', category: '獸領專屬', intensity: 0.4, cues: 'gentle happy smile, squinting eyes, ears slightly relaxed.', requirements: { race: ['beastkin_cat'] } },
    { id: 'expr_race_bcat_his', label: '野性警告 (Feral Warning)', category: '獸領專屬', intensity: 0.9, cues: 'showing fangs, eyes narrowed to slits, ears pulled back.', requirements: { race: ['beastkin_cat'] } },
    { id: 'expr_race_bcat_cur', label: '好奇探究 (Playful Inquiry)', category: '獸領專屬', intensity: 0.5, cues: 'head tilted, eyes wide and wandering around.', requirements: { race: ['beastkin_cat'] } },
    { id: 'expr_race_bcat_shy', label: '害羞躲閃 (Shy Avoidance)', category: '獸領專屬', intensity: 0.3, cues: 'blushing, looking away while touching the animal ears.', requirements: { race: ['beastkin_cat'] } },

    // --- 狐狸精表情 (Kitsune) ---
    { id: 'expr_race_kit_smirk', label: '狐狸壞笑 (Kitsune Smirk)', category: '靈狐專屬', intensity: 0.6, cues: 'knowing and slightly arrogant smile, slanted foxy eyes.', requirements: { race: ['kitsune'] } },
    { id: 'expr_race_kit_mystic', label: '玄法開悟 (Mystic Insight)', category: '靈狐專屬', intensity: 0.7, cues: 'eyes glowing with golden light, tattoos appearing on the face.', requirements: { race: ['kitsune'] } },
    { id: 'expr_race_kit_seduce', label: '九尾魅惑 (Tail Seduction)', category: '靈狐專屬', intensity: 0.8, cues: 'half-lidded heavy eyes, beckoning and alluring look.', requirements: { race: ['kitsune'] } },
    { id: 'expr_race_kit_rage', label: '野狐之怒 (Wild Fox Rage)', category: '靈狐專屬', intensity: 0.9, cues: 'eyes reflecting blue foxfire, jaw set in anger.', requirements: { race: ['kitsune'] } },
    { id: 'expr_race_kit_calm', label: '古森寧靜 (Forest Serenity)', category: '靈狐專屬', intensity: 0.4, cues: 'peaceful and elegant gaze, very calm and composed.', requirements: { race: ['kitsune'] } },

    // --- 美杜莎表情 (Medusa) ---
    { id: 'expr_race_med_deadly', label: '致命蛇眸 (Deadly Serpent Eyes)', category: '蛇髮專屬', intensity: 1.0, cues: 'glowing green irises, vertical pupils, the gaze that turns to stone.', requirements: { race: ['medusa'] } },
    { id: 'expr_race_med_hiss', label: '髮際嘶鳴 (Hair Hissing)', category: '蛇髮專屬', intensity: 0.7, cues: 'face calm but the snake-hair all rearing up and hissing in unison.', requirements: { race: ['medusa'] } },
    { id: 'expr_race_med_cruel', label: '絕代殘忍 (Timeless Cruelty)', category: '蛇髮專屬', intensity: 0.6, cues: 'a beautiful face marred by a look of ancient, cold hatred.', requirements: { race: ['medusa'] } },
    { id: 'expr_race_med_lonely', label: '石林孤寂 (Petrified Solitude)', category: '蛇髮專屬', intensity: 0.4, cues: 'looking at a stone statue of a friend with immense sorrow.', requirements: { race: ['medusa'] } },
    { id: 'expr_race_med_venom', label: '毒腺顫動 (Venomous Quiver)', category: '蛇髮專屬', intensity: 0.8, cues: 'lips parted to show fangs, corner of the eye twitching with rage.', requirements: { race: ['medusa'] } },

    // --- 哈比表情 (Harpy) ---
    { id: 'expr_race_har_pred', label: '猛禽俯瞰 (Raptor Gaze)', category: '鳥妖專屬', intensity: 0.9, cues: 'sharp eyes with narrow pupils, head tilted like a hawk.', requirements: { race: ['harpy'] } },
    { id: 'expr_race_har_sing', label: '誘人之歌 (Alluring Song)', category: '鳥妖專屬', intensity: 0.6, cues: 'mouth open in a beautiful but unsettling vocalization.', requirements: { race: ['harpy'] } },
    { id: 'expr_race_har_wild', label: '荒野狂怒 (Wildland Fury)', category: '鳥妖專屬', intensity: 1.0, cues: 'screeching, eyes wide, feathers around the neck ruffled.', requirements: { race: ['harpy'] } },
    { id: 'expr_race_har_calm', label: '雲巔寧靜 (Cloud-Peak Calm)', category: '鳥妖專屬', intensity: 0.3, cues: 'squinting against the high-altitude sun, looking at the distance.', requirements: { race: ['harpy'] } },
    { id: 'expr_race_har_clever', label: '狡黠鳥眼 (Clever Bird-Eye)', category: '鳥妖專屬', intensity: 0.5, cues: 'one eye peering curiously at a shiny object, head twitching.', requirements: { race: ['harpy'] } },

    // --- 不死族表情 (Undead/Skeleton/Lich) ---
    { id: 'expr_race_und_fire', label: '靈魂之火 (Soul Fire)', category: '不死專屬', intensity: 0.9, cues: 'empty sockets burning with intense blue/green arcane fire.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },
    { id: 'expr_race_und_cold', label: '墳塚冷冽 (Grave Cold)', category: '不死專屬', intensity: 0.6, cues: 'completely frozen face, frosted features, no life whatsoever.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },
    { id: 'expr_race_und_laugh', label: '枯骨乾笑 (Rattling Laugh)', category: '不死專屬', intensity: 0.8, cues: 'jaw moving in a silent or clicking laugh, eyes glowing bright.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },
    { id: 'expr_race_und_ancient', label: '千年疲竭 (Aeons of Weariness)', category: '不死專屬', intensity: 0.4, cues: 'a look of being tired of immortality, heavy soul-light.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },
    { id: 'expr_race_und_command', label: '霸權指令 (Dominion Command)', category: '不死專屬', intensity: 1.0, cues: 'all-consuming glow from the eyes, an aura of absolute orders.', requirements: { race: ['skeleton', 'lich', 'undead_race'] } },

    // --- 幽靈表情 (Ghost) ---
    { id: 'expr_race_gho_hollow', label: '虛空視界 (Hollow Vision)', category: '幽魂專屬', intensity: 0.5, cues: 'blank white eyes without pupils, seeing the spirit world.', requirements: { race: ['ghost'] } },
    { id: 'expr_race_gho_mourn', label: '永恆哀悼 (Eternal Mourning)', category: '幽魂專屬', intensity: 0.7, cues: 'translucent tears, features distorted by centuries of grief.', requirements: { race: ['ghost'] } },
    { id: 'expr_race_gho_malev', label: '惡靈現世 (Malevolent Manifest)', category: '幽魂專屬', intensity: 0.9, cues: 'face turning into a twisted shadowy mask of pure hate.', requirements: { race: ['ghost'] } },
    { id: 'expr_race_gho_fading', label: '漸弱存在 (Fading Presence)', category: '幽魂專屬', intensity: 0.3, cues: 'features becoming patchy and transparent, a look of letting go.', requirements: { race: ['ghost'] } },
    { id: 'expr_race_gho_whisper', label: '靈魂低語 (Soul Whisper)', category: '幽魂專屬', intensity: 0.6, cues: 'mouth moving without sound, eyes fixed on the viewer\'s soul.', requirements: { race: ['ghost'] } },

    // --- 蜘蛛精表情 (Arachne) ---
    { id: 'expr_race_ara_pred', label: '蟄伏掠食 (Dormant Predator)', category: '織命專屬', intensity: 0.8, cues: 'unblinking human eyes, spider-like clicking of the jaw, heavy focus.', requirements: { race: ['arachne'] } },
    { id: 'expr_race_ara_weave', label: '織命快感 (Weaving Ecstasy)', category: '織命專屬', intensity: 0.6, cues: 'slight manic smile, eyes tracking multiple threads of light simultaneously.', requirements: { race: ['arachne'] } },
    { id: 'expr_race_ara_cave', label: '深穴幽閉 (Cave Isolation)', category: '織命專屬', intensity: 0.4, cues: 'dilated pupils adapted to darkness, pale and sensitive features.', requirements: { race: ['arachne'] } },
    { id: 'expr_race_ara_poison', label: '毒腺律動 (Venom Pulse)', category: '織命專屬', intensity: 0.9, cues: 'black veins appearing near the eyes, fangs slightly bared, dangerous glow.', requirements: { race: ['arachne'] } },
    { id: 'expr_race_ara_mother', label: '蛛群母性 (Brood Mother)', category: '織命專屬', intensity: 0.5, cues: 'protective and possessive gaze, eyes reflecting a thousand tiny lights.', requirements: { race: ['arachne'] } },

    // --- 半人馬表情 (Centaur) ---
    { id: 'expr_race_cen_wild', label: '原野狂氣 (Wildland Rush)', category: '荒野專屬', intensity: 0.9, cues: 'flared nostrils, wind-swept hair, eyes full of boundless freedom.', requirements: { race: ['centaur'] } },
    { id: 'expr_race_cen_noble', label: '高貴半人 (Noble Hybrid)', category: '荒野專屬', intensity: 0.5, cues: 'stoic and dignified expression, head held high with pride.', requirements: { race: ['centaur'] } },
    { id: 'expr_race_cen_calm', label: '森林沉思 (Autumn Ponder)', category: '荒野專屬', intensity: 0.3, cues: 'gentle relaxed eyes, mouth slightly upturned in peace.', requirements: { race: ['centaur'] } },
    { id: 'expr_race_cen_hunt', label: '追蹤獵眼 (Tracker Gaze)', category: '荒野專屬', intensity: 0.7, cues: 'sharp focused pupils, head tilted to catch every sound of the plains.', requirements: { race: ['centaur'] } },
    { id: 'expr_race_cen_battle', label: '戰爭踐踏 (Battle Stomp)', category: '荒野專屬', intensity: 1.0, cues: 'roaring with gritted teeth, eyes burning with tribal rage.', requirements: { race: ['centaur'] } },

    // --- 史萊姆表情 (Slime/Ooze) ---
    { id: 'expr_race_sli_vague', label: '模糊視覺 (Vague Perception)', category: '異型專屬', intensity: 0.4, cues: 'misty eyes with no pupils, features shifting like melting wax.', requirements: { race: ['slime', 'ooze'] } },
    { id: 'expr_race_sli_joy', label: '液體悅動 (Jelly Joy)', category: '異型專屬', intensity: 0.6, cues: 'wavy smile, face shimmering with internal bioluminescence.', requirements: { race: ['slime', 'ooze'] } },
    { id: 'expr_race_sli_curious', label: '流體好奇 (Fluid Curiosity)', category: '異型專屬', intensity: 0.5, cues: 'head melting to one side, eyes merging or splitting in wonder.', requirements: { race: ['slime', 'ooze'] } },
    { id: 'expr_race_sli_angry', label: '腐蝕怒意 (Corrosive Anger)', category: '異型專屬', intensity: 0.9, cues: 'face bubbling with rage, steam rising from the liquid skin.', requirements: { race: ['slime', 'ooze'] } },
    { id: 'expr_race_sli_hollow', label: '虛空核心 (Hollow Core)', category: '異型專屬', intensity: 0.7, cues: 'empty expression, eyes glowing from deep within the torso core.', requirements: { race: ['slime', 'ooze'] } },

    // --- 杜拉漢表情 (Dullahan/Headless) ---
    { id: 'expr_race_dul_dead', label: '死亡凝視 (Dead Stare)', category: '無頭專屬', intensity: 0.8, cues: 'the held head has glassy unblinking eyes, pale blue soul-fire leak.', requirements: { race: ['dullahan'] } },
    { id: 'expr_race_dul_laugh', label: '砍下之笑 (Severed Laugh)', category: '無頭專屬', intensity: 1.0, cues: 'the head is laughing maniacally while the body remains perfectly still.', requirements: { race: ['dullahan'] } },
    { id: 'expr_race_dul_pain', label: '永恆頸創 (Eternal Neck Ache)', category: '無頭專屬', intensity: 0.7, cues: 'face contorted in the memory of the original blow, eyes pleading.', requirements: { race: ['dullahan'] } },
    { id: 'expr_race_dul_calm', label: '冷寂守夜 (Silent Watcher)', category: '無頭專屬', intensity: 0.4, cues: 'a look of total peace on the severed face, eyes closed or half-lidded.', requirements: { race: ['dullahan'] } },
    { id: 'expr_race_dul_venge', label: '索命之眼 (Vengeful Eye)', category: '無頭專屬', intensity: 0.9, cues: 'intense red glow from the eyes of the head, tracking its next soul.', requirements: { race: ['dullahan'] } },

    // --- 樹人表情 (Dryad/Treant) ---
    { id: 'expr_race_dry_bloom', label: '春之綻放 (Spring Bloom)', category: '森心專屬', intensity: 0.5, cues: 'warm glowing green eyes, tiny flowers appearing on the cheeks.', requirements: { race: ['dryad', 'treant'] } },
    { id: 'expr_race_dry_bark', label: '枯木之毅 (Bark Resolve)', category: '森心專屬', intensity: 0.6, cues: 'skin texture becoming rough and bark-like, deep set unyielding eyes.', requirements: { race: ['dryad', 'treant'] } },
    { id: 'expr_race_dry_autumn', label: '落葉憂思 (Autumn Pensive)', category: '森心專屬', intensity: 0.4, cues: 'heavy eyelids, a look of preparing for the long winter sleep.', requirements: { race: ['dryad', 'treant'] } },
    { id: 'expr_race_dry_wrath', label: '自然天怒 (Nature\'s Wrath)', category: '森心專屬', intensity: 1.0, cues: 'eyes glowing with burning forest fire, branches on head thrashing.', requirements: { race: ['dryad', 'treant'] } },
    { id: 'expr_race_dry_deep', label: '土地深聯 (Deep Soil Connection)', category: '森心專屬', intensity: 0.3, cues: 'vacant but peaceful gaze directed at the earth, root-like veins.', requirements: { race: ['dryad', 'treant'] } },

    // --- 惡魔表情 (Demon/Devil) ---
    { id: 'expr_race_dem_malice', label: '深淵惡意 (Abyssal Malice)', category: '淵罪專屬', intensity: 0.9, cues: 'dilated red pupils, sharp predatory teeth slightly showing, cruel smile.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },
    { id: 'expr_race_dem_seduce', label: '魅惑之瞳 (Seductive Gaze)', category: '淵罪專屬', intensity: 0.6, cues: 'half-lidded heavy eyes, glowing with forbidden knowledge, attractive yet dangerous.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },
    { id: 'expr_race_dem_arrog', label: '魔王傲慢 (Overlord Haughtiness)', category: '淵罪專屬', intensity: 0.7, cues: 'chin raised, looking down with cold indifference at all life.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },
    { id: 'expr_race_dem_hunger', label: '靈魂飢渴 (Soul Hunger)', category: '淵罪專屬', intensity: 0.8, cues: 'eyes glowing bright purple or red, tongue licking lips, intense focus.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },
    { id: 'expr_race_dem_pain', label: '地獄囚徒 (Prisoner of Hell)', category: '淵罪專屬', intensity: 0.5, cues: 'brows furrowed in eternal inner fire, sweat on face, pained pride.', requirements: { race: ['demon_lord', 'incubus', 'devil'] } },

    // --- 兔耳族表情 (Lagomorph) ---
    { id: 'expr_race_lag_percep', label: '感官同步 (Sensory Sync)', category: '靈動專屬', intensity: 0.5, cues: 'ears straight up, nose twitching slightly, eyes wide and scanning.', requirements: { race: ['lagomorph'] } },
    { id: 'expr_race_lag_joy', label: '胡蘿蔔喜悅 (Carrot Bliss)', category: '靈動專屬', intensity: 0.6, cues: 'super cute happy eyes, cheeks puffed out, huge innocent smile.', requirements: { race: ['lagomorph'] } },
    { id: 'expr_race_lag_scared', label: '林間驚惶 (Sudden Startle)', category: '靈動專屬', intensity: 0.4, cues: 'ears flat against the head, pupils tiny, looking ready to bolt.', requirements: { race: ['lagomorph'] } },
    { id: 'expr_race_lag_sleepy', label: '軟萌打盹 (Fluffy Nap)', category: '靈動專屬', intensity: 0.3, cues: 'relaxed half-closed eyes, ears drooping to the sides, peaceful.', requirements: { race: ['lagomorph'] } },
    { id: 'expr_race_lag_wild', label: '野性直覺 (Primal Instinct)', category: '靈動專屬', intensity: 0.7, cues: 'focused feral gaze, ready for a high-speed sprint, intense energy.', requirements: { race: ['lagomorph'] } },

    // --- 鳳凰人表情 (Phoenix) ---
    { id: 'expr_race_pho_burn', label: '燃燒視界 (Burning Vision)', category: '神祉專屬', intensity: 0.9, cues: 'eyes looking like mini suns with fire inside, solar corona aura.', requirements: { race: ['phoenix_girl'] } },
    { id: 'expr_race_pho_serene', label: '灰燼安詳 (Ashen Serenity)', category: '神祉專屬', intensity: 0.4, cues: 'calm peaceful look before rebirth, features glowing softly.', requirements: { race: ['phoenix_girl'] } },
    { id: 'expr_race_pho_noble', label: '華貴神鳥 (Noble Avian)', category: '神祉專屬', intensity: 0.6, cues: 'regal profile, eyes sharp like a hawk, gold feather patterns on face.', requirements: { race: ['phoenix_girl'] } },
    { id: 'expr_race_pho_ecstasy', label: '火舞狂喜 (Flame Ecstasy)', category: '神祉專屬', intensity: 0.8, cues: 'wide joyous smile as the body turns to pure light and heat.', requirements: { race: ['phoenix_girl'] } },
    { id: 'expr_race_pho_temp', label: '餘溫憂鬱 (Lingering Heat)', category: '神祉專屬', intensity: 0.5, cues: 'soft glowing tears that turn to steam, a warm but sad gaze.', requirements: { race: ['phoenix_girl'] } },

    // --- 史芬克斯表情 (Sphinx) ---
    { id: 'expr_race_sph_enig', label: '謎團微笑 (Enigmatic Smirk)', category: '神祉專屬', intensity: 0.5, cues: 'knowing half-smile, eyes holding the wisdom of thousands of years.', requirements: { race: ['sphinx'] } },
    { id: 'expr_race_sph_stern', label: '守墓嚴厲 (Stern Guardian)', category: '神祉專屬', intensity: 0.8, cues: 'unblinking hard gaze, assessing the soul of the intruder.', requirements: { race: ['sphinx'] } },
    { id: 'expr_race_sph_divine', label: '神意顯現 (Divine Presence)', category: '神祉專屬', intensity: 0.6, cues: 'eyes glowing with golden Egyptian light, pupils like sand clocks.', requirements: { race: ['sphinx'] } },
    { id: 'expr_race_sph_yawn', label: '萬年之哈 (Millennial Yawn)', category: '神祉專屬', intensity: 0.3, cues: 'wide yawn revealing sharp lion teeth, showing centuries of boredom.', requirements: { race: ['sphinx'] } },
    { id: 'expr_race_sph_fury', label: '法老之怒 (Pharaoh\'s Wrath)', category: '神祉專屬', intensity: 1.0, cues: 'face contorted in divine rage, eyes spitting golden sand.', requirements: { race: ['sphinx'] } },

    // --- 水中精靈表情 (Undine/Water Spirit) ---
    { id: 'expr_race_und_trans', label: '透澈之心 (Transparent Heart)', category: '水靈專屬', intensity: 0.4, cues: 'calm blue eyes, skin showing water ripple patterns under light.', requirements: { race: ['undine'] } },
    { id: 'expr_race_und_sorrow', label: '深海憂傷 (Deep Sea Sorrow)', category: '水靈專屬', intensity: 0.6, cues: 'water-like tears and wet hair, a gaze as cold as the abyss.', requirements: { race: ['undine'] } },
    { id: 'expr_race_und_play', label: '噴泉靈動 (Playful Splash)', category: '水靈專屬', intensity: 0.5, cues: 'joyful bubbly expression, sparkling eyes like sunlight on water.', requirements: { race: ['undine'] } },
    { id: 'expr_race_und_storm', label: '暴雨將至 (Gathering Storm)', category: '水靈專屬', intensity: 0.9, cues: 'eyes turning dark navy, features sharpening with oceanic power.', requirements: { race: ['undine'] } },
    { id: 'expr_race_und_blank', label: '如水無垢 (Pure as Water)', category: '水靈專屬', intensity: 0.3, cues: 'blank but beautiful expression, no human emotions, pure elemental.', requirements: { race: ['undine'] } },

    // --- 戰鬥/狂想 (Intense) ---
    { id: 'expr_determination', label: '堅毅決絕 (Determined Resolve)', category: '戰鬥系', intensity: 0.7, cues: 'serious expression, locked jaw, focused gaze, unwavering brow', requirements: { job: ['knight', 'samurai', 'paladin'] } },
    { id: 'expr_focus', label: '專注鎖定 (Focused Target)', category: '戰鬥系', intensity: 0.6, cues: 'slight squint, intense pupil focus, calm but lethal breath', requirements: { job: ['archer', 'ranger', 'assassin_f', 'phantom_thief'] } },
    { id: 'expr_defiant', label: '蔑視傲慢 (Defiant Pride)', category: '戰鬥系', intensity: 0.8, cues: 'smirking one-sidedly, looking down, cold and arrogant pupils', requirements: { race: ['devil', 'succubus', 'lich', 'vampire'] } },

    // --- 神聖/慈悲 (Holy) ---
    { id: 'expr_holy_serenity', label: '聖潔安詳 (Holy Serenity)', category: '神聖系', intensity: 0.3, cues: 'peaceful serene smile, soft glowing eyes, divine calm', requirements: { race: ['angel', 'high_elf', 'elemental'] } },
    { id: 'expr_prayer', label: '祈禱閉目 (Prayer Close)', category: '神聖系', intensity: 0.4, cues: 'eyes closed peacefully, lips slightly moving in prayer, soft lighting on face', requirements: { job: ['high_priestess_f', 'paladin_f', 'cleric'] } },
    { id: 'expr_ascent', label: '神性昇華 (Divine Ascent)', category: '神聖系', intensity: 0.9, cues: 'vacant but divine glowing eyes, looking upwards, overwhelming power', requirements: { race: ['angel', 'seraph'], job: ['mage', 'cleric'] } },
    { id: 'expr_compassion', label: '慈悲憐憫 (Holy Compassion)', category: '神聖系', intensity: 0.5, cues: 'slight sad smile, soft brows, empathetic gaze', requirements: { race: ['angel', 'high_elf'] } },

    // --- 黑暗/邪惡 (Dark) ---
    { id: 'expr_evil_smirk', label: '邪魅冷笑 (Shadow Smirk)', category: '黑暗系', intensity: 0.7, cues: 'shadowed eyes, dangerous half-smile, cunning expression', requirements: { job: ['phantom_thief', 'warlock', 'succubus'] } },
    { id: 'expr_madness', label: '發狂混讓 (Madness Chaos)', category: '黑暗系', intensity: 1.0, cues: 'asymmetric facial strain, chaotic eyes, looking in different directions', requirements: { job: ['warlock', 'necromancer', 'berserker'] } },
    { id: 'expr_shadow_gaze', label: '幽冥空洞 (Shadow Gaze)', category: '黑暗系', intensity: 0.6, cues: 'empty black eyes, no emotion, ghostly pale features', requirements: { race: ['ghost', 'lich', 'undead_race'] } },
    { id: 'expr_corruption', label: '墮落痛苦 (Corruption Agony)', category: '黑暗系', intensity: 0.8, cues: 'veins showing around eyes, expression of struggling against darkness', requirements: { job: ['fallen_knight', 'warlock'] } },

    // --- 情緒/戲劇 (Drama) ---
    { id: 'expr_agony', label: '極度痛苦 (Extreme Agony)', category: '情緒系', intensity: 1.0, cues: 'face contorted in pain, eyes squeezed shut, screaming in silence' },
    { id: 'expr_despair', label: '絕望之境 (Deep Despair)', category: '情緒系', intensity: 0.9, cues: 'hollow eyes, single tear, mouth slightly agape, complete lost of hope' },
    { id: 'expr_mourning', label: '哀悼流淚 (Solemn Mourning)', category: '情緒系', intensity: 0.7, cues: 'tears streaming down cheeks, eyes red from crying, solemn sorrow' },
    { id: 'expr_melancholy', label: '憂慮思緒 (Melancholy Pensive)', category: '情緒系', intensity: 0.4, cues: 'looking out of a window with distant eyes, pensive and sad' },

    // --- 魅惑/神祕 (Mystery) ---
    { id: 'expr_seductive', label: '誘惑魅惑 (Seductive Allure)', category: '魅惑系', intensity: 0.8, cues: 'come-hither look, slightly parted lips, heavy eyelids, alluring gaze' },
    { id: 'expr_mysterious', label: '神祕莫測 (Mysterious Enigma)', category: '魅惑系', intensity: 0.6, cues: 'slight smirk behind a veil or hand, unreadable eyes' },
    { id: 'expr_playful', label: '玩味俏皮 (Playful Wink)', category: '魅惑系', intensity: 0.5, cues: 'winking, sticking tongue out slightly, mischievous spark in eyes' },
    { id: 'expr_elegant_smile', label: '優雅微笑 (Noble Smile)', category: '魅惑系', intensity: 0.4, cues: 'perfect social smile, noble and refined expression' },

    // --- 反應/驚訝 (Shock) ---
    { id: 'expr_shock', label: '驚愕震驚 (Shocking Surprise)', category: '反應系', intensity: 0.8, cues: 'eyes wide, pupils shrunk, mouth half open in surprise' },
    { id: 'expr_horror', label: '恐懼絕望 (Paralyzing Horror)', category: '反應系', intensity: 1.0, cues: 'trembling lips, wide terror-filled eyes, cold sweat beads' },
    { id: 'expr_inspiration', label: '啟發驚喜 (Bright Inspiration)', category: '反應系', intensity: 0.6, cues: 'eyes lighting up, joyful realization, bright expression' },

    // --- 意志/決心 (Resolve) ---
    { id: 'expr_resolve', label: '覺醒鬥志 (Awakened Resolve)', category: '意志系', intensity: 0.9, cues: 'burning intensity in eyes, glowing irises, commanding presence' },
    { id: 'expr_stoic', label: '冷酷無情 (Stoic Coldness)', category: '意志系', intensity: 0.5, cues: 'blank expression, frozen features, icy gaze' },
    { id: 'expr_tactical', label: '深謀遠慮 (Tactical Focus)', category: '意志系', intensity: 0.4, cues: 'narrowed eyes, evaluating the situation, cold intelligence' },
    { id: 'expr_alert', label: '警惕察覺 (Vigilant Alert)', category: '意志系', intensity: 0.6, cues: 'ears twitching (if applicable), eyes scanning, tensed facial nerves' },

    // --- 獸性 (Feral) ---
    { id: 'expr_predatory', label: '掠食核心 (Predatory Instinct)', category: '獸性系', intensity: 0.8, cues: 'slit pupils, low growl expression, hunting focus' },
    { id: 'expr_feral_growl', label: '野性咆哮 (Primal Snarl)', category: '獸性系', intensity: 1.0, cues: 'baring fangs, nose wrinkled in snarl, primal rage' },
    { id: 'expr_instinct', label: '本能直覺 (Wild Instinct)', category: '獸性系', intensity: 0.7, cues: 'dilated pupils, reacting to sound, wild and untamed look' },

    // --- 通用/細節 (Universal) ---
    { id: 'expr_calm', label: '絕對平靜 (Absolute Stillness)', category: '通用系', intensity: 0.1, cues: 'relaxed neutral face, normal breathing, centered focus' },
    { id: 'expr_soft_smile', label: '溫柔微光 (Gentle Whisper Smile)', category: '通用系', intensity: 0.3, cues: 'warm kind eyes, gentle pleasant smile, soft expression' },
    { id: 'expr_pondering', label: '深邃沉思 (Pondering Depth)', category: '通用系', intensity: 0.2, cues: 'looking slightly away, hand on chin, thoughtful brow, wandering thoughts' },
    { id: 'expr_noble', label: '高貴傲然 (Noble Dignity)', category: '通用系', intensity: 0.4, cues: 'upturned chin, dignified expression, looking slightly down, regal aura' },
    { id: 'expr_distant', label: '縹緲夢境 (Dreamy Distance)', category: '通用系', intensity: 0.5, cues: 'dreamy look, out of focus eyes, ethereal and supernatural, hauntingly beautiful' },
    { id: 'expr_indifferent', label: '淡然處世 (Indifferent Serenity)', category: '通用系', intensity: 0.2, cues: 'calm and unbothered expression, neutral eyes, slight sense of detachment' },
    { id: 'expr_vigilant', label: '警覺警戒 (Vigilant Alertness)', category: '通用系', intensity: 0.6, cues: 'sharp focused eyes scanning surroundings, tensed facial features, ready for action' },
    { id: 'expr_heroic_fatigue', label: '英雄疲憊 (Heroic Fatigue)', category: '通用系', intensity: 0.5, cues: 'slightly heavy eyelids, slow breathing, look of a long journey or battle finished' },
    { id: 'expr_sudden_reve', label: '驚喜啟示 (Sudden Revelation)', category: '通用系', intensity: 0.6, cues: 'eyes widening with realization, mouth slightly open, bright sparks in eyes' },
    { id: 'expr_pensive_mel', label: '憂鬱思緒 (Pensive Melancholy)', category: '通用系', intensity: 0.4, cues: 'heavy pensive look, downcast eyes, aura of gentle sadness' },
    { id: 'expr_curious_perp', label: '疑惑不解 (Curious Perplexity)', category: '通用系', intensity: 0.3, cues: 'tilted head, one brow raised, searching for an answer' },
    { id: 'expr_deter_resolve', label: '堅定決心 (Determined Resolve)', category: '通用系', intensity: 0.7, cues: 'locked jaw, intense unwavering gaze, aura of inner strength' },
    { id: 'expr_playful_mis', label: '戲謔玩味 (Playful Mischief)', category: '通用系', intensity: 0.5, cues: 'one-sided smirk, mischievous spark in eyes, potentially winking' },
    { id: 'expr_icy_stoic', label: '冷酷無情 (Icy Stoicism)', category: '通用系', intensity: 0.6, cues: 'frozen features, cold unreadable eyes, absolute lack of emotion' },
    { id: 'expr_warm_affec', label: '溫暖愛意 (Warm Affection)', category: '通用系', intensity: 0.5, cues: 'soft glowing eyes, sincere and loving smile, radiating kindness' },
    { id: 'expr_lost_dreams', label: '迷茫尋覓 (Lost in Dreams)', category: '通用系', intensity: 0.4, cues: 'unfocused wandering gaze, expression of searching for something lost' },
    { id: 'expr_restrained_fury', label: '憤怒壓抑 (Restrained Fury)', category: '通用系', intensity: 0.8, cues: 'tightened mouth, burning glare, visible veins on forehead' },
    { id: 'expr_solemn_mourn', label: '悲痛哀悼 (Solemn Mourning)', category: '通用系', intensity: 0.7, cues: 'tears in eyes, somber and heavy facial features, deep mourning' },
    { id: 'expr_haughty_dis', label: '傲慢蔑視 (Haughty Disdain)', category: '通用系', intensity: 0.6, cues: 'looking down the nose, arrogant smirk, eyes full of contempt' },
    { id: 'expr_radiant_joy', label: '狂喜綻放 (Radiant Joy)', category: '通用系', intensity: 0.9, cues: 'bright wide smile, laughing eyes, overwhelming happiness' },
    { id: 'expr_enigmatic', label: '神祕莫測 (Enigmatic Allure)', category: '通用系', intensity: 0.6, cues: 'half-smile behind a shadow, hypnotic and unreadable eyes' },
];
export const FANTASY_SCENES_V4: ScenePresetV8[] = [
    // --- 天堂/神域 (Heaven/Divine) ---
    { id: 'scene_celestial_throne', labelZh: '天界王座 (Celestial Throne)', category: '神域', environment: 'infinite floor of polished white marble reflecting a galaxy sky, golden pillars stretching into infinity, floating silk banners.', lightingRig: 'divine radiant white light, golden sun rays, prismatic lens flares, soft dream-like bloom.', atmosphere: 'divine, infinite, holy' },
    { id: 'scene_glass_cathedral', labelZh: '雲端琉璃大聖堂 (Cloud Cathedral)', category: '神域', environment: 'soaring gothic architecture made of translucent stained glass, floating high above the clouds, prismatic refractions.', lightingRig: 'kaleidoscopic sunlight filtering through colored glass, volumetric light beams, ethereal glow.', atmosphere: 'transcendental, bright, sacred' },
    { id: 'scene_golden_oasis', labelZh: '神域黃金綠洲 (Golden Oasis)', category: '神域', environment: 'desert oasis with liquid gold water, white palm trees, levitating sandstone structures.', lightingRig: 'blinding desert sun, golden water reflections, high contrast.', atmosphere: 'mirage-like, opulent, mythic' },

    // --- 黑暗/墓地 (Dark/Graveyard) ---
    { id: 'scene_lich_graveyard', labelZh: '巫妖墓園 (Lich Graveyard)', category: '黑暗', environment: 'fog-shrouded cemetery with twisted obsidian tombstones, skeletal trees, glowing violet ground runes.', lightingRig: 'pale cold moonlight, violet ground glow, flickering ghost fire.', atmosphere: 'ominous, chilling, supernatural' },
    { id: 'scene_obsidian_ravine', labelZh: '黑曜石深淵 (Obsidian Ravine)', category: '黑暗', environment: 'deep dark ravine, jagged black crystal walls, swirling purple mist.', lightingRig: 'eerie magenta ambient light, sharp rim lighting from hidden sources, pitch black shadows.', atmosphere: 'dark fantasy, abyssal' },
    { id: 'scene_fallen_ruins', labelZh: '墮落天使廢墟 (Fallen Ruins)', category: '黑暗', environment: 'shattered celestial architecture on a scorched black earth, broken white wings scattered, weeping statues.', lightingRig: 'blood-red sunset, long dramatic shadows, embers falling from the sky.', atmosphere: 'tragic, desolate, epic' },
    { id: 'scene_shadow_citadel', labelZh: '幽影古堡 (Shadow Citadel)', category: '黑暗', environment: 'gothic castle interior, massive obsidian throne, tattered black banners, floating candles with black flames.', lightingRig: 'dim flickering candlelight, moonlight through high narrow windows, deep chiaroscuro.', atmosphere: 'majestic, dark, mysterious' },

    // --- 自然/森林 (Nature/Forest) ---
    { id: 'scene_world_tree', labelZh: '古老世界之樹 (World Tree)', category: '自然', environment: 'massive ancient tree trunk stretching to infinity, giant roots forming walkways, glowing sap, elder runes.', lightingRig: 'dappled sunlight through emerald leaves, soft golden bloom, bioluminescent sap glow.', atmosphere: 'primordial, majestic, peaceful' },
    { id: 'scene_silver_mist_forest', labelZh: '銀霧森林 (Silver Mist Forest)', category: '自然', environment: 'dense forest shrouded in thick silver fog, spectral white deer, ancient mossy stones.', lightingRig: 'diffused ethereal silver light, soft shadows, low visibility.', atmosphere: 'dreamlike, quiet, secretive' },
    { id: 'scene_bio_grove', labelZh: '螢光植物祕境 (Bioluminescent Grove)', category: '自然', environment: 'underground cavern filled with giant bioluminescent mushrooms and neon flora, crystalline lake.', lightingRig: 'neon teal and purple biological glow, shimmering water reflections, soft bokeh.', atmosphere: 'alien, vibrant, magical' },
    { id: 'scene_autumnal_valley', labelZh: '楓紅山谷 (Autumnal Valley)', category: '自然', environment: 'valley filled with vibrant red and orange maple trees, a rushing river, fallen leaves.', lightingRig: 'warm afternoon sun, golden hour backlighting, vibrant saturation.', atmosphere: 'nostalgic, beautiful, crisp' },

    // --- 海洋 (Ocean) ---
    { id: 'scene_coral_palace', labelZh: '深海珊瑚宮 (Coral Palace)', category: '海洋', environment: 'underwater palace made of glowing coral and giant shells, rays of light filtering from the surface.', lightingRig: 'caustic water light patterns (god rays), azure ambient light, soft bioluminescent highlights.', atmosphere: 'fluid, weightless, majestic' },
    { id: 'scene_ghost_ship', labelZh: '幽靈船甲板 (Ghost Ship)', category: '海洋', environment: 'tattered green sails, wood rotting in spectral green light, storm-tossed dark ocean, lightning.', lightingRig: 'flickering green lantern light, lightning flashes, high contrast dark values.', atmosphere: 'haunted, chaotic, epic' },
    { id: 'scene_azure_bay', labelZh: '熱帶蔚藍海灣 (Azure Bay)', category: '海洋', environment: 'white sand beach, crystal clear turquoise water, palm trees, distant tropical island.', lightingRig: 'bright tropical sun, refractive caustics on sea floor, vibrant colors.', atmosphere: 'refreshing, bright, adventurous' },

    // --- 戰場/廢墟 (Battlefield/Ruins) ---
    { id: 'scene_ash_battlefield', labelZh: '餘燼戰場 (Ash Battlefield)', category: '戰場', environment: 'endless field of gray ash, broken swords and flags, smoke rising from craters, distant orange fires.', lightingRig: 'dim hazy sky, flickering orange firelight from below, volumetric smoke.', atmosphere: 'somber, gritty, post-war' },
    { id: 'scene_dragon_bone', labelZh: '龍骨荒漠 (Dragon Bone Desert)', category: '戰場', environment: 'vast desert of white sand, colossal dragon skeletons half-buried, ancient sand-worn ruins.', lightingRig: 'blinding white desert sun, sharp harsh shadows, heat haze.', atmosphere: 'desolate, grand, archaic' },
    { id: 'scene_overgrown_temple', labelZh: '被遺忘的熱帶神廟 (Overgrown Temple)', category: '戰場', environment: 'stone temple ruins being reclaimed by giant jungle vines and moss, crumbling statues of forgotten gods.', lightingRig: 'spotted sunlight through canopy, rich green shadows, dust motes.', atmosphere: 'mysterious, ancient, humid' },

    // --- 城市/人間 (Urban/Human) ---
    { id: 'scene_medieval_market', labelZh: '中世紀市集 (Medieval Market)', category: '城市', environment: 'cobblestone street with wooden stalls, colourful fabrics, bread, fruit.', lightingRig: 'warm afternoon sunlight, shadows of hanging banners, vibrant market colors.', atmosphere: 'lively, detailed, cozy' },
    { id: 'scene_steampunk_workshop', labelZh: '蒸汽龐克工坊 (Steampunk Workshop)', category: '城市', environment: 'room filled with brass gears, copper pipes, leaking steam, clockwork mechanisms, blueprints.', lightingRig: 'warm orange lantern glow, flickering sparks from welding, industrial haze.', atmosphere: 'busy, industrial, intelligent' },
    { id: 'scene_royal_ballroom', labelZh: '皇家舞廳 (Royal Ballroom)', category: '城市', environment: 'grand ballroom with crystal chandeliers, polished gold floors, velvet drapes, elegant architecture.', lightingRig: 'brilliant warm chandelier light, soft reflective gold glow, luxury bloom.', atmosphere: 'opulent, formal, elegant' },
    { id: 'scene_sage_library', labelZh: '賢者圖書館 (Sage Library)', category: '城市', environment: 'massive library with towering bookshelf reaching the ceiling, floating ladders, ancient scrolls, candlelight.', lightingRig: 'concentrated warm light on desks, soft ambient light from high windows, dusty atmosphere.', atmosphere: 'scholarly, quiet, profound' },

    // --- 魔法/建築 (Magic/Architecture) ---
    { id: 'scene_arcane_observatory', labelZh: '奧術天文台 (Arcane Observatory)', category: '魔法', environment: 'chamber with a moving astronomical clock, rotating celestial orbs, charts made of light.', lightingRig: 'cosmic purple and blue starlight, glowing floor runes, focused spot lights.', atmosphere: 'intellectual, cosmic, magical' },
    { id: 'scene_floating_islands', labelZh: '浮空群島 (Floating Islands)', category: '魔法', environment: 'islands of rock floating in a sky of pink clouds, linked by floating chains or bridges.', lightingRig: 'sunset pastel sky, magic energy glow between islands, soft dream-like shadow.', atmosphere: 'fantastical, high altitude' },
    { id: 'scene_crystal_forge', labelZh: '晶體鍛造室 (Crystal Forge)', category: '魔法', environment: 'room carved from giant crystals, anvils glowing with white heat, liquid mana cooling pools.', lightingRig: 'brilliant refraction within crystals, intense white smithy light, teal ambient mana glow.', atmosphere: 'energetic, hardworking, sharp' },
    { id: 'scene_portal_sanctum', labelZh: '時空傳送門聖域 (Portal Sanctum)', category: '魔法', environment: 'chamber with a swirling multi-colored vortex portal, stone arches, spatial cracks.', lightingRig: 'unstable shifting light from the portal, chromatic aberration at edges, high energy.', atmosphere: 'unstable, epic, dimensional' },

    // --- 自然元素 (Nature Elements) ---
    { id: 'scene_volcanic_crater', labelZh: '熔岩火山口 (Volcanic Crater)', category: '元素', environment: 'jagged black volcanic rock, rivers of glowing lava, smoke, red sky.', lightingRig: 'intense red and orange glow from lava, bottom-lighting, harsh smoke diffusion.', atmosphere: 'dangerous, hot, intense' },
    { id: 'scene_frozen_tundra', labelZh: '永凍苔原 (Frozen Tundra)', category: '元素', environment: 'endless ice field, jagged ice spires, blizzard wind, aurora borealis.', lightingRig: 'cold blue ambient, aurora shimmering, glinting ice reflections.', atmosphere: 'vast, freezing, beautiful' },
    { id: 'scene_floating_waterfalls', labelZh: '浮空瀑布群 (Floating Waterfalls)', category: '元素', environment: 'waterfalls falling from sky islands into a misty abyss, double rainbows, lush greenery.', lightingRig: 'bright bright daylight, prismatic rainbow refractors, misty light scattering.', atmosphere: 'breathtaking, fresh, mythic' },
    { id: 'scene_sandy_dunes', labelZh: '烈日沙丘 (Sandy Dunes)', category: '元素', environment: 'infinite golden sand dunes, wind-blown ripples, a single dead tree.', lightingRig: 'harsh top-down desert sun, high contrast, heat distortion rays.', atmosphere: 'solitary, vast, quiet' },

    // --- 和風/東方 (Japan/Oriental) ---
    { id: 'scene_shrine_blossom', labelZh: '櫻之神殿 (Shrine Blossom)', category: '和風', environment: 'Shinto shrine with vermillion torii gates, blizzard of pink cherry blossoms, stone lanterns.', lightingRig: 'soft afternoon sun through pink petals, warm wooden reflections.', atmosphere: 'peaceful, traditional, nostalgic' },
    { id: 'scene_bamboo_moonlight', labelZh: '月光竹林 (Bamboo Moonlight)', category: '和風', environment: 'dense bamboo grove, narrow path, fireflies, silver moonlight.', lightingRig: 'cool silver moonlight filtering through leaves, tiny firefly sparks, high contrast.', atmosphere: 'quiet, secretive, oriental' },
    { id: 'scene_burning_temple', labelZh: '燃燒的禪寺 (Burning Temple)', category: '和風', environment: 'traditional Japanese temple on fire, falling burning roof tiles, embers in the wind.', lightingRig: 'dramatic orange and red firelight, ash fall, high contrast rim lighting.', atmosphere: 'tragic, intense, action-oriented' },

    // --- 通用史詩 (Universal Epic) ---
    { id: 'scene_edge_world', labelZh: '世界邊境/懸崖 (Edge of the World)', category: '史詩', environment: 'precarious cliff edge overlooking an infinite clouds or starfield.', lightingRig: 'backlit by distant sun or galaxy, silhouette focus, epic lens flare.', atmosphere: 'monumental, vast, lonely' },
    { id: 'scene_cosmic_nebula', labelZh: '星雲核心 (Cosmic Nebula)', category: '史詩', environment: 'floating within a massive colourful nebula, cosmic gas and dust, nearby dying stars.', lightingRig: 'omni-directional multi-colored nebular light, ethereal glow, cinematic contrast.', atmosphere: 'abstract, divine, cosmic' },
    { id: 'scene_wheat_field', labelZh: '黃金麥田 (Wheat Field)', category: '史詩', environment: 'endless field of golden wheat, wind blowing in ripples, a solitary oak tree under a vast sky.', lightingRig: 'golden hour sunset, warm glow over the entire landscape, flare.', atmosphere: 'peaceful, eternal, nostalgic' },
    { id: 'scene_snowy_pine', labelZh: '雪松森林 (Snowy Pine)', category: '史詩', environment: 'dense forest of pine trees covered in heavy snow, a small wooden cabin in the distance.', lightingRig: 'cool winter daylight, soft blue shadows, sparkling snow crystals.', atmosphere: 'cozy, silent, pure' },

    // --- 實拍/棚拍 (Studio/Professional) ---
    { id: 'scene_modern_studio', labelZh: '專業實景攝影棚 (Modern Studio)', category: '實拍', environment: 'professional photo studio, minimalist grey backdrop, high-end production gear visible in background, softbox reflections.', lightingRig: 'studio strobe lighting, multi-point key light, soft fill lights, professional rim lighting.', atmosphere: 'clean, commercial, ultra-detailed' },
    { id: 'scene_dark_editorial', labelZh: '暗調雜誌棚 (Dark Editorial)', category: '實拍', environment: 'dark textured studio walls, minimal furniture, luxury editorial aesthetic, fashion magazine set.', lightingRig: 'high-contrast dramatic editorial lighting, deep shadows, focused spotlight.', atmosphere: 'sophisticated, bold, high-fashion' },
    { id: 'scene_white_void', labelZh: '純白無盡空間 (White Void)', category: '實拍', environment: 'pure white infinity cove, seamless floor, high-key photography set.', lightingRig: 'bright high-key lighting, soft omnidirectional illumination, zero shadows.', atmosphere: 'pure, ethereal, artistic' },

    // --- 極端/環境 (Extreme/Environmental) ---
    { id: 'scene_lava_peaks', labelZh: '極地熔岩荒野 (Lava Peaks)', category: '極端', environment: 'jagged volcanic landscape at night, massive lava falls, sulfur clouds, scorched earth.', lightingRig: 'intense orange under-lighting from lava, cold blue starlight overhead, high contrast firelight.', atmosphere: 'dangerous, epic, catastrophic' },
    { id: 'scene_abyssal_abyss', labelZh: '無底深淵之門 (Abyssal Gate)', category: '極端', environment: 'infinite void, floating debris, spatial tears emitting light, cosmic horror architecture.', lightingRig: 'unstable prismatic light, void-black shadows, reality-bending light refraction.', atmosphere: 'terrifying, monumental, abstract' },
    { id: 'scene_crystal_storm', labelZh: '晶爆荒漠 (Crystal Storm)', category: '極端', environment: 'desert where sand is shards of glass, giant crystal pillars, static electrical storm.', lightingRig: 'blinding reflections from ground, purple lightning strikes, electric aura.', atmosphere: 'magical, harsh, sharp' },
    // --- 史詩背景擴充 (Epic Class Backgrounds) ---
    { id: 'scene_neon_night_alley', labelZh: '落雨霓虹巷 (Rainy Neon Alley)', category: '史詩', environment: 'cyberpunk-style narrow dark alley, puddles reflecting neon signs, steam rising from grates, futuristic wires.', lightingRig: 'vibrant pink and cyan neon lighting, harsh reflections on wet surfaces, dramatic volumetric fog.', atmosphere: 'gritty, futuristic, moody' },
    { id: 'scene_floating_monastery', labelZh: '雲巔懸空寺 (Floating Monastery)', category: '史詩', environment: 'ancient wooden temple perched on a tiny floating pillar above a sea of clouds, prayer flags fluttering.', lightingRig: 'infinite bright daylight, soft cloud scattering, high altitude blue tint.', atmosphere: 'divine, serene, isolated' },
    { id: 'scene_spectral_colosseum', labelZh: '英靈競技場 (Spectral Colosseum)', category: '史詩', environment: 'massive ancient arena filled with thousands of spectral translucent applauding ghosts, floating stone platforms.', lightingRig: 'ghostly teal ambient light, spotlight on the center, cinematic dust motes.', atmosphere: 'legendary, crowd-roaring, epic' },
    { id: 'scene_clockwork_gear_city', labelZh: '齒輪機械城 (Clockwork Gear City)', category: '史詩', environment: 'interior of a massive machine, giant rotating bronze gears, brass pipes, golden oil dripping.', lightingRig: 'warm orange industrial glow, flickering electric sparks, heavy metallic reflections.', atmosphere: 'complex, industrial, steam' },
    { id: 'scene_serpent_sea_storm', labelZh: '巨蛇怒濤 (Serpent Sea Storm)', category: '史詩', environment: 'stormy midnight ocean, massive waves, a colossal spectral sea serpent silhouette beneath the water.', lightingRig: 'lightning flashes illuminating the giant creature, dark navy blue ocean, high contrast splashing water.', atmosphere: 'terrifying, maritime, epic' },
    { id: 'scene_infinite_mirror_lake', labelZh: '無盡鏡像湖 (Infinite Mirror Lake)', category: '史詩', environment: 'perfectly still shallow lake reflecting the entire night sky, standing on water surface, boundless horizon.', lightingRig: 'double exposure effect, stars reflected below, thin silver rim lighting, cosmic glow.', atmosphere: 'silent, spiritual, boundless' },
    { id: 'scene_iron_citadel_throne', labelZh: '鐵甲王座廳 (Iron Citadel Hall)', category: '史詩', environment: 'cavernous hall made of black iron, hundreds of swords thrust into the walls, cold embers on floor.', lightingRig: 'flickering blue torchlight, harsh metallic reflections, silhouettes of heavy pillars.', atmosphere: 'martial, cold, dominant' },
    { id: 'scene_arcane_void_rift', labelZh: '奧術虛空裂隙 (Arcane Void Rift)', category: '史詩', environment: 'fragmented world floating in a purple void, crystalline structures, energy waterfalls flowing upwards.', lightingRig: 'unstable prismatic light, shifting shadow patterns, energetic bioluminescent glow.', atmosphere: 'chaos, magical, transcendent' },
];

export const FANTASY_LIGHTING_V4: FantasyLightingV4[] = [
    // --- Natural ---
    { id: 'v4_light_golden_hour', label: '黃金時刻 (Golden Hour)', description: '溫暖、柔和、側向光，營造史詩英雄感。', prompt: 'cinematic sunset golden hour lighting, extreme soft lateral light, warm amber glow on skin and metal, organic light scattering, [volumetric dust motes] and floating fine particulates, high dynamic range' },
    { id: 'v4_light_moonlight', label: '深藍月光 (Moonlight)', description: '清冷、高靈、神祕感，適合盜賊或法師。', prompt: 'piercing pale blue moonlight, aggressive chiaroscuro, cold silver highlights, intense rim lighting on silhouettes, deep shadows with subtle indigo tint, heavy atmospheric haze, silent and mysterious' },
    
    // --- Magical ---
    { id: 'v4_light_arcane_flare', label: '奧術閃爍 (Arcane Flare)', description: '紫色與藍色交織，強調魔法儀式感。', prompt: 'vibrant oscillating purple and blue magical glow, flickering arcane mana particles, mystical ambient occlusion with colored light bounce, energetic energy pulses, chromatic aberration at the frame edges' },
    { id: 'v4_light_hellfire', label: '煉獄火光 (Hellfire)', description: '強烈、橙紅、底部光源，戲劇衝突感強。', prompt: 'menacing flickering dark-red and burning orange firelight from below, harsh dramatic upward shadows, glowing ember particles, intense heat haze distortion, firelight spill with deep contrast' },
    
    // --- Professional ---
    { id: 'v4_light_rembrandt', label: '林布蘭光 (Rembrandt)', description: '經典肖像光，強調面部輪廓與立體感。', prompt: 'master-class Rembrandt lighting, precise 45-degree angle light, iconic triangle highlight on the cheek, moody and highly detailed, ultra-soft skin falloff, piercing catchlights in eyes, professional photography' },
    { id: 'v4_light_god_rays', label: '聖光降臨 (God Rays)', description: '天窗穿過雲層或建築的線條光束。', prompt: 'heavy volumetric sun beams, Tyndall effect, divine light rays piercing through dense atmosphere, clear light shafts with physical particulate scattering, majestic beam of light rising or descending' },
    // --- Phase 2 Enhancement ---
    { id: 'v4_light_phantom_bloom', label: '幻夢綻放 (Phantom Bloom)', description: '柔焦與光暈效果，營造夢幻仙境感。', prompt: 'dreamy ethereal soft focus, intense bloom effect on highlights, cinematic pastel color grading, soft diffuse glow, magical fairy-tale atmosphere, shimmering particles' }
];

export const FANTASY_COMPOSITION_V4: FantasyCompositionV4[] = [
    { id: 'v5_comp_85mm', label: '及致人像 (85mm f/1.2)', description: '職業攝影師的人像鏡頭，背景呈現如奶油般的奶油色虛化。', prompt: 'extreme bokeh portrait, 85mm lens, f/1.2 aperture, shallow depth of field, creamy background blur, tack sharp focus on eyes' },
    { id: 'v5_comp_35mm', label: '環境紀實 (35mm f/1.4)', description: '兼顧人物細節與場景的故事感。', prompt: 'environmental portrait, 35mm wide angle lens, sharp full body detail, showing context of the scene, deep perspective' },
    { id: 'v5_comp_low_angle', label: '英雄仰拍 (Cinematic Low Angle)', description: '展現角色的威嚴感與體型張力。', prompt: 'dramatic low-angle shot, camera looking up, subject appears powerful and monumental, epic scale' },
    { id: 'v5_comp_bird_eye', label: '神域俯瞰 (Bird\'s Eye View)', description: '從高空向下拍攝，強調角色在環境中的孤寂或渺小。', prompt: 'extreme high-angle bird\'s eye view, looking straight down, character centered in a vast environment, expansive scaled' },
    { id: 'v5_comp_dutch_tilt', label: '動態斜角 (Dutch Tilt)', description: '傾斜鏡頭，增加不安與動態感。', prompt: 'cinematic dutch tilt, slanted camera angle, dynamic energy, unconventional framing, storytelling perspective' },
    { id: 'v5_comp_macro', label: '細節特寫 (Macro Close-up)', description: '專注於裝飾品、符文或虹膜。', prompt: 'macro photography, extreme close-up on detailed accessory, shallow depth of field, sharp textures, high magnification' },
    // --- Phase 2 Photography Focus ---
    { id: 'v5_comp_backlit', label: '逆光唯美 (Backlit Rim)', description: '光線從背後射入，勾勒出金邊線條。', prompt: 'dramatic backlit silhouette, intense rim lighting, dreamy lens flare, glowing edges, high dynamic range' },
    { id: 'v5_comp_200mm', label: '長焦遠攝 (200mm Telephoto)', description: '背景壓縮感強，適合展現人物與背景的和諧。', prompt: '200mm telephoto lens compression, background appears closer, subject stands out perfectly, cinematic bokeh' },
    { id: 'v5_comp_wide_14mm', label: '震撼廣角 (14mm Ultra-Wide)', description: '極致的空間張力與透視感。', prompt: 'Shot with 14mm ultra-wide lens, extreme exaggerated perspective, barrel distortion, wide peripheral vision, everything looks vast and elongated at the lens edges, deep depth of field, ground and sky dominating the frame.' },
    { id: 'v5_comp_rule_of_thirds', label: '經典三分法 (Rule of Thirds)', description: '黃金攝影構圖，視覺平衡穩定。', prompt: 'rule of thirds composition, character off-center, balanced visual weight, aesthetically pleasing framing' }
];

export const FANTASY_CELESTIALS_V4: CelestialEventV4[] = [
    { id: 'none', label: '正常 (Standard)', description: '標準環境光照。', prompt: 'standard natural environmental lighting' },
    { id: 'blood_moon', label: '血月 (Blood Moon)', description: '深紅全球照明，光影呈現詭異紅色調。', prompt: 'Blood Moon: deep ominous crimson global illumination, celestial blood-red moon dominating the sky, shadows tinted with dark blood-red, supernatural atmosphere, [intense red rim lighting] on all objects, eerie atmospheric haze' },
    { id: 'aurora', label: '極光 (Aurora)', description: '繽紛極光閃爍，多色環境溢光。', prompt: 'Aurora Borealis: dynamic shifting curtains of emerald green, violet, and electric blue light in the pitch-black night sky, casting a soft multi-colored neon ambient light on the subjects skin and armor, neon specular reflections, atmospheric particles' },
    { id: 'eclipse', label: '日蝕 (Eclipse)', description: '黑太陽與日冕環，強烈邊緣光效。', prompt: 'Solar Eclipse: dramatic solar corona crown lighting, high-contrast diamond ring effect, eerie silver-blue ambient light, deep pitch-black shadows, [piercingly sharp edge highlights], Tyndall effect in the corona rays' },
    { id: 'starlight', label: '星雲 (Starlight)', description: '壯麗星系背景，紫色與青藍色微光。', prompt: 'Cosmic Starlight: hyper-dense nebulae and distant spiral galaxies visible in 8k detail, violet and teal ambient starlight, faint cosmic dust clouds, multidirectional soft starlight scattering, cinematic fantasy sky' }
];

export const FANTASY_ATMOS_V4 = {
    tyndall: [
        { id: 'off', label: '關閉 (Off)', description: '', prompt: '' },
        { id: 'low', label: '柔和 (Soft)', description: '輕微的光束感。', prompt: 'subtle cinematic light beams, faint dust motes illuminating in the light, soft atmospheric scattering and diffusion' },
        { id: 'high', label: '強烈 (Intense)', description: '明顯的丁達爾效應光柱。', prompt: 'strong volumetric God Rays piercing through the air, dramatic Tyndall effect with heavy light shafts, visible air particulates and micro-organic scattering, intense physical light volume' }
    ],
    mana: [
        { id: 'off', label: '關閉 (Off)', description: '', prompt: '' },
        { id: 'low', label: '微光 (Shimmer)', description: '空氣中漂浮少量魔法粒子。', prompt: 'sparse glowing mana crystals and magical dust suspended in the air, soft bokeh effects, gentle swirling motion around the subject' },
        { id: 'high', label: '充盈 (Flooding)', description: '環境中充滿跳動的能量微粒。', prompt: 'dense flooding of magical embers and bioluminescent spores, intense energy falloff, swirling mana ley-lines, pulsing magical radiation, interactive light trails with long exposure effect, 8k particle fidelity' }
    ]
};

export const FANTASY_MAGIC_CIRCLES_V4 = [
    { id: 'none', label: '不啟用 (Disabled)', description: '不使用魔法陣。', prompt: '' },
    // 【重裝武力系 (Might & Vigor)】
    { id: 'circle_swordsman', label: '劍印法陣 (Sword-Sigil Array)', description: '針對「劍士」設計，伴隨劍影與戰痕的鋼鐵法陣。', job: 'swordsman', prompt: 'radiant sword-sigil magic circle light-projection, glowing holographic metallic steel patterns, blue sparks reflecting on armour' },
    { id: 'circle_paladin', label: '日光十字陣 (Solar-Cross Seal)', description: '針對「聖騎士」設計，神聖幾何構造的十字光陣。', job: 'paladin', prompt: 'brilliant solar-cross magic circle projection, golden geometric halo of pure light, emitting soft heavenly rays and particles' },
    { id: 'circle_knight', label: '騎士勳章陣 (Knightly Crest)', description: '針對「騎士」設計，呈現家族勳章樣式的白銀法陣。', job: 'knight', prompt: 'glowing platinum knightly crest magic circle projection, elegant light-based shield-shaped sigil hovering above ground, soft white aura' },
    { id: 'circle_berserker', label: '狂暴符文陣 (Rage Runes)', description: '針對「狂戰士」設計，如同岩漿裂縫般的狂暴印記。', job: 'berserker', prompt: 'jagged dark-red arcane magic circle projection glowing with rage runes, molten energy light-projection leaking sparks and heat' },
    { id: 'circle_dragoon', label: '龍翼法陣 (Dragon-Wing Array)', description: '針對「龍騎士」設計，龍翼剪影構成的湛藍法陣。', job: 'dragoon', prompt: 'glowing azure dragon-wing silhouette magic circle projection, draconic light-runes pulsing with blue energy' },
    { id: 'circle_samurai', label: '禪圓法陣 (Zen Enso Circle)', description: '針對「東方武士」設計，潑墨感十足的圓相與落櫻。', job: 'samurai', prompt: 'glowing Zen Enso light-projection magic circle with floating bioluminescent cherry blossom petals, ink-style light ripples' },
    { id: 'circle_gladiator', label: '競技場法陣 (Arena Combat Circle)', description: '針對「角鬥士」設計，伴隨黃沙與金屬碰撞感的圓環法陣。', job: 'gladiator', prompt: 'ancient colosseum magic circle projected in golden light with tactical ring of glowing dust and sand swirling' },

    // 【奧秘法術系 (Arcane & Eldritch)】
    { id: 'circle_mage', label: '七芒星陣 (Seven-Pointed Star)', description: '針對「法師」設計，標準奧法架構的繁複幾何陣。', job: 'mage', prompt: 'complex holographic seven-pointed star magic circle projection, intense sapphire-blue mana light-projection, floating light-runes' },
    { id: 'circle_elementalist', label: '四元羅盤陣 (Four-Element Compass)', description: '針對「元素使」設計，融合水火風土四色的羅盤。', job: 'elementalist', prompt: 'four-element light-compass magic circle projection glowing with vibrant fire, ice, lightning and earth energy' },
    { id: 'circle_alchemist', label: '等價交換陣 (Transmutation Sigil)', description: '針對「鍊金術師」設計，嚴謹的鍊金術圓環架構。', job: 'alchemist', prompt: 'complex glowing emerald-green alchemy-array light-projection, geometric transmutation sigil with chemical light-steam' },
    { id: 'circle_necromancer', label: '靈魂五芒星陣 (Soul Pentagram)', description: '針對「死靈法師」設計，伴隨幽魂哀鳴的綠色印記。', job: 'necromancer', prompt: 'glowing sickly-green soul pentagram light-projection, swirling ghostly filaments and necrotic green light-smoke' },
    { id: 'circle_summoner', label: '星圖法陣 (Cosmic Star-Chart)', description: '針對「召喚師」設計，引導異界星辰之力的宏大法陣。', job: 'summoner', prompt: 'massive glowing star-chart light-projection, multidimensional light rift effects, floating petals of pure starlight' },
    { id: 'circle_spellblade', label: '能量劍陣 (Energy Blade Hex)', description: '針對「魔法劍士」設計，由數百枚魔力刃影組成的六角法陣。', job: 'spellblade', prompt: 'glowing hexagonal field of energy blades light-projection, crystalline sword patterns pulsing with blue fire' },
    { id: 'circle_warlock', label: '淵獄符文陣 (Infernal Sigil)', description: '針對「術士」設計，滿溢著惡魔火焰與幽影的五芒星。', job: 'warlock', prompt: 'burning dark-purple demonic star light-projection, infernal sigil leaking violet fel-fire and shadow light-smoke' },

    // 【影舞敏捷系 (Shadow & Precision)】
    { id: 'circle_assassin', label: '虛空煙霧環 (Void Smoke Rings)', description: '針對「刺客」設計，極度隱蔽、層層嵌套的虛空之環。', job: 'assassin', prompt: 'multiple concentric rings of glowing void-smoke light-projection, swirling pitch-black mist and purple light-sparks' },
    { id: 'circle_archer', label: '綠葉漩渦陣 (Verdant Leaf-Vortex)', description: '針對「弓箭手」設計，由落葉與林間氣旋構成的法陣。', job: 'archer', prompt: 'glowing verdant leaf-vortex light-projection, wind-blown emerald leaves and forest light-particles' },
    { id: 'circle_ninja', label: '水波紋文字陣 (Water-Ripple Kanji)', description: '針對「忍者」設計，腳下擴散的水波與禁咒字符。', job: 'ninja', prompt: 'glowing water-ripple light-projection with ancient kanji symbols, bioluminescent blue light on dark water surface' },
    { id: 'circle_ranger', label: '獸足追蹤陣 (Animal-Track Circle)', description: '針對「遊俠」設計，顯示獵物蹤跡與自然氣息的印記。', job: 'ranger', prompt: 'glowing green animal-track light-projection hovering above muddy ground, patterns of claws and leaves' },
    { id: 'circle_bounty_hunter', label: '目標鎖定陣 (Target-Reticle Grid)', description: '針對「賞金獵人」設計，機械掃描與雷達格點構成。', job: 'bounty_hunter', prompt: 'glowing red target-reticle light-projection, technological holographic grid scanning the environment, digital light noise' },
    { id: 'circle_phantom_thief', label: '玫瑰鑽石陣 (Rose & Diamond)', description: '針對「幻影怪盜」設計，極致華麗的撲克與花瓣印記。', job: 'phantom_thief', prompt: 'glowing red rose and diamond pattern light-projection, floating spectral playing cards made of pure light' },
    { id: 'circle_pirate_captain', label: '羅盤風信陣 (Compass-Rose Array)', description: '針對「海盜船長」設計，航海羅盤與浪花的聯動。', job: 'pirate_captain', prompt: 'glowing nautical compass-rose light-projection with splashing holographic ocean water effects' },

    // 【祈禱支援系 (Support & Divine)】
    { id: 'circle_nun', label: '彩繪玻璃陣 (Stained-Glass Mandala)', description: '針對「修女」設計，如大教堂窗櫺般莊嚴的光影法陣。', job: 'nun', prompt: 'brilliant holographic cathedral stained-glass pattern magic circle, holy mandala light-projection' },
    { id: 'circle_druid', label: '自然花開陣 (Floral Bloom Seal)', description: '針對「德魯伊」設計，萬物復甦、百花盛開的翠綠結界。', job: 'druid', prompt: 'magic circle of instant blooming light-based lush grass and flowers, floating spores and green light projection' },
    { id: 'circle_bard', label: '五線譜陣 (Music-Staff Circle)', description: '針對「吟遊詩人」設計，旋律化作實體音符的金色法陣。', job: 'bard', prompt: 'glowing golden music-staff light-projection, elegant musical note symbols swirling in a rhythmic loop' },
    { id: 'circle_cleric', label: '日冕法陣 (Sunburst Radiance)', description: '針對「聖職者」設計，慈悲之光向四周輻射的日環法陣。', job: 'cleric', prompt: 'radiant golden sunburst light-projection, geometric cross patterns within a solar halo' },
    { id: 'circle_monk', label: '陰陽太極陣 (Yin-Yang Taiji)', description: '針對「武鬥家」設計，平衡陰陽氣流流轉的武學法陣。', job: 'monk', prompt: 'glowing Yin-Yang Taiji diagram light-projection, pulsing with golden internal chi' },
    { id: 'circle_shrine_maiden', label: '鳥居影陣 (Torii Silhouette)', description: '針對「巫女」設計，重現神域入口門戶的神聖法陣。', job: 'shrine_maiden', prompt: 'glowing shinto gateway Torii silhouette light-projection, crimson light with spiritual paper charms (ofuda) floating' },
    { id: 'circle_exorcist', label: '所羅門封印 (Seal of Solomon)', description: '針對「驅碼師」設計，用於封印惡魔與邪祟的儀式法陣。', job: 'exorcist', prompt: 'glowing silver Seal of Solomon light-projection, complex ritual hexagram, holy white wards pulsing' }
];

export const FANTASY_COMPANIONS_V4 = [
    { id: 'none', label: '無隨從 (None)', description: '獨自展開冒險。', prompt: '' },
    // 【重裝武力系 (Might & Vigor)】
    { id: 'companion_swordsman', label: '獵犬靈 (Hunting Hound)', description: '「劍士」隨從，忠誠的幽靈獵犬，擅長追蹤與協奏。', job: 'swordsman', prompt: 'a clever spectral hunting hound spirit with glowing blue eyes, semi-transparent body, following faithfully' },
    { id: 'companion_paladin', label: '小修女天使 (Cherub Seraph)', description: '「聖騎士」隨從，拍打著羽翼、手持法典的微型天使。', job: 'paladin', prompt: 'a tiny floating cherub seraph familiar with pure white wings, holding a miniature divine bible, soft holy glow' },
    { id: 'companion_knight', label: '銀獅鷲 (Silver Gryphon)', description: '「騎士」隨從，象徵王室威嚴的幼年銀翼獅鷲。', job: 'knight', prompt: 'a soaring spectral silver gryphon familiar with magnificent feathers and sharp eagle beak, circling overhead' },
    { id: 'companion_berserker', label: '血狼靈 (Blood Wolf)', description: '「狂戰士」隨從，對血腥氣味敏感、雙眼血紅的嗜血狼靈。', job: 'berserker', prompt: 'a roaring spectral blood-red wolf familiar with ember-like eyes, body made of tattered crimson smoke' },
    { id: 'companion_dragoon', label: '幼龍 (Wyvern)', description: '「龍騎士」隨從，停留在肩頭、能感知龍語的小型飛龍。', job: 'dragoon', prompt: 'a small hyper-realistic azure wyvern familiar perched on the character\'s shoulder, detailed reptilian scales' },
    { id: 'companion_samurai', label: '靈鶴 (Spirit Cranes)', description: '「東方武士」隨從，象徵長壽與優雅、伴隨花瓣翩然起舞。', job: 'samurai', prompt: 'two graceful spectral spirit cranes with glowing white feathers, trailing bioluminescent cherry blossom petals' },
    { id: 'companion_gladiator', label: '沙獅靈 (Sand Lion)', description: '「角鬥士」隨從，由黃沙構成的威武獅靈。', job: 'gladiator', prompt: 'a majestic spectral sand-spirit lion made of shifting golden dust, glowing amber eyes, powerful build' },

    // 【奧祕法術系 (Arcane & Eldritch)】
    { id: 'companion_mage', label: '魔力球 (Mana Sphere)', description: '「法師」隨從，濃縮了高純度奧術能量的懸浮光球。', job: 'mage', prompt: 'a floating glowing arcane mana-sphere familiar, emitting rhythmic pulses of blue energy and runes' },
    { id: 'companion_elementalist', label: '鳳凰光精靈 (Phoenix Wisp)', description: '「元素使」隨從，不斷切換火、冰、雷態的微型不死鳥。', job: 'elementalist', prompt: 'a tiny phoenix wisp familiar made of ever-changing fire and frost energy, chirping with magical sounds' },
    { id: 'companion_alchemist', label: '發條小人 (Clockwork Homunculus)', description: '「鍊金術師」隨從，精密的發條與魔法瓶構成的迷你助手。', job: 'alchemist', prompt: 'a floating brass clockwork homunculus familiar with goggles, holding a tiny beaker, clicking mechanical sounds' },
    { id: 'companion_necromancer', label: '骸骨魂鴉 (Skeleton Raven)', description: '「死靈法師」隨從，由骨骼構成、眼冒幽火的靈界烏鴉。', job: 'necromancer', prompt: 'a spectral skeleton raven familiar with glowing green eyes, perched on a branch of bone, eerie aura' },
    { id: 'companion_summoner', label: '星界巨獸 (Celestial Beast)', description: '「召喚師」隨從，從裂縫中探出部分軀體的異界傳說生物。', job: 'summoner', prompt: 'a colossal spectral celestial beast appearing from a void rift behind, cosmic body made of nebulae' },
    { id: 'companion_spellblade', label: '附魔飛劍 (Enchanted Daggers)', description: '「魔法劍士」隨團，具有自我意識、保護主人的魔力短劍。', job: 'spellblade', prompt: 'three levitating enchanted crystalline daggers familiar, wreathed in blue magical fire, orbiting the user' },
    { id: 'companion_warlock', label: '小惡魔 (Imp)', description: '「術士」隨從，擅長嘲諷與負能量、不懷好意的虛空小鬼。', job: 'warlock', prompt: 'a floating mischievous purple imp familiar with tiny goat horns and bat wings, grinning with sharp teeth' },

    // 【影舞敏捷系 (Shadow & Precision)】
    { id: 'companion_assassin', label: '影蛇 (Shadow Serpent)', description: '「刺客」隨從，纏繞在手臂上、能瞬間使目標麻痺的黑影之蛇。', job: 'assassin', prompt: 'a spectral shadow serpent familiar coiled around arms, body made of liquid darkness, flickering viper tongue' },
    { id: 'companion_archer', label: '林間梟 (Forest Owl)', description: '「弓箭手」隨從，在暗處提供獵物情報、羽毛如針的梟。', job: 'archer', prompt: 'a wise spectral forest owl familiar with piercing yellow eyes, wearing tiny leather hood, silent flight' },
    { id: 'companion_ninja', label: '紙鶴靈 (Paper Cranes)', description: '「忍者」隨從，由符咒紙折成、能化作數千幻影的紙鶴。', job: 'ninja', prompt: 'dozens of flying glowing origami paper crane spirits, swirling like a storm of white light and paper' },
    { id: 'companion_ranger', label: '山貓伴侶 (Bobcat Companion)', description: '「遊俠」隨從，敏捷且狂野的山間獵捕專家。', job: 'ranger', prompt: 'a hyper-realistic bobcat familiar with tufted ears and spotted fur, prowling next to the character' },
    { id: 'companion_bounty_hunter', label: '機鷹 (Mechanical Hawk)', description: '「賞金獵人」隨從，配備高性能鏡頭與激光定位的黃銅鷹。', job: 'bounty_hunter', prompt: 'a mechanical brass hawk familiar with red lens eyes, metallic feathers, laser target sight projected' },
    { id: 'companion_phantom_thief', label: '幻影貓 (Phantom Cat)', description: '「幻影怪盜」隨從，神出鬼沒、能穿透牆壁的白色禮帽貓。', job: 'phantom_thief', prompt: 'a spectral white phantom cat familiar wearing a tiny black top-hat, eyes like sapphires, semi-transparent' },
    { id: 'companion_pirate_captain', label: '幽靈鸚鵡 (Ghost Parrot)', description: '「海盜船長」隨從，不僅會重複主人的話、還能偵測財寶。', job: 'pirate_captain', prompt: 'a spectral skeletal parrot familiar with a tiny eye-patch, perched on shoulder, glowing ghastly green' },

    // 【祈禱支援系 (Support & Divine)】
    { id: 'companion_nun', label: '聖潔使者 (Seraphim)', description: '「修女」隨從，降下聖潔祝福的高階靈體。', job: 'nun', prompt: 'a floating seraphim girl familiar with golden hair and six wings, radiating soft prismatic light' },
    { id: 'companion_druid', label: '小樹靈 (Treant Sapling)', description: '「德魯伊」隨從，蹦蹦跳跳的小樹苗、能感知大地的脈動。', job: 'druid', prompt: 'a small cute treant sapling familiar made of living wood and green leaves, big curious eyes' },
    { id: 'companion_bard', label: '音符精靈 (Note Wisps)', description: '「吟遊詩人」隨從，跳躍在空氣中的音階精靈。', job: 'bard', prompt: 'a flurry of glowing golden musical note wisps and a small songbird familiar, trailing stardust' },
    { id: 'companion_cleric', label: '聖光燈籠 (Holy Lantern)', description: '「聖職者」隨從，永不熄滅的提燈、能驅散一切邪惡黑暗。', job: 'cleric', prompt: 'a floating ornate gold holy lantern familiar, emitting an intense sacred white halo, driving away shadows' },
    { id: 'companion_monk', label: '氣之龍 (Chi Dragon)', description: '「武鬥家」隨從，由純粹精神力凝聚而成的東方遊龍。', job: 'monk', prompt: 'a spectral golden dragon-shaped chi spirit coiling the character gently, glowing with inner energy' },
    { id: 'companion_shrine_maiden', label: '白狐 (White Kitsune)', description: '「巫女」隨從，神之使者、具有九條靈動尾巴的神聖白狐。', job: 'shrine_maiden', prompt: 'a majestic spectral nine-tailed white kitsune spirit, glowing with spiritual red markings on fur' },
    { id: 'companion_exorcist', label: '驅魔鈴 (Exorcism Bells)', description: '「驅魔師」隨從，發出清脆鈴聲即可震懾惡魔的靈器。', job: 'exorcist', prompt: 'three floating ornate silver exorcism bells, vibrating with a high-pitched holy frequency, repelling mist' }
];

// Compatibility Aliases
export const FANTASY_RACES_V3 = FANTASY_RACES_V4;
export const FANTASY_JOBS_V3 = FANTASY_JOBS_V4;
export const FANTASY_POSES_V3 = FANTASY_POSES_V4;
export const FANTASY_EXPRESSIONS_V3 = FANTASY_EXPRESSIONS_V4;
