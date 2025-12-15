/**
 * Maximum Fidelity / Physically Grounded Image Synthesis System Prompt
 * 
 * This prompt ensures the image generation engine maximizes physically plausible detail
 * at the given resolution without smearing, abstraction, or shortcut artifacts.
 */

export const IMAGE_FIDELITY_SYSTEM_PROMPT = `
ROLE: Precision image synthesis engine

OBJECTIVE: Maximize physically plausible detail at the given resolution without smearing, abstraction, or shortcut artifacts; maintain coherent structure from foreground to background.

PRIME DIRECTIVE: Resolve structure first, then texture, then micro-wear. If detail is not resolvable at current pixel density, adjust camera/framing/focal length/distance to make it resolvable rather than faking it with blur/noise.

PRIORITY ORDER FOR CONFLICT RESOLUTION:
1. Correct subject geometry & anatomy (hands, faces, limbs, perspective)
2. Lighting & shadow coherence (single consistent light model unless explicitly multi-source)
3. Material identity (physically readable: roughness/metalness/SSS/IOR)
4. Edges & contact physics (contact shadows, occlusion, compression, grime boundaries)
5. Count & uniqueness (exact counts when feasible; otherwise reframe or acknowledge limits)
6. Background fidelity (structurally coherent, context-appropriate, not empty or smeared)

LEVEL OF DETAIL BUDGETING:
- Focal Zone: Fully resolved geometry plus microtexture where physically plausible. Micro-shadowing from surface relief (avoid flat albedo look). Contamination and micro-wear consistent with temporal state.
- Mid Zone: Clear primary forms, readable secondary texture at appropriate scale. Reduced micro-wear unless it materially affects appearance.
- Far Zone: No blobification - retain structural identity (windows/branches/figure structure). Atmospheric perspective only if physically motivated (haze/fog); not a blur substitute. Do not use DoF blur to hide missing modeling.

MATERIAL NON-NEGOTIABLES (No Texture Collapse):
Any visible material must show scale-appropriate physical cues; do not rely on color alone.
- Skin: pores (when close), vellus hair, SSS color zones, micro-creases
- Metal: micro-scratches, fingerprints/oil, anisotropy where relevant, edge nicks
- Fabric: weave/knit logic, tension folds, seam compression, lint/pilling
- Wood: grain continuity, knots, finish variation, edge wear
- Plastic: mold seams/gate marks, micro-scuffs, orange peel, dust
- Glass: thickness, IOR/refraction, edge tint, smudges, internal reflections

EDGES AND CONTACT PHYSICS (No Edge Simplification):
Required:
- Contact shadows + ambient occlusion at intersections
- Compression/deformation under load (fabric/skin/soft materials)
- Transfer/contamination at boundaries (rust stains, grime lines, oil sheens)
- Edge condition consistent with age (sharp vs worn vs frayed vs corroded)
Forbidden:
- Glow outlines
- Airbrushed boundary transitions

COUNT AND UNIQUENESS POLICY:
- If an exact quantity is requested, render the exact count when feasible
- If unresolvable at resolution or framing: adjust framing/crop/focal length to make elements countable, reduce scope via composition while preserving intent
- For repeated elements: non-identical silhouettes, pose/accessory/wear variation, avoid clone patterns, mirroring, and repeated faces

BACKGROUND REQUIREMENTS (Secondary Subject, No Neglect):
- Context-coherent objects appropriate to the setting
- Same lighting model as the foreground
- Structurally readable (not gradients/texture soup)
- Detail proportional to depth and optics (no cliff-drop to zero)

PROHIBITED SHORTCUTS (Artifact Avoidance):
Unless physically or optically justified, avoid:
- Gaussian-blurred backgrounds used as a substitute for missing detail
- Noise foliage / noise crowds / texture-only buildings
- Radial-gradient eyes/lights
- Unreadable pseudo-text used as label texture
- Merged/extra/missing fingers; deformed teeth; melted jewelry
- Smeared speculars that break light direction

TEXT RULE:
- If text not requested: Avoid signage/labels entirely to prevent gibberish
- If text requested: Render clean, legible, correctly spelled typography with correct perspective, lighting, and material integration; no faux text

SELF-CHECK BEFORE FINAL:
- Materials identifiable by physics (not just color)
- Light direction, shadow softness, and bounce light consistent
- Edges and contact shadows present at all intersections
- Anatomy and perspective correct (hands/eyes/limbs/scale)
- Repeated elements are non-cloned and non-mirrored
- Distant objects retain structural coherence (not blobs/smears)
- Requested counts satisfied or feasibility handled via reframing/explicit limitation
`;

/**
 * Camera and lighting declaration template for structured prompts
 */
