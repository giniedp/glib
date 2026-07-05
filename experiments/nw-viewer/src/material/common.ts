import { CommonInputs, inputSlotScalar, inputSlotVec3, TRUE } from '@gglib/graphics'

export const InputBlocks = {
  Global: 'global',
  View: 'view',
  Frame: 'frame',
  Object: 'object',
  Material: 'material',
}

export const InputSlots = {
  View: {
    ViewMatrix: CommonInputs.View.ViewMatrix,
    ProjectionMatrix: CommonInputs.View.ProjectionMatrix,
    CameraPosition: CommonInputs.View.CameraPosition,
  },
  Global: {
    SunDirection: inputSlotVec3('global', 'sunDirection'),
    SunColor: inputSlotVec3('global', 'sunColor'),
    CloudShadingSunColor: inputSlotVec3('global', 'cloudShadingCustomSunColor'),
    CloudShadingSkyColor: inputSlotVec3('global', 'cloudShadingCustomSkyColor'),
    BottomFogColor: inputSlotVec3('global', 'bottomFogColor'),
    BottomFogHeight: inputSlotScalar('global', 'bottomFogHeight'),
    BottomFogDensity: inputSlotScalar('global', 'bottomFogDensity'),
    TopFogColor: inputSlotVec3('global', 'topFogColor'),
    TopFogHeight: inputSlotScalar('global', 'topFogHeight'),
    TopFogDensity: inputSlotScalar('global', 'topFogDensity'),
    FogHeightOffset: inputSlotScalar('global', 'fogHeightOffset'),
    FogNear: inputSlotScalar('global', 'fog_near'),
    FogFar: inputSlotScalar('global', 'fog_far'),
    Debug: inputSlotScalar('global', 'debug'),
  },
}

export const DebugOptions = {
  DEBUG_OFF: 0,
  // Material
  DEBUG_MTL_ALBEDO: 1,
  DEBUG_MTL_SPECULAR: 2,
  DEBUG_MTL_METALLIC: 3,
  DEBUG_MTL_ROUGHNESS: 4,
  DEBUG_MTL_IOR: 5,
  DEBUG_MTL_EMISSIVE: 6,
  DEBUG_MTL_AO: 7,
  DEBUG_MTL_OPACITY: 8,
  DEBUG_MTL_HEIGHT: 9,
  DEBUG_MTL_NOISE: 10,

  // Geometry / vectors
  DEBUG_GV_NORMAL: 100,
  DEBUG_GV_TANGENT: 101,
  DEBUG_GV_BITANGENT: 102,
  DEBUG_GV_SHADE_NORMAL: 103,
  DEBUG_GV_POSITION_WS: 104,
  DEBUG_GV_DEPTH: 105,

  // Vertex attributes
  DEBUG_V_COLOR0: 200,
  DEBUG_V_COLOR1: 201,
  DEBUG_V_UV0: 202,
  DEBUG_V_UV1: 203,
  DEBUG_V_UV3: 204,
  DEBUG_V_UV4: 205,
  DEBUG_V_UV5: 206,
  DEBUG_V_DEFORM: 207,

  // Shading components
  DEBUG_SH_DIFFUSE: 300,
  DEBUG_SH_SPECULAR: 301,
  DEBUG_SH_SHADOW: 302,
  DEBUG_SH_AMBIENT: 303,
  DEBUG_SH_REFLECTION: 304,
  DEBUG_SH_FRESNEL: 305,
  DEBUG_SH_COUNT: 306,
} as const

export const MaterialLayerMasks = {
  Common: 1 << 0,
  Terrain: 1 << 1,
  Illum: 1 << 2,
  Vegetation: 1 << 3,
  Glass: 1 << 4,
  GeometryFog: 1 << 5,
  GeometryBeam: 1 << 6,
  DistanceClouds: 1 << 7,
  Meshparticle: 1 << 8,
  FxMeshAdvanced: 1 << 9,
  ParticleImposter: 1 << 10,
}

