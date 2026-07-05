
import { HairstylePreset } from '../types/types';

// --- Hair Salon Presets ---

export const HAIRSTYLE_PRESETS = {
    female: [
        { id: 'keep-current', name: '保持原髮型 (僅染髮)', category: 'special', prompt: 'Keep the original hairstyle cut and length exactly as is.', params: {} },
        // --- 短髮 (Short) ---
        { id: 'pixie', name: '精靈短髮 (Pixie)', category: 'short', prompt: 'short pixie cut, textured layers on top, short sides and back, edgy and feminine', params: { length: 'very short', style: 'pixie' } },
        { id: 'bob', name: '經典鮑伯 (Classic Bob)', category: 'short', prompt: 'classic chin-length bob cut, blunt ends, sleek and smooth texture, modern chic look', params: { length: 'short', style: 'bob' } },
        { id: 'french-bob', name: '法式鮑伯 (French Bob)', category: 'short', prompt: 'french bob haircut with bangs, chin-length, slightly tousled and effortless texture', params: { length: 'short', style: 'french bob' } },
        { id: 'buzz-cut-f', name: '帥氣寸頭 (Buzz Cut)', category: 'short', prompt: 'feminine buzz cut, very short uniform length, highlighting facial features, bold and minimalist', params: { length: 'very short', style: 'buzz cut' } },
        { id: 'short-shaggy', name: '極短層次 (Short Shaggy)', category: 'short', prompt: 'short shaggy haircut, choppy layers, messy texture, voluminous top', params: { length: 'short', texture: 'shaggy' } },
        // --- 中長髮 (Medium) ---
        { id: 'lob', name: '鎖骨髮 (Lob)', category: 'medium', prompt: 'long bob haircut, shoulder-length, blunt or slightly layered ends, versatile and elegant', params: { length: 'medium', style: 'lob' } },
        { id: 'wolf-cut', name: '狼尾剪 (Wolf Cut)', category: 'medium', prompt: 'trendy wolf cut, heavy shaggy layers, disconnected ends, voluminous crown, edgy aesthetic', params: { length: 'medium', style: 'wolf cut', texture: 'shaggy' } },
        { id: 'mullet-f', name: '復古鯔魚頭 (Modern Mullet)', category: 'medium', prompt: 'modern mullet for women, short front and sides, long back, textured and edgy', params: { length: 'medium', style: 'mullet' } },
        { id: 'wool-curls', name: '羊毛捲 (Wool Curls)', category: 'medium', prompt: 'tight wooly curls, high volume, fluffy texture, retro and cute style', params: { length: 'medium', texture: 'tightly curled', volume: 80 } },
        { id: 'space-buns', name: '雙馬尾/雙丸子 (Space Buns)', category: 'medium', prompt: 'two high buns on each side of the head, playful and youthful, anime-inspired', params: { length: 'medium', style: 'space buns' } },
        // --- 長髮 (Long) ---
        { id: 'long-layers', name: '長層次 (Long Layers)', category: 'long', prompt: 'long layered haircut, cascading layers, face-framing strands, soft movement, voluminous texture', params: { length: 'long', texture: 'layered' } },
        { id: 'beach-waves', name: '海灘波浪 (Beach Waves)', category: 'long', prompt: 'long tousled beach waves, sea salt texture, relaxed and voluminous, bohemian vibe', params: { length: 'long', texture: 'wavy' } },
        { id: 'hime-cut', name: '公主切 (Hime Cut)', category: 'long', prompt: 'hime cut hairstyle, straight bangs, cheek-length sidelocks, long straight hair in back', params: { style: 'hime cut', length: 'long' } },
        { id: 'straight-sleek', name: '直順長髮 (Sleek Straight)', category: 'long', prompt: 'bone straight long hair, high shine, silk press finish, center part', params: { length: 'long', texture: 'straight', finish: 'sleek' } },
        { id: 'butterfly-cut', name: '蝴蝶剪 (Butterfly Cut)', category: 'long', prompt: 'butterfly haircut, short layers around face, long layers in back, maximum volume and bounce', params: { style: 'butterfly cut', volume: 'high' } },
        { id: 'glamorous-curls', name: '浪漫大波浪 (Glam Curls)', category: 'long', prompt: 'large voluminous glamorous curls, Hollywood red carpet style, high shine and bounce', params: { length: 'long', texture: 'large curls', volume: 70 } },
        { id: 'custom', name: '自訂描述...', category: 'special', prompt: '', params: {} }
    ],
    male: [
        { id: 'keep-current', name: '保持原髮型 (僅染髮)', category: 'special', prompt: 'Keep the original hairstyle cut and length exactly as is.', params: {} },
        // --- 短髮 (Short) ---
        { id: 'buzz-cut', name: '俐落寸頭 (Buzz Cut)', category: 'short', prompt: 'military buzz cut, very short uniform length, sharp hairline, masculine look', params: { length: 'very short' } },
        { id: 'textured-crop', name: '層次短髮 (Textured Crop)', category: 'short', prompt: 'short textured crop, messy top, faded sides, matte finish', params: { length: 'short', texture: 'messy' } },
        { id: 'crew-cut', name: '美式平頭 (Crew Cut)', category: 'short', prompt: 'classic crew cut, slightly longer on top, tapered sides, clean and professional', params: { length: 'short', style: 'crew cut' } },
        { id: 'caesar-cut', name: '凱薩剪 (Caesar Cut)', category: 'short', prompt: 'caesar haircut, short horizontal fringe, textured top, faded sides', params: { length: 'short', style: 'caesar cut' } },
        { id: 'short-mohawk', name: '莫霍克 (Short Mohawk)', category: 'short', prompt: 'short textured mohawk, spiked center, faded or shaved sides, edgy and bold', params: { length: 'short', style: 'mohawk' } },
        // --- 中長髮 (Medium) ---
        { id: 'pompadour', name: '龐畢度油頭 (Pompadour)', category: 'medium', prompt: 'classic pompadour hairstyle, high volume on top combed back, short sides, rockabilly style', params: { style: 'pompadour' } },
        { id: 'undercut', name: '側削上梳 (Undercut)', category: 'medium', prompt: 'undercut hairstyle, shaved sides, long hair on top slicked back, modern contrast', params: { style: 'undercut' } },
        { id: 'k-pop-comma', name: '韓系逗號瀏海 (Comma)', category: 'medium', prompt: 'Korean comma hairstyle, textured bangs curving inward, trendy k-pop look', params: { style: 'comma hair' } },
        { id: 'slicked-back', name: '後梳油頭 (Slicked Back)', category: 'medium', prompt: 'classic slicked back hair, wet look product, refined gentleman style', params: { style: 'slicked back' } },
        { id: 'two-block', name: '韓系六四分 (Two Block)', category: 'medium', prompt: 'Korean two block haircut, long top with 6/4 part, shaved or short sides and back', params: { style: 'two block', length: 'medium' } },
        // --- 長髮 (Long) ---
        { id: 'man-bun', name: '男士丸子頭 (Man Bun)', category: 'long', prompt: 'man bun hairstyle, hair tied back in a knot, shaved sides or full hair, hipster vibe', params: { style: 'bun' } },
        { id: 'mullet', name: '復古狼尾 (Modern Mullet)', category: 'long', prompt: 'modern mullet haircut, short textured top and sides, long hair at the nape, edgy fashion', params: { style: 'mullet' } },
        { id: 'long-flowing', name: '肩下長髮 (Long Flowing)', category: 'long', prompt: 'long flowing hair for men, shoulder length or longer, natural texture, masculine long hair', params: { length: 'long' } },
        { id: 'dreadlocks', name: '髒辮 (Dreadlocks)', category: 'long', prompt: 'thick dreadlocks hairstyle, textured and detailed, cultural and artistic look', params: { style: 'dreadlocks', length: 'long' } },
        { id: 'rockstar-curls', name: '搖滾長捲髮 (Rockstar Curls)', category: 'long', prompt: 'long messy curls for men, rockstar aesthetic, voluminous and textured', params: { length: 'long', texture: 'curly', volume: 60 } },
        { id: 'custom', name: '自訂描述...', category: 'special', prompt: '', params: {} }
    ]
};