export interface CameraConfig {
  focalLength?: string;        // e.g., "35mm", "85mm macro"
  viewpointHeight?: string;    // e.g., "eye-level", "low angle", "bird's eye"
  focusDistance?: string;      // e.g., "2 meters", "infinity"
  aperture?: string;           // e.g., "f/1.8", "f/8"
  compositionIntent?: string;  // e.g., "subject centered", "rule of thirds"
}

export interface LightingConfig {
  keyLight?: {
    direction: string;
    softness: string;
    colorTemperature: string;
    intensity: string;
  };
  fillLight?: {
    sourceType: string;
    directionBias: string;
    intensityRatio: string;
  };
  rimLight?: {
    position: string;
    purpose: string;
    intensity: string;
  };
  practicals?: Array<{
    location: string;
    falloff: string;
    color: string;
    shadowCasting: boolean;
  }>;
}

export interface MaterialState {
  name: string;
  baseColorVariation: string;
  roughnessVariation: string;
  microSurfaceDetail: string;
  contamination: string;        // dust/oil/water spots
  edgeWearCharacter: string;
}

export interface TemporalState {
  condition: 'new' | 'lightly-used' | 'used' | 'well-worn' | 'aged' | 'antique';
  wearDrivers: string[];        // UV/handling/weather/heat/abrasion
  localizedWearExamples: string;
}

/**
 * Builds a detailed camera and lighting declaration for the prompt
 */
export function buildCameraLightingPrompt(
  camera?: CameraConfig,
  lighting?: LightingConfig
): string {
  const parts: string[] = [];

  if (camera) {
    parts.push(`CAMERA SETUP:`);
    if (camera.focalLength) parts.push(`- Lens: ${camera.focalLength}`);
    if (camera.viewpointHeight) parts.push(`- Viewpoint: ${camera.viewpointHeight}`);
    if (camera.focusDistance) parts.push(`- Focus distance: ${camera.focusDistance}`);
    if (camera.aperture) parts.push(`- Aperture: ${camera.aperture}`);
    if (camera.compositionIntent) parts.push(`- Composition: ${camera.compositionIntent}`);
  }

  if (lighting) {
    parts.push(`\nLIGHTING DECLARATION:`);
    if (lighting.keyLight) {
      parts.push(`- Key light: ${lighting.keyLight.direction}, ${lighting.keyLight.softness}, ${lighting.keyLight.colorTemperature}, intensity ${lighting.keyLight.intensity}`);
    }
    if (lighting.fillLight) {
      parts.push(`- Fill: ${lighting.fillLight.sourceType}, ${lighting.fillLight.directionBias}, ratio ${lighting.fillLight.intensityRatio}`);
    }
    if (lighting.rimLight) {
      parts.push(`- Rim/accent: ${lighting.rimLight.position}, ${lighting.rimLight.purpose}, intensity ${lighting.rimLight.intensity}`);
    }
    if (lighting.practicals && lighting.practicals.length > 0) {
      for (const p of lighting.practicals) {
        parts.push(`- Practical: ${p.location}, ${p.color}, falloff ${p.falloff}, ${p.shadowCasting ? 'casts shadows' : 'ambient only'}`);
      }
    }
  }

  return parts.join('\n');
}

/**
 * Builds a materials and temporal state prompt section
 */
export function buildMaterialsPrompt(
  materials: MaterialState[],
  temporalState?: TemporalState
): string {
  const parts: string[] = [];

  if (materials.length > 0) {
    parts.push(`TOP MATERIALS/SURFACES:`);
    for (const mat of materials) {
      parts.push(`- ${mat.name}: ${mat.baseColorVariation}, roughness ${mat.roughnessVariation}, ${mat.microSurfaceDetail}, contamination (${mat.contamination}), edges ${mat.edgeWearCharacter}`);
    }
  }

  if (temporalState) {
    parts.push(`\nTEMPORAL STATE:`);
    parts.push(`- Condition: ${temporalState.condition}`);
    parts.push(`- Wear drivers: ${temporalState.wearDrivers.join(', ')}`);
    parts.push(`- Localized wear: ${temporalState.localizedWearExamples}`);
  }

  return parts.join('\n');
}

/**
 * Optional model-dependent enhancement tags
 * Use sparingly to avoid token dilution
 */
export const FIDELITY_ENHANCEMENT_TAGS = [
  'ultra-detailed',
  'physically based rendering',
  'coherent global illumination',
  'high-frequency microtexture',
  'contact shadow fidelity',
  'no cloning',
  'no symmetry mirroring',
  'no smear artifacts'
];

/**
 * Get the full fidelity prompt with optional enhancement tags
 */
export function getFullFidelityPrompt(includeEnhancementTags: boolean = true): string {
  let prompt = IMAGE_FIDELITY_SYSTEM_PROMPT;
  
  if (includeEnhancementTags) {
    prompt += `\n\nENHANCEMENT DIRECTIVES: ${FIDELITY_ENHANCEMENT_TAGS.join(', ')}.`;
  }
  
  return prompt;
}
