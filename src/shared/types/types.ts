

/**
 * 核心流程步驟
 */
export enum WorkflowStep {
  HOMEPAGE,
  // New Hubs
  BRAND_IDENTITY_HUB,
  MARKETING_FACTORY,
  MOTION_CINEMATIC_HUB,
  
  // Legacy/Specific Modules
  MODEL_SETUP,
  MODEL_LOUNGE,
  VIRTUAL_FITTING_ROOM,
  PERSONAL_WARDROBE,
  APPAREL_DESIGN,
  HAIR_SALON,
  SCENE_GENERATION,
  FANTASY_SERIES,
  COMPOSITE_CARD,
  PORTFOLIO_GALLERY,
  PORTFOLIO_OPTIMIZATION,
  IMAGE_DECONSTRUCTION,
  PCPE,
  DIRECTOR_MODE,
  CHARACTER_LAB,
  FASHION_ARCHITECT,
  LUXURY_VISUAL_GEN,
  MACRO_CRAFT,
  STYLE_ANCHOR,
  E_GEN,
  BRAND_IDENTITY_HUB_COMP_CARD,
  MARKETING_FACTORY_POSTER,
  MARKETING_FACTORY_ARCHITECT,
}

// 高端廣告視覺生成相關類型 (各 21 種)
export type LuxuryVisualMode = 
  | 'LUXURY_POSTER' | 'EDITORIAL_FASHION' | 'BEAUTY_FOCUS' | 'INGREDIENT_EXPLOSION' 
  | 'STILL_LIFE_ZEN' | 'AVANT_GARDE_SURREAL' | 'LIFESTYLE_LUXE' | 'ARCHITECTURAL_VOID'
  | 'LIQUID_DYNAMICS' | 'PRISM_REFRACTION' | 'MUSEUM_DISPLAY' | 'URBAN_TECH_RUN'
  | 'BOTANICAL_STUDY' | 'GEOMETRIC_PLAY' | 'DESERT_MIRAGE' | 'AQUATIC_VOYAGE'
  | 'CELESTIAL_SPACE' | 'INDUSTRIAL_GRIT' | 'RETRO_CINEMA' | 'HIGH_KEY_INTERIOR' | 'SHADOW_NARRATIVE';

export type LuxuryOutputLevel = 'FAST' | 'MAX';

export type LuxuryMasterStyle = 
  | 'NONE' | 'OBSIDIAN_NOIR' | 'GOLDEN_HOUR' | 'HIGH_KEY' | 'CYBER_AD' 
  | 'QUIET_LUXURY' | 'RETRO_VOGUE' | 'METALLIC_CHROME' | 'ORGANIC_SHADOW'
  | 'BAROQUE_CRIMSON' | 'ANTWERP_AVANT' | 'MORANDI_MUTED' | 'EGEAN_SAPPHIRE'
  | 'SAHARA_EARTH' | 'ARCTIC_CRYSTAL' | 'LIMESTONE_RAW' | 'HOLOGRAPHIC_IRID'
  | 'COPPER_OXIDE' | 'POWDER_PASTEL' | 'VINTAGE_SEPIA' | 'DEEP_EMERALD';

export interface LuxuryVisualParams {
  mode: LuxuryVisualMode;
  level: LuxuryOutputLevel;
  masterStyle: LuxuryMasterStyle;
  subject: {
    category: 'clothing' | 'bag' | 'perfume' | 'jewelry' | 'beauty';
    material: 'leather' | 'glass' | 'metal' | 'fabric';
    color_palette: string;
    logo_visibility: 'on' | 'off' | 'subtle';
    texture_detail: 'low' | 'medium' | 'high';
    transparency_level: number;
    // Fix: Added brand property to subject to support prompt engineering and state management.
    brand: string;
  };
  ingredients_composition?: string;
  camera: {
    focal_length: '24mm' | '50mm' | '100mm';
    dof_intensity: number; // 0-100
    composition: 'centered' | 'rule_of_thirds' | 'minimal_negative_space';
  };
  effect: {
    organic: string;
    particle: string;
    intensity: number;
  };
  background: string;
  lighting: string;
  ratio: string;
  custom_prompt?: string;
}

export type SceneTimeSlot = 'auto' | 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'deep_night';
export type SceneWeatherType = 'auto' | 'clear' | 'overcast' | 'rain' | 'snow' | 'fog' | 'frost' | 'thunder' | 'wind' | 'aurora';
export type SceneStability = 'high' | 'adaptive';