export const MAKEUP_PRESETS = {
    female: [
        { id: 'daily-chic', name: '日常通勤 (Daily Chic)', keyword: 'natural everyday makeup, subtle enhancement' },
        { id: 'party-sparkle', name: '派對亮片 (Party Sparkle)', keyword: 'glittery party makeup, bold eyeliner' },
        { id: 'smokey-eyes', name: '煙燻妝 (Smokey Eyes)', keyword: 'dark smokey eye makeup, dramatic' },
        { id: 'no-makeup', name: '完全素顏 (No Makeup)', keyword: 'bare face, no makeup, clean skin' },
        { id: 'k-beauty-dewy', name: '韓系水光 (K-Beauty)', keyword: 'dewy skin, gradient lips, straight brows, korean style' },
        { id: 'haute-couture', name: '高訂秀場 (Haute Couture)', keyword: 'avant-garde fashion makeup, artistic, bold colors' },
        { id: 'vintage-red', name: '復古紅唇 (Vintage Red)', keyword: 'classic red lip, winged liner, matte skin' },
        { id: 'sun-kissed', name: '陽光曬傷妝 (Sun Kissed)', keyword: 'bronzed skin, heavy blush across nose, faux freckles' },
        { id: 'gothic-dark', name: '暗黑哥德 (Gothic)', keyword: 'gothic makeup, black lipstick, pale skin, heavy dark eyeshadow' },
        { id: 'soft-glam', name: '溫柔名媛 (Soft Glam)', keyword: 'soft glam makeup, neutral tones, glowing skin, elegant' }
    ],
    male: [
        { id: 'male-clean', name: '簡潔素肌 (Clean Minimalist)', keyword: 'natural male grooming, invisible makeup, clean skin, matte finish' },
        { id: 'male-sculpted', name: '硬朗修容 (Sculpted Contour)', keyword: 'defined masculine facial features, subtle contouring on jawline and cheekbones, high definition' },
        { id: 'male-k-idol', name: '韓系歐爸 (K-Pop Idol)', keyword: 'korean male idol makeup style, subtle eyeliner, natural tinted lip balm, soft skin' },
        { id: 'male-thick-brows', name: '英挺粗眉 (Bold Brows)', keyword: 'thick groomed eyebrows, focused on brow definition, masculine power look' },
        { id: 'male-bronzed', name: '陽光古銅 (Sunkissed Bronze)', keyword: 'natural tanned look, healthy bronze skin, vibrant complexion' }
    ]
};

