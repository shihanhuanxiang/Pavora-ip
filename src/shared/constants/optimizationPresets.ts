
// --- Optimization Presets ---

export const COMPOSITION_OPTIONS = [
    { value: 'default', label: '預設 (Default)', prompt: 'standard balanced composition' },
    { value: 'rule_of_thirds', label: '三分法 (Rule of Thirds)', prompt: 'composed using rule of thirds, subject placed at intersection point, dynamic framing' },
    { value: 'center', label: '居中 (Center)', prompt: 'perfectly symmetrical centered composition, subject in middle, stable framing' }
];

export const LIGHT_DIRECTION_OPTIONS = [
    { value: 'front', label: '順光 (Front)', prompt: 'soft front lighting, flattering even illumination, minimal shadows' },
    { value: 'side', label: '側光 (Side)', prompt: 'dramatic side lighting, split lighting effect, high contrast shadows revealing texture' },
    { value: 'back', label: '逆光 (Back)', prompt: 'rim lighting, backlight creating a halo effect, subject silhouette, atmospheric' },
    { value: 'top', label: '頂光 (Top)', prompt: 'overhead lighting, dramatic shadows under eyes and nose, moody cinematic look' }
];

export const LIGHT_STYLE_OPTIONS = [
    { value: 'soft', label: '柔光 (Soft)', prompt: 'soft diffused light, large light source, gentle shadow transitions, beauty lighting' },
    { value: 'hard', label: '硬光 (Hard)', prompt: 'hard direct light, small light source, sharp defined shadows, high contrast, sunny day look' },
    { value: 'natural', label: '自然光 (Natural)', prompt: 'organic natural daylight, window light look, realistic ambient lighting' },
    { value: 'studio', label: '棚燈 (Studio)', prompt: 'professional studio strobe lighting, controlled environment, commercial crisp look' }
];

export const FOCAL_LENGTH_OPTIONS = [
    { value: '24mm', label: '24mm (廣角)', prompt: 'shot on 24mm wide angle lens, expanded background, slight perspective distortion, immersive' },
    { value: '35mm', label: '35mm (人文)', prompt: 'shot on 35mm lens, natural documentary field of view, environmental context' },
    { value: '50mm', label: '50mm (標準)', prompt: 'shot on 50mm standard lens, human eye perspective, no distortion' },
    { value: '85mm', label: '85mm (人像)', prompt: 'shot on 85mm portrait lens, slight telephoto compression, flattering facial features' }
];

export const DEPTH_OF_FIELD_OPTIONS = [
    { value: 'shallow', label: '淺景深 (散景)', prompt: 'shallow depth of field, f/1.8 aperture, blurry background bokeh, subject isolation' },
    { value: 'medium', label: '中等景深', prompt: 'medium depth of field, f/5.6 aperture, subject sharp with slightly softened background' },
    { value: 'deep', label: '深景深 (清晰)', prompt: 'deep depth of field, f/11 aperture, everything in focus from foreground to background' }
];

export const RESOLUTION_OPTIONS = [
    { value: 'original', label: '原始大小' }, { value: '2K', label: '2K (升頻)' }, { value: '4K', label: '4K (升頻)' }
];
export const ASPECT_RATIO_OPTIONS = [
    { value: 'original', label: '原始比例' },
    { value: '1:1', label: '1:1 (正方形)' },
    { value: '3:4', label: '3:4 (人像)' },
    { value: '4:3', label: '4:3 (風景)' },
    { value: '9:16', label: '9:16 (手機)' },
    { value: '16:9', label: '16:9 (寬螢幕)' }
];
export const FORMAT_OPTIONS = ['JPG', 'PNG', 'WEBP'];
export const QUALITY_OPTIONS = [
    { id: 'enhance-details', label: '細節增強' }, 
    { id: 'color-correction', label: '色彩校正' }, 
    { id: 'denoise', label: '降噪' },
    { id: 'skin-texture', label: '皮膚微雕 (Skin)' },
    { id: 'fabric-fidelity', label: '布料重塑 (Fabric)' },
    { id: '8k-reconstruct', label: '8K 超清重構' },
    { id: 'rim-light', label: '輪廓光增強 (Rim)' },
    { id: 'catchlight', label: '眼神光注入 (Catch)' }
];

export const FILL_LIGHT_OPTIONS = [
    { value: 'none', label: '無 (None)' },
    { value: 'subtle', label: '微光補償 (Subtle)' },
    { value: 'balanced', label: '均衡補光 (Balanced)' },
    { value: 'high_key', label: '高調補光 (High-Key)' }
];

export const CATCHLIGHT_STYLE_OPTIONS = [
    { value: 'none', label: '無 (None)' },
    { value: 'natural', label: '自然點狀 (Natural)' },
    { value: 'ring', label: '環形光 (Ring)' },
    { value: 'softbox', label: '柔光箱 (Softbox)' }
];

export const FILM_STOCK_OPTIONS = [
    { value: 'none', label: '無 (None)' },
    { value: 'kodak_portra', label: 'Kodak Portra 400 (溫暖膚色)' },
    { value: 'fuji_pro', label: 'Fujifilm Pro 400H (清透綠調)' },
    { value: 'cinestill', label: 'CineStill 800T (電影感藍調)' },
    { value: 'leica_mono', label: 'Leica Monochrome (經典黑白)' },
    { value: 'agfa_vista', label: 'Agfa Vista 200 (高飽和復古)' }
];

export const COLOR_GRADING_OPTIONS = [
    { value: 'natural', label: '自然 (Natural)' },
    { value: 'vibrant', label: '鮮豔 (Vibrant)' },
    { value: 'muted', label: '高級灰 (Muted)' },
    { value: 'teal_orange', label: '青橙調 (Teal & Orange)' },
    { value: 'vintage', label: '復古 (Vintage)' }
];

export const TEXTURE_INTENSITY_OPTIONS = [
    { value: 'natural', label: '自然 (Natural)' },
    { value: 'high_def', label: '高畫質 (High-Def)' },
    { value: 'editorial', label: '雜誌質感 (Editorial)' }
];

export const MATERIAL_FOCUS_OPTIONS = [
    { value: 'none', label: '無特定' },
    { value: 'silk', label: '絲綢/緞面' },
    { value: 'leather', label: '皮革/漆皮' },
    { value: 'denim', label: '丹寧/粗糙' },
    { value: 'knit', label: '針織/羊毛' }
];