export interface ScenePhysics {
    time: SceneTimeSlot;
    weather: SceneWeatherType;
    intensity: string;
    stability: SceneStability;
    shadowIntensity: number;
    ugcIntensity?: number; // 0-100, controls lifestyle/selfie realism artifacts
    selfieCameraType?: 'front' | 'rear';
    selfieAngle?: 'high' | 'eye' | 'low';
    lightHardness?: 'balanced' | 'soft' | 'ultra_soft' | 'hard' | 'chiaroscuro' | 'rim_only';
    colorTemperature?: 'neutral' | 'warm' | 'golden_hour' | 'cool' | 'teal_orange' | 'neon_cyber';
    lensFocalLength?: '14mm' | '24mm' | '35mm' | '50mm' | '85mm' | '135mm';
    dofIntensity?: number;
}

export interface EGenAnalysis {
    basic_info: {
        category: string;
        color: string;
        material: string;
    };
    key_features: string[];
    style_tags: string[];
    selling_points: string[];
}

export interface EGenStyleDefinition {
    palette: {
        main: string;
        accent: string;
        bg: string;
    };
    visual_vibe: string;
}

export interface EGenCopyBlock {
    title: string;
    subtitle: string;
    bullets: string[];
}

export interface EGenPoster {
    id: number;
    type: string;
    title_zh: string;
    prompt: string;
    imageUrl?: string;
    copy?: EGenCopyBlock;
    status: 'pending' | 'loading' | 'success' | 'error';
}

export interface IPPersona {
    coreVibe: string;
    mbti?: string;
    profession?: string;
    socialStatus?: string;
    catchphrase?: string;
    postingHabit?: string;
    toneOfVoice?: string;
    locked_descriptor?: string;
}

export interface IPVisualConstants {
    catchlightPreference?: string;
    signaturePoses?: string[];
    stylingFilters?: string[];
    facialBoneStructure?: string;
    expressionStyle?: string;
    colorTone?: string;
    poseEnergy?: string;
}

export interface IPLifeCircuit {
    primaryCity?: string;
    primaryDistrict?: string;
    interests?: string[];
    relationships?: string[];
}

export interface DiaryEntry {
    id: string;
    modelId: string;
    timestamp: number;
    eventTrigger: string;
    content: string;
    mood: string;
    visualPrompt?: string;
    visualPromptZH?: string;
    generatedPromptParams?: any;
    meta?: any;
    status: 'draft' | 'confirmed' | 'generated';
}

export interface NarrativeContext {
    location: string;
    weather: string;
    timeOfDay: string;
    activity: string;
    detectedOutfit?: string;
}

export interface AdvancedPhysiqueStats {
    bustTension: number;
    physiqueCurvature: number;
    muscularDensity: number;
    vTaperScale: number;
}

export interface WorldAnchors {
    pet?: {
        breed: string;
        name: string;
        description: string;
        traits: string[];
    };
    relationships?: {
        name: string;
        relation: string;
        personality: string;
        memo: string;
    }[];
    iconicItems?: {
        name: string;
        description: string;
        significance: string;
    }[];
    longTermMemories?: string[];
}

export interface LocalizedScene {
  id?: string;
  scene_id?: string;
  name_zh?: string;
  name_en?: string;
  city: string;
  region: "north" | "central" | "south" | "east" | "islands" | "all";
  category: string;
  event: string;
  sensory: string | any;
  visualNoise: string | any;
  promptSkeleton?: string;
  emotions?: string[];
}

export interface ExtendedScene extends LocalizedScene {
  depth_module_id: number;
  event_type_ref?: number[];
  season?: string[];
  time_of_day?: string[];
  outfit_hint?: string;
  spicy_level?: number;
  pov_modes?: string[];
  negative_prompt?: string;
  visual_noise?: string[]; // Alternative naming in v1.1
  prompt_skeleton?: string; // Alternative naming in v1.1
  flags: {
    relationship_layer: string | null;
    story_arc_id: string | null;
    arc_phase: string | null;
    identity_thread_id: string | null;
    thread_milestone: string | null;
    object_focus: boolean;
    digital_layer: boolean;
    intimacy_emotional: boolean;
    in_between_location: boolean;
    vulnerability_tag: string | null;
    weather_event: string | null;
  };
}

export interface DepthModule {
  id: number;
  code: string;
  name_zh: string;
  name_en: string;
  purpose: string;
  tag_field: string;
  typical_quota_per_week: [number, number];
}

