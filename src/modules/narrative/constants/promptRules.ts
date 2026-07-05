export const ALLOWED_KEYWORDS_V2 = [
  "youthful energy", "playful", "candid", "spontaneous", "Gen Z aesthetic",
  "fresh dewy skin", "K-beauty glow", "iPhone snapshot", "TikTok generation",
  "bright peachy blush", "glossy wet-look lip", "translucent skin with shine",
  "casual everyday moment", "unposed natural", "in-the-moment caught",
  "Korean IG influencer style",
  "Japanese street snap aesthetic",
  "Y2K disposable camera feel",
  "harsh flash highlight",
  "overexposed bright tones", "saturated peachy hues",
  "iPhone candid photography", "selfie aesthetic",
  "spontaneous laugh frozen", "playful expression",
  "youthful 23-year-old vitality", "fresh-faced energy"
];

export const BANNED_KEYWORDS_V2 = [
  "sexy", "erotic", "sensual", "seductive", "NSFW", "XXX",
  "nude", "naked", "topless", "lingerie", "intimate apparel", "undergarment",
  "cleavage", "nipple", "underboob", "side boob", "areola", "breast exposed",
  "showing skin", "exposed body", "suggestive", "provocative",
  "arousing", "alluring", "tempting", "hot girl", "hot woman",
  "boudoir photography", "tease", "flirty", "pin-up"
];

export const SUBSTITUTION_TABLE_V2: Record<string, string> = {
  "cleavage": "elegant V-neckline, silk fabric drape",
  "thigh show": "high-leg slit detail, fluid drape",
  "leg show": "high-leg slit detail, fluid drape",
  "collarbone": "off-shoulder blouse, bare collarbone",
  "back": "low-back dress, sculpted shoulder line",
  "belly": "fitted crop with high-waist pant, midriff stripe",
  "see-through": "delicate chiffon layer with opaque underlay",
  "naked under robe": "freshly-bathed, post-shower steam, cotton robe",
  "bikini photo": "swimwear shot in 1990s editorial style",
  "lingerie": "silk slip dress, knee-length"
};
