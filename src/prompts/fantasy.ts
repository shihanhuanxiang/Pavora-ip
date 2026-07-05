
import { FANTASY_RACES_V8, POSE_LIBRARY_V8, FANTASY_EXPRESSIONS_V8, FANTASY_SCENES_V8, FANTASY_JOBS_V8, PHOTO_LOCK_PROMPT, PHOTO_LOCK_NEGATIVES } from "../shared/constants/constants";
import { FANTASY_RACES_V3, FANTASY_JOBS_V3, FANTASY_POSES_V3, FANTASY_EXPRESSIONS_V3, FANTASY_RACES_V4, FANTASY_JOBS_V4, FANTASY_POSES_V4, FANTASY_EXPRESSIONS_V4, FANTASY_SCENES_V4, FANTASY_LIGHTING_V4, FANTASY_COMPOSITION_V4, FANTASY_CELESTIALS_V4, FANTASY_ATMOS_V4, FANTASY_MAGIC_CIRCLES_V4, FANTASY_COMPANIONS_V4 } from "../shared/constants/fantasyData";
import type { FantasyPresetV8, FantasyRace, FantasyJob } from "../shared/types/types";

// Ultra-Realistic Cosplay Photography Edition -> Upgraded to Fantasy Series
export const buildPromptV8 = (params: any) => {
    const { 
        gender, race, job, sceneId, lightingId, compositionId, poseId, expressionId, 
        identityLock, realism, 
        fxPractical, fxParticles, fxEnergy, fxTint, 
        bgMode, photoLock, garmentEraser,
        customScenePrompt,
        battleDamage, companion,
        aspectRatio,
        version
    } = params;
    
    const isV4 = version === 'v4';
    
    // --- Consistency Constant ---
    const FACE_CONSISTENCY_V4 = (target: string, category: string) => 
        `(RAW photo:1.2), high-end cosplay photography, full-frame sensor, ${target}. The face must be a 1:1 biometric reconstruction of the reference photo: identical eye shape, inner canthus detail, eyelid fold, precise nose bridge curvature, nose tip definition, exact philtrum and lip contour, jawline structure. Focus on primary facial landmarks and anatomical precision. Hair and hairstyle are FLUID and should adapt to the character's race and profession for maximum thematic synergy. Real human skin with visible pores, subtle imperfections, and natural light scattering.`;

    const PHOTO_QUALITY_V4 = (lens: string) => `shot on Sony A7R V with ${lens}, ISO 160, natural single-source lighting, soft environmental bounce. Professional on-location photography. Focus on [100% Reality Illusion]: microscopic skin pores, realistic metallic reflections and specular highlights on armor, fine peach fuzz on the face, realistic human skin oils, and microscopic skin imperfections. Deep organic shadows, natural highlights on the iris. Sharp subject focus with realistic shallow depth of field (bokeh). NO digital smoothing. Implementation of "Digital Lens Fingerprint": subtle chromatic aberration at contrast edges, realistic peripheral light falloff (vignetting), and textured out-of-focus highlights (cat-eye bokeh).`;

    // --- 0. POST-PROCESSING & CAMERA (Global) ---
    const GLOBAL_PHOTO_STYLE = "[PHOTOGRAPHY_SPECS]: Professional documentary-style location photography. Authentically tangible physical environment. Physical SFX makeup, practical hand-crafted props, and weathered high-end cosplay garments. Every element must look physically real and touchable. \n";
    const INTEGRATION_MANDATE = "[GROUNDING & INTEGRATION]: Subject must physically exist in the space. Real-world light physics: light wrap, skin-to-environment color bleeding, and natural ambient occlusion (AO) in crevices. No artificial digital 'glow' artifacts. Background elements are messy, organic, and unorganized as in a real forest or beach. \n";
    const ANATOMY_MANDATE = "[DE-DIGITIZATION PROTOCOL]: Absolute suppression of all CGI, 3D, and AI-smoothing presets. Force raw camera sensor aesthetics with slight ISO grain. Render skin with natural unevenness, subtle veins, microscopic texture, and anatomical micro-details like fine hair and skin blemishes. \n";

    const raceName = typeof race === 'string' ? race : race?.name;
    const jobName = typeof job === 'string' ? job : job?.name;

    // Use V4 data lists with more robust lookup
    const raceDef = FANTASY_RACES_V4.find(r => r.name === raceName || r.labelZh === raceName) || 
                    FANTASY_RACES_V4.find(r => r.labelZh.includes(raceName)) ||
                    (FANTASY_RACES_V4.length > 0 ? FANTASY_RACES_V4[0] : null);
    
    const jobDef = FANTASY_JOBS_V4.find(j => j.name === jobName || j.labelZh === jobName) || 
                   FANTASY_JOBS_V4.find(j => j.labelZh.includes(jobName)) ||
                   (FANTASY_JOBS_V4.length > 0 ? FANTASY_JOBS_V4[0] : null);

    const sceneDef = FANTASY_SCENES_V4.find(s => s.id === sceneId) || FANTASY_SCENES_V8.find(s => s.id === sceneId);
    const lightingDef = FANTASY_LIGHTING_V4.find(l => l.id === lightingId);
    const compositionDef = FANTASY_COMPOSITION_V4.find(c => c.id === compositionId);
    const poseDef = FANTASY_POSES_V4.find(p => p.id === poseId) || POSE_LIBRARY_V8.find(p => p.id === poseId) || FANTASY_POSES_V3.find(p => p.id === poseId);
    const expressionDef = FANTASY_EXPRESSIONS_V4.find(e => e.id === expressionId) || FANTASY_EXPRESSIONS_V8.find(e => e.id === expressionId) || FANTASY_EXPRESSIONS_V3.find(e => e.id === expressionId);

    // --- 1. PHOTOREALISM MANDATE (Enhanced) ---
    let prompt = isV4 ? `(RAW photo:1.2), [ULTRA-HIGH FIDELITY FANTASY TRANSFORMATION - 100% PHOTOREALISM & INTEGRATION MANDATE]\n` : `[REAL-WORLD COSPLAY PHOTOGRAPHY MANDATE: 100% PHOTOREALISM]\n`;
    
    prompt += GLOBAL_PHOTO_STYLE;
    prompt += INTEGRATION_MANDATE;
    prompt += ANATOMY_MANDATE;

    // Always enforce photographic style and quality
    const lensForQuality = compositionId === 'v5_comp_wide_14mm' ? 'Sony FE 14mm f/1.8 GM lens' : 
                         compositionId === 'v5_comp_85mm' ? 'Zeiss Batis 85mm f/1.8 lens' : 
                         'Zeiss G-Master lens';
    prompt += `Style Directive: MANDATORY - The output must be indistinguishable from a real-world photograph. Full-frame sensor aesthetics, natural light physics, human skin pores, and physical costume textures are required. Zero tolerance for painterly, digital, or CGI textures. \n`;
    prompt += `Camera Specs & Gear: ${PHOTO_QUALITY_V4(lensForQuality)} \n`;

    if (isV4) {
        prompt += `Core Directive: ${FACE_CONSISTENCY_V4(`${gender} ${raceDef?.labelZh || ''} ${jobDef?.labelZh || ''}`, 'profession and race')}\n\n`;
    }

    // --- 2. Identity & Costume (Moved up for better race/job adherence) ---
    if (!isV4) {
        prompt += `[COSPLAY IDENTITY]\nSubject: A real human ${gender} cosplayer dressed as a ${raceDef?.name || 'fantasy'} ${jobDef?.name || 'warrior'}.\n`;
    }
    
    // Gender-specific race prompt
    const racePrompt = gender === 'male' ? (raceDef?.prompt_male_en || raceDef?.prompt_en) : 
                      (gender === 'female' ? (raceDef?.prompt_female_en || raceDef?.prompt_en) : raceDef?.prompt_en);
    
    if (racePrompt) {
        prompt += `[RACE & HAIR INTEGRITY PROTOCOL]\n`;
        prompt += `Physical Race Traits: ${racePrompt}. These must be rendered as realistic SFX makeup, high-end prosthetics, or physical costume additions attached to a real human body.\n`;
        prompt += `Hair Mandate: Hairstyle and color MUST strictly adhere to the ${raceDef?.name} race and ${jobDef?.name} job lore. No deviations. If the race implies a specific color (e.g., silver for Dark Elf, natural fox colors for Kitsune), that color is ABSOLUTE. \n`;
        
        // Enhance Racial Anatomy (Stage 2)
        if (raceDef?.name === 'naga' || raceDef?.name === 'naga_m' || raceDef?.name === 'mermaid') {
            const tailType = (raceDef.name === 'naga' || raceDef.name === 'naga_m') ? 'long powerful serpent tail with overlapping realistic scales' : 'elegant shimmering biological mermaid tail with translucent fins';
            prompt += `CRITICAL ANATOMY OVERRIDE: The character MUST exhibit a ${tailType} beginning from the waist down. Human legs are ABSOLUTELY FORBIDDEN. Render the tail with biological realism: wet surface texture, irregular scale patterns, visible muscle movement under the skin, and organic slime sheen. NO LEGS. \n`;
        }

        if (raceDef?.features && raceDef.features.length > 0) {
            prompt += `Key Features: ${raceDef.features.join(', ')}. \n`;
        }
    }
    
    const jobPrompt = gender === 'male' ? (jobDef?.prompt_male_en || jobDef?.prompt_en) : 
                      (gender === 'female' ? (jobDef?.prompt_female_en || jobDef?.prompt_en) : jobDef?.prompt_en);

    if (jobPrompt) {
        const daringStyleManual = `[DESIGN PROTOCOL: ULTIMATE AVANT-GARDE]: This costume must follow an extremely daring, high-fashion experimental aesthetic. Move away from conservative layers. Implement a "form-sculpted" silhouette that emphasizes the natural human form with a focus on "clavicle beauty" and elegant necklines. Include bold strategic cutouts (entire back, and daring plunging necklines), asymmetric high-slits that showcase dynamic musculature, and body-mapped translucent panels. STICK TO HIGH-FASHION TAILORING: The costume MUST NOT feature rib-like, skeletal, or bone-shaped patterns; edges must be clean, smooth, and couture. Use a provocative mix of materials: tight high-gloss latex, shimmering body-con silk, and "haute-couture transparency" using delicate organza and air-thin mesh overlays. Every element must be precisely tailored to the body, emphasizing high-impact, daring professional cosplay photography. Zero modesty-layers; embrace an aesthetic that is both powerful and visually provocative.`;
        prompt += `Costume & Gear Detail: ${jobPrompt}. ${daringStyleManual}\n`;
        if (jobDef?.features && jobDef.features.length > 0) {
            prompt += `Equipment Features: ${jobDef.features.join(', ')}. \n`;
        }
    }

    prompt += `[PHYSIQUE, ANATOMY & MATERIAL PHYSICS]\n`;
    prompt += `Anatomy Focus: High-resolution detail on the clavicle (collarbone), neck-line, and shoulder structure. The collarbone must be elegantly defined with realistic skin micro-folds and light shadows. \n`;
    prompt += `Skin Detail: Authentic human skin, high-resolution micro-pores, visible skin texture, natural peach fuzz under rim light, subtle sweat sheen, realistic subcutaneous scattering (SSS). No plastic or doll-like skin. \n`;
    prompt += `Surface Detail: Realistic fabric weave (linen/silk/cotton) with visible fibers. Leather shows natural imperfections, grain, and creasing. Metal armor is rendered as hand-crafted physical props with micro-scratches, slight paint variations, and industrial manufacturing marks. Every garment must show a tight, "body-conscious" fit with correct material tension: fabric straining slightly at points of movement, leather conforming perfectly to curves, and detailed organic transitions where skin meets material. \n`;
    prompt += `Material Stress & Graphic Fidelity: Complex patterns, graphics, or logos on clothing must exhibit "Material Stress Logic": they must realistically twist, compress, and stretch following the deep folds and tension of the fabric. No flat graphical overlays. \n`;
    prompt += `Tactile Anatomy & Interaction: When hands interact with objects (grasping cloth, holding gear), fingertips must show realistic anatomical pressure: subtle skin displacement, slight whitening at pressure points, and correct tendon tension in the hand. \n`;
    prompt += `Extreme High-Fidelity Details: Include microscopic "Hyper-Real" artifacts: subtle sweat beads glistening on the collarbone or forehead under cinematic lighting, fine peach fuzz (vellus hair) catching the rim light on the jawline, and microscopic loose fibers/pilling on natural fabric surfaces. \n\n`;
    
    if (companion && companion !== 'none') {
        prompt += `Companion: A ${companion} following or standing beside the subject, interacting naturally.\n`;
    }
    
    prompt += `\n`;

    // --- 3. Staged Environment & Optical Protocol (Stage 3 Enhanced) ---
    prompt += `[STAGED CINEMATIC LOCATION, OPTICAL PROTOCOL & SOLO SUBJECT]\n`;
    prompt += `Solo Mandate: The subject is the primary and solitary focus. While foreground/background humans are strictly minimized, "Lifestyle Clutter" such as out-of-focus photography crew members, subtle motion-blurred bystanders, or distant crowds are permitted to enhance the "candid snapshot" realism and "on-set" authenticity. \n`;
    prompt += `Mandatory Override: Ignore any default backgrounds associated with the character's job or class. The environment MUST strictly match the specified location below.\n`;
    
    // Narrative & Companion (Fantasy 3.0) - Moved here for better visibility and context
    if (typeof battleDamage === 'number') {
        const damageDesc = battleDamage === 0 ? "Pristine condition: impeccably clean costume, spotless skin, perfectly groomed hair, vibrant fabric colors. High-maintenance and well-preserved look." :
                          (battleDamage === 1 ? "Light battle wear: minor surface scratches on armor finish, slightly disheveled hair, faint dust on fabric, subtle dirt smudges on skin and costume integration. Face shows faint sweat sheen." :
                          (battleDamage === 2 ? "Moderate battle damage: deep gashes in leather straps, cracked or dented metal armor plates, visible grime and mud splashes on clothes and limbs that match the environment's soil, singed fabric edges, clear dirt and sweat on face, neck, and arms, intense battle-hardened expression. Skin has visible smears of soot or soil." :
                          (battleDamage === 3 ? "Heavy battle damage: shattered equipment, blood-stained bandages, large tears in heavy fabric, broken armor buckles, exposed padding. The character's face, neck, limbs, and clothing are covered in thick environmental dirt, dried blood splatters, and heavy grime. Skin is visibly stained with grit and grease. Exhausted but heroic stance. Every prop and garment shows structural failure from combat and heavy environmental exposure." : "")));
        if (damageDesc) prompt += `[CHARACTER NARRATIVE OVERRIDE]: ${damageDesc}\n`;
    }

    if (customScenePrompt) {
        prompt += `Location: ${customScenePrompt}. Shot on location. Must be a physically real, tangible environment with organic dirt, moisture, and natural complexity. \n`;
    } else if (sceneDef) {
        prompt += `Environment: ${sceneDef.environment}. Shot on location in a real-world setting. Tangible environment physics: real mud, organic debris, weathered stone, and damp soil. \n`;
        prompt += `Cinematic Lighting Rig: ${sceneDef.lightingRig}. Natural global illumination with realistic environment light-wrap. \n`;
    }

    if (lightingDef) {
        prompt += `Lighting Focus: ${lightingDef.prompt}. ${lightingDef.description}. \n`;
    }

    // --- PHASE 1: OPTICAL & ATMOSPHERIC INTEGRATION ---
    prompt += `[GLOBAL ILLUMINATION & LIGHT WRAP PROTOCOL]\n`;
    prompt += `Environmental Color Mapping: Calculate the primary dominant colors of the background/environment and apply them as dynamic "Light Wrap" on the subject's edges. This creates a "glow spill" from the environment onto the hair fibers, skin curves, and garment edges. \n`;
    prompt += `Bounce Light Synergy: Implement realistic Global Illumination (GI). The environment's ambient color must bleed into the character's shadows and occluded areas (Ambient Occlusion). No black shadows; shadows must carry the tint of the surrounding space. \n`;
    prompt += `SSS Evolution: Advance Subsurface Scattering (SSS) based on environmental intensity. In bright scenes (like waterfalls or sun-drenched fields), skin translucency should be more pronounced at the ears, nostrils, and fingertips, showing a realistic warm blood-red glow through the flesh. \n`;
    prompt += `Atmospheric Depth: The air is not empty. Moderate volumetric lighting, microscopic air particles, and subtle haze that matches the environment's moisture level to glue the subject into the 3D space. \n\n`;

    // --- PHASE 2: SPATIAL & LENS ENGINEERING ---
    prompt += `[OPTICAL ENGINEERING & FOCAL PLANE CALIBRATION]\n`;
    prompt += `Focal Plane Integrity: Establish a rigorous 3D focal plane. The character's contact points with the ground (feet, knees) must be in tack-sharp focus, with a consistent depth-of-field transition matching the background's blur gradient. No floating subject. \n`;
    prompt += `Lens Artifacts: Infuse the frame with professional lens "flaws": minor lens flare if near light sources, subtle sensor grain, and organic peripheral blurring conforming to high-end prime lens optics. \n`;
    prompt += `Distortion Scale: For wide-angle compositions, apply "Anamorphic Scale Expansion": limbs or hands pointing towards the camera must exhibit realistic barrel distortion, appearing dramatically larger but maintaining correct anatomical foreshortening. \n\n`;

    // --- PHASE 3: LIFESTYLE NARRATIVE & ENVIRONMENTAL CLUTTER ---
    prompt += `[LIFESTYLE CLUTTER & NARRATIVE NOISE]\n`;
    prompt += `Behind-The-Scenes (BTS) Elements: Intentionally include realistic "on-set" artifacts. Subtle photography gear (light stands, C-stands, softbox edges, or camera cables) can be visible at the peripheries to ground the scene as a real-world production. \n`;
    prompt += `Environmental Debris: The air must contain physical narrative noise. Depending on the scene, include microscopic dust motes floating in light beams, drifting smoke, embers, or environmental sand particles (as in desert/ruin scenes). \n`;
    prompt += `Candid Imperfections: Reject the "perfectly posed" look. Include slightly disheveled hair strands, cloth movement blur, and organic background "messiness" (disorganized foliage, scattered stones, or urban grit). \n\n`;

    if (compositionDef) {
        prompt += `Composition Strategy: ${compositionDef.prompt}. ${compositionDef.description}\n`;
        if (aspectRatio) {
            prompt += `[ASPECT RATIO MANDATE]: The scene must be optimized for a ${aspectRatio} format. \n`;
        }
        if (compositionId === 'v5_comp_wide_14mm') {
            prompt += `Optical Physics (ULTRA-WIDE EPIC): Emphasize extreme perspective distortion and forced perspective. Use a dramatic worm's-eye view (extreme low angle). Elongated leading lines from the environment (massive pillars, towering trees, or jagged rocks) must frame the subject to create immense scale and vertical dominance. Foreground elements (rocks, debris, or foliage) must appear extremely large at the edges due to barrel distortion. Subject's limbs near edges are stretched for dynamic energy. The overall composition must feel visually overwhelming and spatially expansive. \n`;
        }
        prompt += `Optical Framing: Include subtle out-of-focus foreground elements (foliage, architectural remains, or light flares) to enhance depth and "on-set" realism. \n`;
    }
    prompt += `\n`;

    // --- 4. Performance & Dynamic Motion (Stage 3) ---
    prompt += `[COSPLAY PERFORMANCE & MOTION DYNAMICS]\n`;
    prompt += `Action/Pose: ${poseDef?.promptTemplate || 'standing'}.\n`;
    if (expressionDef) prompt += `Facial Expression: ${expressionDef.cues}.\n`;
    
    // Wind & Particle Dynamics
    if (poseDef?.intensity && poseDef.intensity >= 0.7) {
        prompt += `Motion Dynamics: Character is in motion. Hair and loose fabric are reacting to centrifugal force and ${fxPractical !== 'off' ? 'strong winds' : 'natural air flow'}. Background particles (dust/embers/leaves) follow the direction of movement.\n`;
    }
    prompt += `\n`;

    // --- 5. Practical FX & 3D Volumetric Magic (Stage 4 Enhanced) ---
    const mapIntensity = (l: string) => l === 'med' ? 'believable' : (l === 'high' ? 'intense but photoreal' : 'subtle');
    
    prompt += `[PRACTICAL VISUAL EFFECTS]\n`;
    if (fxPractical && fxPractical !== 'off') prompt += `Atmospheric FX: Realistic ${mapIntensity(fxPractical)} smoke/fog from a smoke machine on set.\n`;
    if (fxParticles && fxParticles !== 'off') prompt += `Practical Debris: ${mapIntensity(fxParticles)} physical embers, floating dust, or real debris particles in the air with depth-of-field bokeh.\n`;
    if (fxEnergy && fxEnergy !== 'off') prompt += `Light Spill: ${mapIntensity(fxEnergy)} practical LED elements or glowing energy arcs casting realistic color spill and light-wrap onto the character and environment.\n`;
    
    // 1. Magic Circle 3D Volumetric Projection (Stage 4)
    const magicCircleId = params.magicCircle || 'none';
    const magicCircleDef = FANTASY_MAGIC_CIRCLES_V4.find(m => m.id === magicCircleId);
    if (magicCircleDef && magicCircleDef.id !== 'none') {
        prompt += `3D Volumetric Magic Circle: ${magicCircleDef.prompt}. Rendered as a multi-layered 3D light projection and glowing holographic aura. The circle is NOT etched into the ground; it is a weightless projection of pure light hovering 1cm above the surface. The Magic Circle must cast an upward "under-lighting" effect on the character's face and garments, with realistic floor reflections and parallax depth between pulsating light rings. High-energy particles drifting upwards.\n`;
    }

    // 2. Job-Specific VFX Polish (Stage 4)
    if (jobDef?.name) {
        const lowerJob = jobDef.name.toLowerCase();
        if (lowerJob.includes('knight') || lowerJob.includes('warrior') || lowerJob.includes('paladin')) {
            prompt += `Job VFX: Include subtle kinetic vacuum waves follow the blade's path, and micro-metallic shards glinting in the light.\n`;
        } else if (lowerJob.includes('mage') || lowerJob.includes('wizard') || lowerJob.includes('sorcerer')) {
            prompt += `Job VFX: Arcane energy ribbons (subtle glowing filaments) swirling around the hands and staff with motion blur.\n`;
        } else if (lowerJob.includes('assassin') || lowerJob.includes('thief') || lowerJob.includes('ninja')) {
            prompt += `Job VFX: Faint void-smoke tendrils clinging to the shadows of the outfit, creating a blurring effect where the subject meets the darkness.\n`;
        }
    }

    // --- 5.8 CINEMATIC POST-PRODUCTION & COLOR (Stage 4 Final Polish) ---
    prompt += `\n[CINEMATIC POST-PRODUCTION PROTOCOL]\n`;
    prompt += `Color Grading: Deep high-contrast color grade. Teal-and-orange/Cold-Warm split (cold shadows, warm skin highlights). Cinematic HDR mapping with preserved detail in blacks and whites.\n`;
    
    if (fxTint && fxTint !== '#FFFFFF') {
        prompt += `In-Camera Color Filter: Cinematic ${fxTint} physical lens filter effect, affecting light bloom and atmosphere.\n`;
    }

    prompt += `Optical Fidelity: Subtle lens chromatic aberration at the frame edges, realistic film grain (Kodak 500T texture), and physical lens flares (anamorphic horizontal or subtle circular flare) integrated into the environment light sources.\n`;
    prompt += `Final Polish: Sharp focus on the subject's iris, realistic skin subsurface scattering (SSS), and tangible material depth. The final image must feel like a high-budget movie still, not a digital composite.\n`;

    // --- 5.5 ATMOSPHERIC OPTICS & INTEGRATION (Stage 3 Enhanced) ---
    prompt += `\n[ATMOSPHERIC OPTICS PROTOCOL]\n`;
    const atmosIntensity = params.atmosTyndall || 'off';
    const tyndallDef = FANTASY_ATMOS_V4.tyndall.find(t => t.id === atmosIntensity);
    if (tyndallDef && tyndallDef.prompt) {
        prompt += `Volumetric Logic: ${tyndallDef.prompt}. Light beams must realistically interact with the scene architecture and character silhouette, creating soft halos and bloom.\n`;
    }
    
    const manaIntensityNum = params.manaParticles || 'off';
    const manaDef = FANTASY_ATMOS_V4.mana.find(m => m.id === manaIntensityNum);
    if (manaDef && manaDef.prompt) {
        prompt += `Ambient Interaction: ${manaDef.prompt}. These effects act as subtle environmental particles (dust, sparks, or faint wisps) rather than bright magical elements. They must not overwhelm the subject's natural photography lighting.\n`;
    }

    const celestialId = params.celestialEvent || 'none';
    const celestialDef = FANTASY_CELESTIALS_V4.find(c => c.id === celestialId);
    if (celestialDef && celestialDef.id !== 'none') {
        prompt += `Celestial Illumination: ${celestialDef.prompt}. This event acts as the dominant global light source, dictating the color of shadows and highlights throughout the frame.\n`;
    }

    // --- 5.6 AMBIENT LIGHT & MATERIAL RESPONSE (V4 Enhanced) ---
    prompt += `\n[AMBIENT LIGHT & MATERIAL RESPONSE]\n`;
    
    // 1. Scene-Aware Rim Lighting (V4 Aware)
    const rimLightMap: Record<string, string> = {
        v4_scene_frozen_peak: "Cold crystalline blue rim light reflecting off ice surfaces onto the character silhouette.",
        v4_scene_ancient_temple: "Golden dust-filled rim lighting from high ceilings, highlighting historical artifacts and armor edges.",
        v4_scene_shadow_valley: "Eerie violet rim lighting from spiritual mist, creating a supernatural glow on the subject.",
        v4_scene_steampunk_city: "Warm orange and flickering yellow rim lights from gas lamps and industrial sparks.",
        v4_scene_celestial_throne: "Divine prismatic rim lighting, radiant white glow with soft lens flares.",
        volcano: "Intense orange rim lighting from lava below.",
        underwater: "Soft blue caustic light patterns rippling across the subject."
    };
    if (rimLightMap[sceneId]) prompt += `Rim Lighting: ${rimLightMap[sceneId]}\n`;

    // 2. Global Material Fidelity (Surface Physics)
    const materialIntensity = 'high'; // Forced to high for Fantasy Series 4.5
    const materialPrompt = {
        low: "Surface Physics: Realistic fabric and leather textures.",
        med: "Surface Physics: Advanced material properties, realistic light scattering on skin (SSS), visible stitching, weathered faux leather, practical props with metallic scuffing and worn edges.",
        high: "Surface Physics: Ultimate photographic realism. Every thread of the hand-woven fabric, every micro-scratch on hand-crafted armor, individual skin pores, natural skin blemishes, microscopic textures of aged leather. The costume must look like a high-end physical prop with natural weight and physical presence."
    };
    prompt += `${materialPrompt[materialIntensity as keyof typeof materialPrompt] || materialPrompt.med}\n`;

        // Environmental Material Interaction
        const interactionMap: Record<string, string> = {
            v4_scene_frozen_peak: "Material FX: Frost accumulation on eyebrows and armor, cold breath vapor, ice crystals in hair.",
            v4_scene_ancient_temple: "Material FX: Fine stone dust on clothes, glowing rune reflections on metallic surfaces.",
            v4_scene_shadow_valley: "Material FX: Shadows that seem to 'cling' to the outfit, purple mystical residue on weapons.",
            underwater: "Material FX: Wet skin and hair, shimmering water droplets, high specular reflections.",
            forest: "Material FX: Organic dirt stains, weathered natural textures, subtle moss."
        };
        if (interactionMap[sceneId]) prompt += `Environmental Interaction: ${interactionMap[sceneId]}\n`;
    
    // --- 5.7 ULTIMATE NARRATIVE: COMPANIONS (V4 Enhanced) ---
    prompt += `\n[ULTIMATE NARRATIVE ELEMENTS]\n`;
    
    // 2. Optimized Companion Interaction (V4 Enhanced)
    if (companion && companion !== 'none') {
        const companionDef = FANTASY_COMPANIONS_V4.find(c => c.id === companion);
        if (companionDef && companionDef.id !== 'none') {
            prompt += `Companion Protocol: ${companionDef.prompt} Must interact realistically with the character's lighting and shadow.\n`;
        } else {
            // Fallback for older IDs
            const companionMap: Record<string, string> = {
                dragon: "A small baby dragon perched on the character's shoulder.",
                mechanical: "A sleek cybernetic drone hovering beside the character.",
                spirit: "A translucent elemental wisp floating nearby.",
                beast: "A majestic mystic wolf standing loyally beside the character."
            };
            if (companionMap[companion]) prompt += `Companion: ${companionMap[companion]}\n`;
        }
    }

    // --- 6. Identity Locking ---
    if (photoLock) prompt += `\n${PHOTO_LOCK_PROMPT}\n`;
    
    // --- 7. Aggressive Anti-CGI Negative Prompt ---
    let negativePrompt = `\n[STRICT NEGATIVE PROMPT - DE-DIGITIZATION]\n`;
    negativePrompt += `(3D, CG, CGI, render, illustration, painting, drawing, anime, cartoon, video game, digital art, digital painting, unreal engine, octane render, v-ray, blender, keyshot, cinema4d:2.0), (glow-edges, internal lighting, emissive, neon, floating artifacts:1.4), (over-saturated, punchy colors:1.4), (plastic, doll-like, perfect skin, airbrushed, beauty-filter, smooth skin:1.8), artificial lighting, flat lighting, symmetrical composition, (fake wings, digital glitter:1.5), concept art, stylized, low quality, (third hand:2.0), (extra limbs:2.0), glowing skin, porcelain skin, raytracing, raytraced. `;
    
    // Defaulting garment erasure to always on (Stage 1 Mandate)
    negativePrompt += `(modern casual clothes:1.6), t-shirt, denim, jeans, logos, zippers, hoodies, sneakers, sunglasses, (digital watches), glasses, modern fabric patterns. `;

    if (photoLock) {
        negativePrompt += `${PHOTO_LOCK_NEGATIVES}`;
    }
    
    prompt += negativePrompt;

    return prompt;
};