export interface NonVisualPersona {
  persona_id: string;
  role: 'best_friend'|'pet_cat'|'pet_dog'|'grandma'|'family_father'|'family_mother'|'fan_callback';
  name: string;
  traits: string[];
  mention_patterns: string[];
  visual_traces: string[];
  prompt_inject: string;
}

export interface StoryArc {
  arc_id: string;
  name_zh: string;
  name_en: string;
  duration_days: number;
  phases: string[];
  spacing_days: number[];
  scenes: string[];
  rationale: string;
}

export interface IdentityThread {
  thread_id: string;
  name_zh: string;
  name_en: string;
  duration_weeks: number;
  cadence_weekly: number;
  milestones: string[];
  scenes: string[];
  rationale: string;
}

export interface CompositionInjectionRule {
  rule_id: string;
  depth_module_id: number;
  description: string;
  weekly_quota: { min: number; max: number };
  probability_per_post?: number;
  trigger?: string;
  prefer_platforms?: string[];
  avoid_platforms?: string[];
  compatible_with_modules: number[];
  exclusive_with_modules: number[];
  prompt_injection_position?: string;
  persona_weight?: Record<string, number>;
}

export interface WeeklyPlanBrief {
    day: number; // 0-6
    moduleId: number;
    sceneId: string;
    title: string;
    scripts: string[];
    strategy_tags?: string[];
    isArcScene?: boolean;
    isThreadScene?: boolean;
}

export interface Model { 
    id: string; 
    name: string; 
    imageUrl: string; 
    type: 'standard' | 'custom'; 
    schemaVersion?: string; 
    persona?: IPPersona;
    visualConstants?: IPVisualConstants;
    lifeCircuit?: IPLifeCircuit;
    worldAnchors?: WorldAnchors;
    stats?: ModelData['stats'];
    advancedStats?: AdvancedPhysiqueStats;
    gender?: string;
    age?: number;
    preferences?: {
        preferred_archetypes?: string[];
        aesthetic_tier_min?: number;
        aesthetic_tier_max?: number;
        active_arc_id?: string | null;
        active_arc_phase_index?: number;
        active_outfit_id?: string | null;
        recent_outfit_ids?: string[];
        visual_preset_id?: string | null;
        manual_wear_state?: string | null;
        active_threads?: {
            thread_id: string;
            current_milestone_index: number;
            last_update_timestamp: number;
        }[];
        persona_extension?: {
            best_friend_name?: string;
            pet_name?: string;
            hometown?: string;
        };
        enable_story_arcs?: boolean;
        enable_identity_threads?: boolean;
        custom_story_arcs?: StoryArc[];
        custom_identity_threads?: IdentityThread[];
    };
    gallery?: {
        id: string;
        url: string;
        timestamp: number;
        narrativeContent?: string;
        visualPrompt?: string;
        visualPromptZH?: string;
    }[];
}

export interface OutfitV2 {
    outfit_id: string;
    gender: 'F' | 'M' | 'U';
    style_archetype: string;
    context_id: string;
    aesthetic_tier: number;
    pillars: {
        layer_inner: string | null;
        top: string;
        layer_outer: string | null;
        bottom: string;
        shoes: string;
        accessories: string[];
        props: string[];
    };
    fabric_difficulty: 'safe' | 'medium' | 'hard';
    wear_state: string;
    layering_count: number;
    compatible_contexts: string[];
    hand_occupation: {
        left_hand: string;
        right_hand: string;
        both_busy: boolean;
    };
    prop_light_emit?: string[];
    prompt_skeleton: string;
}
export interface StoredApparelItem { id: string; name: string; imageUrl: string; category: string; schemaVersion?: string; analysis?: any; tags?: string[]; color?: string; }
export interface PortfolioItem { 
  id: string; 
  imageUrl: string; 
  sourceModule: string; 
  createdAt: string; 
  schemaVersion?: string; 
  driveFileId?: string;
}
export interface TaxonomyEntry { id: string; category: string; group: string; display_name_zh: string; display_name_en: string; prompt_base: string; variants?: string[]; variants_en?: string[]; prompt_variant?: string[]; }
export interface ApparelItemDefinition { id: string; name: string; }
export interface ApparelMainCategory { mainCategory: string; groups: { groupName: string; items: ApparelItemDefinition[]; }[]; }
export type ProgressFn = (message: string) => void;