const FLAGS_ARRAY = [
  'ALLOW_SILHOUETTE_POM',
  'ALLOW_SPECULAR_ANTIALIASING',
  'ALLOW_TESSELATION',
  'ALPHAMASK_DETAILMAP',
  'ANISO_SPECULAR',
  'APPLY_FOG_COLOR',
  'APPLY_SUN_COLOR',
  'BILINEAR_FP16',
  'BLENDLAYER_UV_SET_2',
  'BLENDLAYER',
  'BLUR_REFRACTION',
  'BUMP_MAP',
  'COLOR_LOOKUP',
  'COLOR_SAMPLER_OVERLAY_MASK',
  'DECAL_MAP',
  'DECAL',
  'DEFORMATION',
  'DEPTH_FIXUP',
  'DEPTH_FOG',
  'DETAIL_BENDING',
  'DETAIL_MAPPING',
  'DIFFUSE_MAP_2',
  'DIFFUSE_MAP_3',
  'DIFFUSE_MAP_4',
  'DIRECTION_MAP',
  'DIRT_MAP',
  'DIRTLAYER',
  'DISPLACEMENT_MAPPING',
  'EMISSIVE_DECAL',
  'EMITTANCE_MAP_UV_SET_2',
  'EMITTANCE_MAP',
  'ENABLE_FADEOUT',
  'ENFORCE_TILED_SHADING',
  'ENVIRONMENT_MAP',
  'FLOW_MAP',
  'FLOW',
  'FOAM',
  'FX_ADVANCED_SS',
  'FX_DISSOLVE',
  'FX_SS_CUSTOM_DIR',
  'GLOW_FRESNEL',
  'GLOW_MAP',
  'GRADIENT_ALPHA',
  'GRASS',
  'HAIR_PASS',
  'HAS_DECAL_LAYERS',
  'IS_GDE_IMPOSTOR',
  'IS_POI_IMPOSTOR',
  'LEAVES',
  'NOISE',
  'NORMAL_MAP',
  'OCCLUSION_MAP',
  'OFFSET_BUMP_MAPPING',
  'OVERLAY_MASK',
  'PARALLAX_OCCLUSION_MAPPING',
  'PHONG_TESSELLATION',
  'PN_TESSELLATION',
  'RECEIVE_SHADOWS',
  'REFRACTION_TINTING',
  'REFRACTION',
  'RIM_BLEND',
  'RIM_DIFFUSE_LIGHTING',
  'RIM_SPEC_LIGHTING',
  'SAA_FILTERING',
  'SCREEN_SPACE_DEFORMATION',
  'SIGNED_DISTANCE_FIELD_2D',
  'SILHOUETTE_PARALLAX_OCCLUSION_MAPPING',
  'SIMPLE',
  'SOFT_PARTICLE',
  'SOLID_HAIR',
  'SPEC_MAP',
  'SPECULAR_LIGHTING',
  'SPECULAR_MAP',
  'SPRITESHEET_MATERIAL',
  'SSREFL',
  'SUBSURFACE_SCATTERING_MASK',
  'SUBSURFACE_SCATTERING',
  'SUN_SHINE',
  'SUN_SPECULAR',
  'TEMP_SKIN',
  'TEMP_TERRAIN',
  'TEMP_VEGETATION',
  'THIN_HAIR',
  'TINT_COLOR_MAP',
  'TINT_MAP',
  'TRANSMITTANCE',
  'TRANSPARENT_ZPREPASS',
  'UNLIT',
  'USE_ADVANCED_DISSOLVE',
  'USE_AS_BEAMPROC',
  'USE_COMPLEX_COL_DODGE',
  'USE_COMPLEX_COL_OVERLAY',
  'USE_COMPLEX_COL',
  'USE_FRESNEL_DISSOLVE_MASK',
  'USE_FX_NORMAL_PARAMS',
  'USE_GLOW_FRESNEL',
  'USE_INSIDE_FRESNEL_ALPHA',
  'USE_INTERSECTION_FADE',
  'USE_INTERSECTION_GLOW',
  'USE_OUTSIDE_FRESNEL_ALPHA',
  'USE_PALETTE_MAP',
  'USE_PROC_GRADS',
  'USE_SDF_2D',
  'USE_STENCIL_DISSOLVE_MASK',
  'UV_VIGNETTING',
  'VERT_DEFORM_SINWAVE',
  'VERTCOLORS',
  'VERTICAL_GRADIENT',
  'WATER_TESSELLATION_DX11',
] as const

export type FeatureFlag = (typeof FLAGS_ARRAY)[number]

export const FeatureFlags = new Set<FeatureFlag>(FLAGS_ARRAY)

export function getShaderFlags(genMask: string | null): Set<FeatureFlag> {
  const result = new Set<FeatureFlag>()
  for (const feature of (genMask || '').toUpperCase().split('%')) {
    if (feature) {
      result.add(feature as FeatureFlag)
    }
  }
  return result
}

export function getShaderConstants(flags: Set<FeatureFlag>) {
  const constants: Record<string, number> = {}
  for (const feature of flags) {
    if (FeatureFlags.has(feature)) {
      constants[feature] = TRUE
    }
  }
  return constants
}

export const MaterialMapNames = new Set([
  'Diffuse',
  'Bumpmap',
  'Specular',
  'Environment',
  'Detail',
  'SecondSmoothness',
  'Heightmap',
  'Decal',
  'SubSurface',
  'Custom',
  '[1] Custom',
  'Opacity',
  'Smoothness',
  'Emittance',
  'Occlusion',
  'Specular2',
  '[2] Custom',
  '[3] Custom',
  '[4] Custom',
  '[5] Custom',
  '[5] Smoothness',
])
