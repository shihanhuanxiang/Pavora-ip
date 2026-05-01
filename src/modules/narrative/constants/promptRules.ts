export const ALLOWED_KEYWORDS_V2 = [
  "feminine", "intimate", "soft", "vulnerable", "contemplative",
  "elegant", "tasteful", "editorial", "magazine-quality",
  "dappled morning light", "golden hour", "soft focus",
  "silk slip strap", "robe loosely tied", "off-shoulder",
  "shot in style of Annie Leibovitz",
  "shot in style of Peter Lindbergh",
  "shot in style of Helmut Newton",
  "shot in style of Mario Testino",
  "fashion photography", "vogue editorial", "harper's bazaar editorial",
  "Renaissance portrait composition", "Botticelli proportions",
  "classical painting style", "fine art photography",
  "implied not shown", "mood-based composition",
  "monochrome elegance", "black and white film grain"
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