export interface OutfitPreset { id: string; label: string; prompt: string; category: string; gender: 'male' | 'female'; }
export interface ApparelItem { id: string; name: string; file: File; previewUrl: string; }
export interface GeneratedLook { id: number; imageUrl: string; qaChecks: QaCheck[]; }
export interface QaCheck { id: string; label: string; passed: boolean; }

export type BgPresetId = 'BG_SOFT_NATURE' | 'BG_OCEAN_MIST' | 'BG_GALAXY_DREAM' | 'BG_URBAN_NEON' | 'BG_CRYSTAL_GRADIENT' | 'BG_ABSTRACT_FLOW' | 'BG_SAKURA_ETHEREAL' | 'BG_MINIMAL_WHITE' | 'BG_GOLDEN_LIGHT';
export type VisualPresetId = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9';

export type PCPERatio = '1:1' | '3:4' | '9:16' | '4:3' | '16:9';
export type PCPEExportFormat = 'JPG' | 'PNG' | 'PDF';

export interface AIDiagnosis {
    視覺摘要?: { 
        主體核心特徵: string; 
        多角度觀察: string; 
        色彩與材質觀察: string; 
        環境適配性: string; 
    };
    問題診斷?: { 
        視覺缺陷: string; 
        融合挑戰: string; 
    };
    攝影方向?: { 
        鏡頭策略: string; 
        主體控制: string; 
        層次處理: string; 
    };
    創意建議?: { 
        主體姿態優化: string; 
        背景類型建議: string; 
        道具與裝飾: string; 
    };
}

export interface ModelData {
    name: string;
    gender: string;
    style: string;
    bio: string;
    stats: { height: number; bust: number; waist: number; hip: number; hair: string; eyes: string; };
}

export interface BurstImage { index: number; url: string; pose: string; expression: string; selected: boolean; }
export interface BurstPoseExpressionPair { pose: string; expression: string; }
export interface CardAsset { id: string; src: string; position: { x: number; y: number; }; scale: number; rotation: number; }

export interface BrandAmbassador {
  id: string;
  name: string;
  imageUrl: string;
  gender: 'male' | 'female' | 'non-binary';
  ethnicity: string;
  bodyType: string;
  faceAnchorParams?: any;
  hairStyle?: string;
  makeupStyle?: string;
  createdAt: string;
}

export interface BrandDefinition {
    id: string;
    name: string;
    display_name: string;
    stylePrompt: string;
}

export interface BrandPreset {
  id: string;
  name: string;
  lighting: string;
  composition: string;
  cameraParams: any;
  colorReference?: string; // Hex or description
}

export interface HairstyleParams { 
    length?: string; 
    style?: string; 
    texture?: string; 
    finish?: 'matte' | 'silk' | 'wet'; 
    parting?: 'left' | 'right' | 'center' | 'zigzag';
    bangs_style?: 'none' | 'wispy' | 'blunt' | 'curtain';
    root_lift?: number;
    baby_hair?: number;
    layering?: number;
    texturizing?: number;
    edge_finish?: 'blunt' | 'point' | 'feathered';
    height?: string; 
    volume?: number;
    curliness?: number;
    density?: number;
    shine?: number;
    flyaways?: number;
}
export interface HairstylePreset { id: string; name: string; category?: 'short' | 'medium' | 'long' | 'special'; prompt: string; params: HairstyleParams; }

export interface MakeupParams {
    lipstick_color?: string;
    lipstick_intensity?: number;
    eyeshadow_color?: string;
    eyeshadow_intensity?: number;
    blush_color?: string;
    blush_intensity?: number;
    contact_lens_color?: string;
    eyebrow_style?: 'natural' | 'bold' | 'feathered' | 'arched';
    lipstick_texture?: 'matte' | 'glossy' | 'velvet';
    lipstick_blending?: 'defined' | 'gradient' | 'overlined';
    foundation_finish?: 'dewy' | 'matte' | 'satin';
    aegyo_sal_intensity?: number;
    skin_texture_intensity?: number;
    eyelash_length?: number;
    eyeliner_sharpness?: number;
    inner_corner_pop?: number;
    cut_crease?: number;
    nose_sculpt?: number;
    jawline_definition?: number;
    contour_intensity?: number;
    highlight_intensity?: number;
    freckles?: number;
}

export interface MakeupPreset {
    id: string;
    name: string;
    keyword: string;
    params?: MakeupParams;
}