export const BEARD_PRESETS = [
    { id: 'none', name: '無鬍鬚 (Clean Shaven)', prompt: 'clean shaven face, no facial hair, smooth skin' },
    { id: 'stubble', name: '極簡渣鬍 (Light Stubble)', prompt: 'light short stubble, masculine shadows on jawline, 3-day beard look' },
    { id: 'corporate', name: '專業職場鬍 (Corporate)', prompt: 'well-groomed short beard, trimmed and tidy, professional masculine style' },
    { id: 'vandyke', name: '凡戴克鬍 (Van Dyke)', prompt: 'vandyke beard style, disconnected mustache and goatee, artistic and refined' },
    { id: 'full-beard', name: '男士落腮鬍 (Full Beard)', prompt: 'thick full beard, well-defined edges, masculine and authoritative' }
];

export const GRADIENT_PLACEMENT_PATTERNS = [
    { value: 'roots-to-ends', label: '髮根至髮尾', prompt: 'soft ombré gradient transitioning from root color to ends' },
    { value: 'ends-only', label: '僅髮尾 (裙擺染)', prompt: 'dip-dye effect, color only on the tips of the hair' }
];

export const HIGHLIGHT_PATTERNS = [
    { value: 'face-framing', label: '輪廓挑染 (Face Framing)', prompt: 'money piece highlights, brightening strands around the face' },
    { value: 'overall-fine', label: '細緻挑染 (Babylights)', prompt: 'fine natural babylights woven throughout the hair' },
    { value: 'chunky-strands', label: '束狀挑染 (Chunky)', prompt: 'bold chunky 90s style highlights, distinct streaks' },
    { value: 'underlayer', label: '內層挑染 (耳圈染)', prompt: 'peekaboo highlights, hidden color layer underneath' },
    { value: 'balayage', label: '法式手刷染 (Balayage)', prompt: 'professional balayage technique, hand-painted natural sun-kissed look with soft transitions' },
    { value: 'airtouch', label: '羽毛手刷 (Airtouch)', prompt: 'airtouch technique, seamless blending, high-contrast but natural-looking highlights' }
];
