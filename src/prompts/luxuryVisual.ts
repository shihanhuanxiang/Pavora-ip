
import { LuxuryVisualParams } from "../shared/types/types";

export const buildLuxuryVisualPrompt = (params: LuxuryVisualParams): string => {
  const { mode, masterStyle, subject, ingredients_composition, camera, custom_prompt } = params;

  // 1. 核心寫實指令 (Photography Mandate)
  const realismCore = `
[PHOTOGRAPHY PROTOCOL]: 
- ACT as a world-class luxury product photographer. 
- GEAR: Phase One IQ4 150MP, prime lens. 
- TEXTURE: High-fidelity sub-surface scattering, microscopic detail on ${subject.material}. 
- NO CGI artifacts, NO smooth plastic skin, NO artificial gradients. 
- LIGHTING PHYSICS: Natural light bounce and realistic ray-traced shadows.`;

  // 2. 渲染模式 (Render Mode)
  let compositionPrompt = "";
  
  if (mode === 'INGREDIENT_EXPLOSION' && subject.category === 'perfume') {
    // 專為香水設計的「香氛金字塔」爆炸邏輯
    compositionPrompt = `
[SPATIAL PYRAMID COMPOSITION]: 
- DECONSTRUCT the product and ingredients (${ingredients_composition}) into three olfactory layers:
- OUTER/TOP LAYER: Lightest, most translucent ingredients floating highest and furthest, representing volatile Top Notes.
- MID/HEART LAYER: Rich floral or spicy elements swirling around the bottle center, representing Middle Notes.
- INNER/BASE LAYER: Dense, textured, and heavy elements (woods, resins) positioned near the bottom of the bottle, representing deep Base Notes.
- All elements must interact with realistic zero-gravity physics and cast shadows on each other.`;
  } else {
    const modeMap: Record<string, string> = {
      LUXURY_POSTER: "COMPOSITION: Product centered, heroic low-angle placement on a solid luxury surface.",
      EDITORIAL_FASHION: "COMPOSITION: Asymmetric editorial layout, lots of negative space, lifestyle integration.",
      BEAUTY_FOCUS: "COMPOSITION: Extreme macro close-up, focusing on fine surface textures and micro-details.",
      INGREDIENT_EXPLOSION: `COMPOSITION: Deconstructed product components and ingredients (${ingredients_composition}) floating in zero-gravity around the core subject.`,
      STILL_LIFE_ZEN: "COMPOSITION: Perfect architectural symmetry, minimalist arrangement with balanced geometric weights.",
      AVANT_GARDE_SURREAL: "COMPOSITION: Distorted spatial physics, surreal overlapping layers, experimental visual hierarchy.",
      LIFESTYLE_LUXE: "COMPOSITION: Product placed within a high-end environment context (Yacht, Jet, or Mansion).",
      ARCHITECTURAL_VOID: "COMPOSITION: Tiny subject in a massive, cold architectural empty space, emphasizing scale.",
      LIQUID_DYNAMICS: "COMPOSITION: Dynamic liquid swirls, splashes, and fluid motion interacting with the product surface.",
      PRISM_REFRACTION: "COMPOSITION: Complex light refractions using glass prisms, caustic light patterns across the scene.",
      MUSEUM_DISPLAY: "COMPOSITION: Product housed within a specialized glass showcase with gallery-style pedestals.",
      URBAN_TECH_RUN: "COMPOSITION: Gritty urban setting, techwear-inspired props, rain-slicked asphalt reflecting neon.",
      BOTANICAL_STUDY: "COMPOSITION: Overgrown exotic flora, lush botanical leaves framing the product naturally.",
      GEOMETRIC_PLAY: "COMPOSITION: Interaction with 3D abstract primitive shapes (spheres, cubes, pyramids).",
      DESERT_MIRAGE: "COMPOSITION: Vast horizon line, sand dunes, heat haze distortion in the background.",
      AQUATIC_VOYAGE: "COMPOSITION: Product partially submerged in turquoise crystal water, surface ripples.",
      CELESTIAL_SPACE: "COMPOSITION: Weightless suspension in a cosmic void, surrounded by nebulae and star dust.",
      INDUSTRIAL_GRIT: "COMPOSITION: Rough industrial textures, rusted steel beams, raw concrete floor.",
      RETRO_CINEMA: "COMPOSITION: Classic 70s cinema framing, anamorphic aspect ratios, lens flare placement.",
      HIGH_KEY_INTERIOR: "COMPOSITION: All-white minimalist interior, seamless transition between floor and wall.",
      SHADOW_NARRATIVE: "COMPOSITION: Dramatic high-contrast shadows used as geometric framing elements."
    };
    compositionPrompt = modeMap[mode];
  }

  // 3. 大師風格 (Master Style)
  const styleMap: Record<string, string> = {
    NONE: "LIGHTING: Neutral commercial studio lighting.",
    OBSIDIAN_NOIR: "LIGHTING & COLOR: Deep obsidian palette, dramatic silver rim lighting, harsh shadows, metallic sheen.",
    GOLDEN_HOUR: "LIGHTING & COLOR: 3000K warm amber light, long soft sunset shadows, sun-drenched glow.",
    HIGH_KEY: "LIGHTING & COLOR: High-key photography, shadowless illumination, pure white and airy color grading.",
    CYBER_AD: "LIGHTING & COLOR: Vibrant cyan and magenta dual-tone lighting, holographic reflections, neon chromaticity.",
    QUIET_LUXURY: "LIGHTING & COLOR: Old money aesthetic, beige and cream monochrome, soft expensive diffused light.",
    RETRO_VOGUE: "LIGHTING & COLOR: 90s fashion flash, high-contrast overexposed look, slight film grain texture.",
    METALLIC_CHROME: "LIGHTING & COLOR: High-gloss liquid chrome finish, ultra-reflective surfaces, sharp specular highlights.",
    ORGANIC_SHADOW: "LIGHTING & COLOR: Dappled sunlight filtering through leaves (Gobo effect), soft organic shadows.",
    BAROQUE_CRIMSON: "LIGHTING & COLOR: Deep crimson and gold palette, dramatic chiaroscuro lighting, rich velvet tones.",
    ANTWERP_AVANT: "LIGHTING & COLOR: Cold monochromatic blue and grey, intellectual and sterile atmosphere.",
    MORANDI_MUTED: "LIGHTING & COLOR: Desaturated earthy Morandi tones, flat matte textures, very soft ambient light.",
    EGEAN_SAPPHIRE: "LIGHTING & COLOR: Crisp Mediterranean white and sapphire blue, sharp high-contrast noon light.",
    SAHARA_EARTH: "LIGHTING & COLOR: Terracotta and ochre color story, warm dusty atmosphere, high texture clarity.",
    ARCTIC_CRYSTAL: "LIGHTING & COLOR: Icy blue and white tint, crystalline sharp reflections, cold surgical lighting.",
    LIMESTONE_RAW: "LIGHTING & COLOR: Natural stone grey, neutral warm beige highlights, raw unpolished texture.",
    HOLOGRAPHIC_IRID: "LIGHTING & COLOR: Iridescent pearlescent color shifting, rainbow oil-slick highlights.",
    COPPER_OXIDE: "LIGHTING & COLOR: Patina teal and oxidized copper orange, vintage chemical reaction colors.",
    POWDER_PASTEL: "LIGHTING & COLOR: Soft powder pink and lavender, airy dreamlike grading, low contrast.",
    VINTAGE_SEPIA: "LIGHTING & COLOR: 1940s sepia film tint, aged paper texture, warm nostalgic shadows.",
    DEEP_EMERALD: "LIGHTING & COLOR: Emerald green and forest gold, moody prestige lighting, mysterious luxury vibe."
  };

  const subjectDesc = `[SUBJECT]: A ${subject.category} from '${subject.brand || 'Luxury'}' brand. [COLOR]: Strict lock on ${subject.color_palette}. [FIDELITY]: ${subject.texture_detail} level texture detail.`;
  const cameraDesc = `[OPTICS]: Shot on ${camera.focal_length} with ${camera.dof_intensity}% depth of field blur.`;

  return `
${realismCore}
${compositionPrompt}
${styleMap[masterStyle]}
${subjectDesc}
${cameraDesc}
[CRITICAL]: Maintain 100% shape and identity of Input 1. No text. No watermarks. Professional advertisement quality.
${custom_prompt ? `[USER REQUEST]: ${custom_prompt}` : ''}
  `.trim();
};