export interface SavedPreset {
    id: string;
    name: string;
    hairstyle: HairstyleParams;
    makeup: MakeupParams;
    beardStyleId?: string;
    beardColor?: string;
    hairColor: string;
    hairColorMode: 'color' | 'gradient' | 'highlight';
    colorStops: { hex: string }[];
    gradientPlacement: string;
    gradientCoverage: number;
    highlightPattern: string;
    highlightDensity: number;
    createdAt: string;
}

export interface StylistFeedback {
    overall_critique: string;
    hair_analysis: string;
    makeup_analysis: string;
    professional_tips: string[];
}

export enum PosePreset { Stand = 'stand', Custom = 'custom' }
export enum ExpressionPreset { Neutral = 'neutral', Custom = 'custom' }

export interface AnalysisResponse {
    analysis: {
        compatibility: { lightingDirection: string; colorTemperature: string; scaleAndPerspective: string; };
        potentialIssues: string[];
        detectedEnvironment?: { time: string; weather: string; intensity: string };
    };
    poseSuggestions: PoseSuggestion[];
    expressionSuggestions: ExpressionSuggestion[];
}

export interface PoseSuggestion { poseText: string; reasoning: string; }
export interface ExpressionSuggestion { expressionText: string; reasoning: string; }

// Fantasy Morph Studio 3.0
export type FantasyGenderMode = 'auto' | 'female' | 'male';
export type BattleDamageLevel = 0 | 1 | 2 | 3;
export type CompanionType = 'none' | 'dragon' | 'mechanical' | 'spirit' | 'beast';

export type FxLevel = 'off' | 'low' | 'med' | 'high';
export type BgMode = 'ai_lite' | 'pbl' | 'photo_ref';

export interface GarmentEraser {
    enabled: boolean;
    targets: string[];
    dilatePx: number;
    strength: number;
}

export interface FantasyPresetV8 {
    name: string;
    labelZh: string;
    description?: string;
    prompt_en?: string;
    prompt_male_en?: string;
    prompt_female_en?: string;
    gender?: 'male' | 'female' | 'universal';
    must_show?: string[];
    negatives?: string[];
    features?: string[];
    action?: string[];
    effects?: string[];
    tags: string[];
}

export interface FantasyRace extends FantasyPresetV8 {
    category?: string;
}

export interface FantasyJob extends FantasyPresetV8 {
    type?: string;
    reference?: string;
}

export interface ScenePresetV8 {
    id: string;
    name?: string;
    labelZh: string;
    category: string;
    environment: string;
    lightingRig: string;
    atmosphere?: string;
}

export interface FantasyLightingV4 {
    id: string;
    label: string;
    description: string;
    prompt: string;
}

export interface FantasyCompositionV4 {
    id: string;
    label: string;
    description: string;
    prompt: string;
}

export interface CelestialEventV4 {
    id: string;
    label: string;
    description: string;
    prompt: string;
}

export interface AtmosEffectV4 {
    id: string;
    label: string;
    description: string;
    prompt: string;
}

export interface FantasyCompanionV4 {
    id: string;
    label: string;
    description: string;
    prompt: string;
}

export interface PoseV8 {
    id: string;
    label: string;
    category: string;
    intensity: number;
    hand?: string;
    hands?: string;
    prop?: string;
    props?: string;
    symmetry?: string;
    template?: string;
    promptTemplate?: string;
    requirements?: {
        race?: string[];
        job?: string[];
    };
}

export interface FantasyExpressionV8 {
    id: string;
    label: string;
    category: string;
    intensity?: number;
    cues: string;
    requirements?: {
        race?: string[];
        job?: string[];
    };
}

// Portfolio Optimization
export interface RealismAnalysisReport {
    critique_zh: string;
    suggested_params: {
        composition: string;
        lightDirection: string;
        lightStyle: string;
        focalLength: string;
        depthOfField: string;
        quality: string[];
        additional_prompt: string;
    };
}

// Image Deconstruction
export interface DeconstructedPrompt {
    prompt_en: string;
    prompt_zh: string;
    spec: {
        subject: string;
        attire: string;
        composition: string;
        lighting: string;
        camera_settings: string;
        style: string;
        style_tags: string[];
        color_palette: { hex: string; name: string }[];
        negative_prompt: string[];
    };
}

export interface ExtractedAsset {
    id: string;
    name: string;
    category: string;
    description: string;
    pngTransparentUrl: string;
}

// PCPE
export interface BackgroundCard {
    id: string;
    title: string;
    why: string;
    background: string;
    camera: string;
    pose: string;
    lighting: string;
    props: string;
}

