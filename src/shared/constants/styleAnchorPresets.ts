
import type { StyleAnchorPreset } from '../types/types';

export const STYLE_ANCHOR_TYPES = [
    { value: 'geometry', label: '幾何框架互動', prompt: 'multiple instances of the same fashion model interacting with thick black geometric frames, clean studio background, architectural composition, strong negative space' },
    { value: 'plane', label: '隱形平面', prompt: 'multiple instances of the same model interacting with invisible horizontal planes, minimalist fashion composition, subtle spatial illusion' },
    { value: 'gravity', label: '重力反轉', prompt: 'gravity-flipped orientation while keeping the world upright, some clones are inverted, strong visual contrast' },
    { value: 'sync', label: '同步分身', prompt: 'synchronized clones of the same model in slightly varied poses, subtle motion-like progression' },
    { value: 'state', label: '狀態分裂', prompt: 'identical clones expressing different fashion states through posture and expression, varied mood and body language' }
];

export const STRUCTURE_LAYOUTS = [
    { value: 'interlocking', label: '交錯矩形', prompt: 'thick black rectangular frames arranged in an interlocking layout, precise geometry, matte finish' },
    { value: 'l_corner', label: 'L 型轉角', prompt: 'minimalist L-shaped corner structure, clean lines, sharp shadows' },
    { value: 'suspended', label: '懸空平台', prompt: 'suspended dark platforms at various heights, architectural balance' },
    { value: 'horizon', label: '隱形水平面', prompt: 'interaction with invisible horizontal surfaces, perfectly aligned height increments' },
    { value: 'edge', label: '邊界互動', prompt: 'clones interacting with the frame edges, intentional cropping and boundary tension' }
];

export const POSE_SETS = [
    { value: 'classic_4', label: '經典四姿 (坐/躺/倚/倒掛)', prompt: 'poses include sitting, reclining, leaning, and inverted positions, natural body balance' },
    { value: 'sleek_3', label: '俐落三姿', prompt: 'three distinct high-fashion standing and sitting poses, sharp silhouettes' },
    { value: 'hook_5', label: '高鉤子五姿', prompt: 'five extreme fashion poses with high visual tension, complex limb positioning' }
];

export const MOOD_STATES = [
    { value: 'stable', label: '穩定', prompt: 'calm and steady fashion mood' },
    { value: 'relaxed', label: '放鬆', prompt: 'relaxed and effortless posture' },
    { value: 'cool', label: '冷靜', prompt: 'cold and distant high-fashion stare' },
    { value: 'avant_garde', label: '前衛', prompt: 'bold and experimental attitude' },
    { value: 'lazy', label: '慵懶', prompt: 'dreamy and languid mood' }
];

export const PHOTO_STYLES = [
    { value: 'studio', label: '棚拍時尚', prompt: 'high-end fashion editorial photography, realistic studio lighting, natural skin texture' },
    { value: 'cover', label: '雜誌封面感', prompt: 'magazine cover aesthetic, dramatic lighting, high contrast' },
    { value: 'catalog', label: '極簡型錄', prompt: 'minimalist catalog style, clean even lighting, neutral tones' }
];

export const STYLE_ANCHOR_PRESETS: StyleAnchorPreset[] = [
    {
        id: 'FRAME_04_CLASSIC',
        name: '經典幾何四分身',
        description: '平衡、穩定且具備建築美感的四重疊影。',
        params: { anchorType: 'geometry', cloneCount: 4, structureLayout: 'interlocking', poseSet: 'classic_4', hookIntensity: 'medium', outfitConsistency: 'identical', moodState: 'relaxed', photoStyle: 'studio' },
        promptSegment: 'four repeated instances of the same fashion model interacting with interlocking black rectangular frames, sitting, reclining, leaning, and inverted poses, subtle gravity-defying yet physically believable composition'
    },
    {
        id: 'FRAME_05_HOOK',
        name: '高鉤子幾何舞台',
        description: '極致的視覺張力，適合雜誌封面效果。',
        params: { anchorType: 'geometry', cloneCount: 5, structureLayout: 'suspended', poseSet: 'hook_5', hookIntensity: 'high', outfitConsistency: 'identical', moodState: 'cool', photoStyle: 'cover' },
        promptSegment: 'five identical clones of the same model positioned on suspended black frame platforms, bold gravity-defying poses with strong visual tension, editorial fashion lighting, clean shadows'
    },
    {
        id: 'PLANE_04_MINIMAL',
        name: '隱形平面極簡',
        description: '透過隱形的水平面創造空間錯覺，簡約而高級。',
        params: { anchorType: 'plane', cloneCount: 4, structureLayout: 'horizon', poseSet: 'sleek_3', hookIntensity: 'low', outfitConsistency: 'identical', moodState: 'stable', photoStyle: 'catalog' },
        promptSegment: 'four repeated instances of the same model interacting with invisible horizontal planes, minimalist fashion composition, subtle spatial illusion'
    },
    {
        id: 'FLIP_03_STATEMENT',
        name: '重力反轉宣言',
        description: '強烈的視覺對比，打破物理常規的先鋒感。',
        params: { anchorType: 'gravity', cloneCount: 3, structureLayout: 'edge', poseSet: 'sleek_3', hookIntensity: 'high', outfitConsistency: 'identical', moodState: 'avant_garde', photoStyle: 'cover' },
        promptSegment: 'three identical models, one upright and two inverted against the same environment, gravity-flipped orientation, strong visual contrast'
    }
];
