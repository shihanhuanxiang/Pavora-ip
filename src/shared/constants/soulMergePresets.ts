import type { BgPresetId, VisualPresetId } from '../types/types';

export const BG_PRESETS: Record<BgPresetId, { label: string; prompt: string }> = {
  BG_SOFT_NATURE: { label: "柔和自然葉", prompt: "soft leaves caustics, gentle sun dapples" },
  BG_OCEAN_MIST: { label: "海洋薄霧", prompt: "sea spray, mist, specular ripples" },
  BG_GALAXY_DREAM: { label: "銀河之夢", prompt: "nebula cloud, star dust, deep cosmos" },
  BG_URBAN_NEON: { label: "都市霓虹", prompt: "city reflections, glass, neon trails" },
  BG_CRYSTAL_GRADIENT: { label: "水晶漸層", prompt: "crystalline gradient light, minimal hue shift" },
  BG_ABSTRACT_FLOW: { label: "抽象流光", prompt: "particle flow, energy haze, volumetric light" },
  BG_SAKURA_ETHEREAL: { label: "櫻花幻境", prompt: "petal bokeh, soft pink veil" },
  BG_MINIMAL_WHITE: { label: "極簡純白", prompt: "clean white, ultra subtle paper grain" },
  BG_GOLDEN_LIGHT: { label: "金色光暈", prompt: "warm halo, golden hour rim" },
};

export const VISUAL_PRESETS: Record<VisualPresetId, { label: string; tone: string }> = {
  V1:{label:"純淨光感", tone:"editorial neutral light, silver-white clarity"},
  V2:{label:"柔和自然", tone:"warm natural tone, light wood green and soft gold"},
  V3:{label:"午夜藍調", tone:"deep blue graphite calm, premium cool tone"},
  V4:{label:"黃金時刻", tone:"amber sunset highlight, storytelling warmth"},
  V5:{label:"都市銀灰", tone:"urban chic, metallic cool fashion tone"},
  V6:{label:"櫻花薄紗", tone:"soft pink veil, romantic airy tint"},
  V7:{label:"黑白電影", tone:"subtle film grain, noir silver-brown mood"},
  V8:{label:"靈動光暈", tone:"ethereal glow, cool green-violet haze"},
  V9:{label:"宇宙夢境", tone:"future cosmic palette, blue-violet electric"},
};