export interface CamOption { label_zh: string; purpose_zh: string; camera: string; }
export interface PoseOption { label_zh: string; purpose_zh: string; pose: string; }
export interface LightOption { label_zh: string; purpose_zh: string; lighting: string; }
export interface PropsOption { label_zh: string; purpose_zh: string; props: string; }

export interface PCPEForm {
    subjectImage: File | null;
    isModel: boolean;
    ratio: PCPERatio;
    quality: 'standard' | 'high';
    format: PCPEExportFormat;
}

// Director Mode
export interface DirectorScene {
    id: string;
    directorStyle: string;
    customDirectorStyle?: string;
    lensLanguage: string;
    customLensLanguage?: string;
    actionRhythm: string;
    customActionRhythm?: string;
    lightingVibe: string;
    customLightingVibe?: string;
    compositionFocus: string;
    customCompositionFocus?: string;
    cameraMovement: string;
    customCameraMovement?: string;
    subjectAction: string;
    customSubjectAction?: string;
    customPrompt: string;
    customDescriptionPrompt?: string;
    generationMode: 'single' | 'start-to-end' | 'multi-reference' | 'extension';
    transitionStyle?: string;
    resolution: '720p' | '1080p';
    aspectRatio: '16:9' | '9:16' | '1:1';
    referenceImageUrls?: string[];
    referenceFramesFileData?: { data: string; mimeType: string }[];
    generatedVideoUrl?: string;
    generatedOperation?: any;
    firstFrameUrl?: string;
    lastFrameUrl?: string;
    endFrameUrl?: string;
    endFrameFileData?: { data: string; mimeType: string };
    storyboardPreviewUrl?: string;
    storyboardPreviewUrls?: string[];
    overrideStartFrameUrl?: string;
    previousSceneId?: string;
    prompt?: string;
    promptExplanation?: string;
    motionBlurIntensity?: number;
    filmGrainIntensity?: number;
    halationIntensity?: number;
    generationCount?: number;
    generatedVideoUrls?: string[];
}

// Fashion Architect
export type FashionArchitectLayout = 'CLASSIC' | 'MODERN' | 'AVANT_GARDE' | 'L_FRAME' | 'TRIPTYCH' | 'STEPPED';
export type FashionArchitectRatio = 'A4' | '9:16' | '4:5' | '1:1';

export interface FashionItem {
    id: string;
    name: string;
    fileData: { data: string; mimeType: string };
    previewUrl?: string;
    processedUrl?: string;
    macroUrl?: string;
}

export interface FashionLayoutAnalysis {
    backgroundColor: string;
    fontColor: string;
    accentColor: string;
    layoutStyle: string;
    colorPalette?: { hex: string; name: string }[];
    itemAnchors?: { partName: string; x: number; y: number }[];
    lighting?: {
        direction: string;
        temperature: string;
    };
}

// Cinematic Analyzer
export interface CinematicAnalysis {
    technical_audit: {
        genre_style: string;
        color_palette: { hex: string; name: string }[];
        lighting_setup: string;
        lens_camera: string;
        texture_details: string;
    };
    storyboard: {
        time_code: string;
        shot_type: string;
        camera_move: string;
        visual_description: string;
        golden_prompt_en: string;
        golden_prompt_zh: string;
    }[];
    shooting_script: {
        scene_header: string;
        action: string;
        tech_notes: string;
    };
}

// Macro Craft
export interface MacroCraftParams {
    mode: 'build' | 'repair' | 'upgrade' | 'structure' | 'material';
    scale: 'subtle' | 'balanced' | 'dominant';
    productType: string;
    quality: 'standard' | 'high';
    customInstruction?: string;
}

export interface MacroAnalysis {
    structureNodes: string[];
    materialProperties: string;
    narrativeHotspots: string[];
}

// Style Anchor
export interface StyleAnchorParams {
    anchorType: string;
    cloneCount: number;
    structureLayout: string;
    poseSet: string;
    hookIntensity: 'low' | 'medium' | 'high';
    outfitConsistency: 'identical' | 'one-variant';
    moodState: string;
    photoStyle: string;
    ratio: string;
    quality: 'standard' | 'high';
    identityImage?: { data: string; mimeType: string };
    outfitImage?: { data: string; mimeType: string };
}

export interface StyleAnchorPreset {
    id: string;
    name: string;
    description: string;
    params: Partial<StyleAnchorParams>;
    promptSegment: string;
}
