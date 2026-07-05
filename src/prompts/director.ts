
import type { DirectorScene } from '../shared/types/types';
import { 
    DIRECTOR_STYLES, 
    LENS_LANGUAGES, 
    ACTION_RHYTHMS, 
    LIGHTING_VIBES, 
    COMPOSITION_FOCUSES, 
    CAMERA_MOVEMENTS, 
    SUBJECT_ACTIONS, 
    TRANSITION_STYLES 
} from '../shared/constants/constants';

export const buildDirectorPrompt = (scene: DirectorScene) => {
    if (scene.customDescriptionPrompt) {
        return { prompt: scene.customDescriptionPrompt, explanation: scene.promptExplanation };
    }

    const style = DIRECTOR_STYLES.find(s => s.value === scene.directorStyle)?.prompt || scene.directorStyle;
    const lens = LENS_LANGUAGES.find(l => l.value === scene.lensLanguage)?.prompt || scene.lensLanguage;
    const rhythm = ACTION_RHYTHMS.find(r => r.value === scene.actionRhythm)?.prompt || scene.actionRhythm;
    const lighting = LIGHTING_VIBES.find(l => l.value === scene.lightingVibe)?.prompt || scene.lightingVibe;
    const composition = COMPOSITION_FOCUSES.find(c => c.value === scene.compositionFocus)?.prompt || scene.compositionFocus;
    const movement = CAMERA_MOVEMENTS.find(m => m.value === scene.cameraMovement)?.prompt || scene.cameraMovement;
    const action = SUBJECT_ACTIONS.find(a => a.value === scene.subjectAction)?.prompt || scene.subjectAction;

    let basePrompt = `A high-end cinematic video. 
[STYLE]: ${style} ${scene.customDirectorStyle ? `(${scene.customDirectorStyle})` : ''}
[LENS]: ${lens} ${scene.customLensLanguage ? `(${scene.customLensLanguage})` : ''}
[MOTION RHYTHM]: ${rhythm} ${scene.customActionRhythm ? `(${scene.customActionRhythm})` : ''}
[LIGHTING]: ${lighting} ${scene.customLightingVibe ? `(${scene.customLightingVibe})` : ''}
[COMPOSITION]: ${composition} ${scene.customCompositionFocus ? `(${scene.customCompositionFocus})` : ''}
[CAMERA MOVEMENT]: ${movement} ${scene.customCameraMovement ? `(${scene.customCameraMovement})` : ''}
[SUBJECT ACTION]: ${action} ${scene.customSubjectAction ? `(${scene.customSubjectAction})` : ''}
[ADVANCED OPTICS]: 
- Motion Blur: ${scene.motionBlurIntensity || 50}%
- Film Grain: ${scene.filmGrainIntensity || 20}%
- Halation: ${scene.halationIntensity || 10}%
[ADDITIONAL DETAILS]: ${scene.customPrompt}`;

    // Inject Transition Logic for Start-to-End mode
    if (scene.generationMode === 'start-to-end' && scene.transitionStyle) {
        const transition = TRANSITION_STYLES.find(t => t.value === scene.transitionStyle);
        if (transition) {
            basePrompt += `\n\n[TRANSITION LOGIC]: ${transition.prompt}`;
            basePrompt += `\nEnsure the video starts exactly at the provided image and ends exactly at the provided last frame.`;
        }
    }

    return { prompt: basePrompt, explanation: "Constructed from professional Pro-Cine parameters" };
};

export const VIDEO_PROMPT_ANALYSIS = `Analyze this image and write a prompt for a video generation model (Veo) to animate it. Return JSON: { prompt_en: string, explanation_zh: string }`;

export const IMAGE_VISUAL_ANALYSIS_PROMPT = `Analyze this image's visual DNA for a professional cinematography system. 
Identify the lighting, composition, mood, and subject type.
Map these characteristics to the most suitable "Master Preset ID" from this list:
- scent_of_eternity (Luxury/Jewelry/Macro)
- urban_hunter (Street/Action/Neon)
- the_muse (Fashion/Portrait/Soft)
- cyber_avant_garde (Tech/Future/Anamorphic)
- old_money_estate (Luxury/Nature/Classic)
- raw_authenticity (Documentary/Real/Handheld)
- symmetrical_dream (Creative/Symmetrical/Pastel)
- noir_narrative (Mystery/Contrast/Telephoto)
- liquid_motion (Fluid/Ethereal/Slow)
- experimental_art (Artistic/Abstract/Dynamic)

Return JSON:
{
  "suggestedPresetId": string,
  "analysis": {
    "lighting": string,
    "composition": string,
    "mood": string,
    "subject": string
  },
  "reasoning_zh": string,
  "fineTuneParams": {
    "directorStyle": "luxury_tvc" | "avant_garde" | "quiet_luxury" | "cyber_noir" | "surrealist_dream" | "technicolor" | "french_new_wave" | "cyber_brutalism" | "wes_anderson" | "wong_kar_wai",
    "lensLanguage": "prime_35mm" | "tele_135mm" | "anamorphic_2x" | "laowa_probe" | "petzval_vintage" | "wide_24mm" | "split_diopter" | "fisheye_ultra",
    "actionRhythm": "natural" | "slow_motion_60" | "super_slow_120" | "step_printing" | "speed_ramping" | "reverse_motion" | "timelapse_pro" | "stop_motion_tactile",
    "lightingVibe": "chiaroscuro" | "volumetric_tyndall" | "butterfly_beauty" | "motivated_practical" | "rembrandt" | "golden_hour" | "neon_noir" | "high_key_clean",
    "compositionFocus": "rule_of_thirds" | "golden_ratio" | "negative_space" | "frame_in_frame" | "low_angle_hero" | "top_down_flat" | "deep_focus" | "extreme_close_up",
    "cameraMovement": "static" | "technocrane_sweep" | "steadicam_follow" | "vertigo_effect" | "parallax_pan" | "orbit_360" | "whip_pan" | "handheld_organic",
    "subjectAction": "micro_expression" | "texture_interaction" | "runway_walk" | "dynamic_turn" | "slow_motion_pose" | "emotional_transition" | "prop_interaction" | "environmental_look"
  }
}`;

export const SCRIPT_TO_STORYBOARD_PROMPT = (script: string) => `Analyze script: "${script}". Create 5 storyboard scenes. Return JSON array of DirectorScene objects (partial, fill fields).`;
