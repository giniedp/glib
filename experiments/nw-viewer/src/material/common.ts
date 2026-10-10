import {
  CommonInputs,
  inputSlotBuffer,
  inputSlotScalar,
  inputSlotTexture,
  inputSlotVec3,
  inputSlotVec4,
  TRUE,
} from '@gglib/graphics'

export const InputBlocks = {
  Global: 'global',
  View: 'view',
  Frame: 'frame',
  Object: 'object',
  Material: 'material',
  Lights: 'lights',
}

export const InputSlots = {
  /**
   * Forward+ light data, written by the LightSystem. Shared by all materials.
   */
  Lights: {
    /**
     * xyz = cluster grid dimensions, w = light count
     */
    ClusterGrid: inputSlotVec4('lights', 'clusterGrid'),
    /**
     * x = near, y = far, z = slice scale, w = slice bias
     */
    ClusterDepth: inputSlotVec4('lights', 'clusterDepth'),
    /**
     * Storage buffer with all light records
     */
    LightList: inputSlotBuffer('lights', 'lightList'),
    /**
     * Storage buffer with offset and count per cluster
     */
    LightClusters: inputSlotBuffer('lights', 'lightClusters'),
    /**
     * Storage buffer with light indices referenced by the clusters
     */
    LightIndices: inputSlotBuffer('lights', 'lightIndices'),
  },
  /**
   * Sun shafts post process (SunShaftsPass), not bound by materials
   */
  SunShafts: {
    /**
     * x = active, y = rays attenuation, z = shafts amount, w = rays amount
     */
    Params: inputSlotVec4('sunShafts', 'params'),
    /**
     * rgb = rays color (SunShafts_SunCol), already scaled by the rays amount
     */
    Color: inputSlotVec4('sunShafts', 'color'),
  },
  View: {
    ViewMatrix: CommonInputs.View.ViewMatrix,
    ProjectionMatrix: CommonInputs.View.ProjectionMatrix,
    CameraPosition: CommonInputs.View.CameraPosition,
  },
  Global: {
    SunColor: inputSlotVec4('global', 'sunColor'),
    SunDirection: inputSlotVec3('global', 'sunDirection'),
    CloudShadingSunColor: inputSlotVec3('global', 'cloudShadingCustomSunColor'),
    CloudShadingSkyColor: inputSlotVec3('global', 'cloudShadingCustomSkyColor'),

    VolumetricFogParams: inputSlotVec4('global', 'volumetricFogParams'),
    VolumetricFogRampParams: inputSlotVec4('global', 'volumetricFogRampParams'),
    VolumetricFogColorGradientParams: inputSlotVec4('global', 'volumetricFogColorGradientParams'),
    VolumetricFogColorGradientRadial: inputSlotVec4('global', 'volumetricFogColorGradientRadial'),
    VolumetricFogColorGradientBase: inputSlotVec4('global', 'volumetricFogColorGradientBase'),
    VolumetricFogColorGradientDelta: inputSlotVec4('global', 'volumetricFogColorGradientDelta'),

    BottomFogColor: inputSlotVec3('global', 'bottomFogColor'),
    BottomFogHeight: inputSlotScalar('global', 'bottomFogHeight'),
    BottomFogDensity: inputSlotScalar('global', 'bottomFogDensity'),
    TopFogColor: inputSlotVec3('global', 'topFogColor'),
    TopFogHeight: inputSlotScalar('global', 'topFogHeight'),
    TopFogDensity: inputSlotScalar('global', 'topFogDensity'),
    FogHeightOffset: inputSlotScalar('global', 'fogHeightOffset'),
    FogNear: inputSlotScalar('global', 'fog_near'),
    FogFar: inputSlotScalar('global', 'fog_far'),
    /**
     * xyz = ocean fog color (sun tinted), w = density (log2 base)
     */
    OceanFogColorDensity: inputSlotVec4('global', 'oceanFogColorDensity'),
    /**
     * Ocean water level (PerFrame_WaterLevel.z), {@link NO_OCEAN_LEVEL} when the level has no ocean
     */
    OceanLevel: inputSlotScalar('global', 'oceanLevel'),
    /**
     * Stand-in for the probe ambient within the range of ambient lights, zero when disabled (AMBIENT_LIGHT_MODE)
     */
    FakeProbeAmbient: inputSlotVec3('global', 'fakeProbeAmbient'),
    /**
     * PerFrame_VolumetricFogScatteringColor, xyz = sun color times the atmosphere fog albedo
     */
    FogScatteringColor: inputSlotVec4('global', 'fogScatteringColor'),
    /**
     * Volumetric fog 2 parameters, see VolFog2Params in volumetricFog2.wgsl.ts
     */
    VolFog2HeightDensity: inputSlotVec4('global', 'volFog2HeightDensity'),
    VolFog2Ramp: inputSlotVec4('global', 'volFog2Ramp'),
    VolFog2Scattering: inputSlotVec4('global', 'volFog2Scattering'),
    VolFog2Blend: inputSlotVec4('global', 'volFog2Blend'),
    FogScatteringSecondaryColor: inputSlotVec4('global', 'fogScatteringSecondaryColor'),
    /**
     * Ambient in-scattering of the volumetric fog 2, stand-in for the global environment probe
     */
    VolFog2Ambient: inputSlotVec4('global', 'volFog2Ambient'),
    /**
     * Zenith fade of the volumetric fog 2, x = factor, y = curve exponent
     */
    VolFog2Zenith: inputSlotVec4('global', 'volFog2Zenith'),
    VolFog2Enabled: inputSlotScalar('global', 'volFog2Enabled'),

    Debug: inputSlotScalar('global', 'debug'),
    /**
     * When set to 1, materials skip fog (deferred to the fog pass). Set by the opaque pass
     */
    SkipFog: inputSlotScalar('global', 'skipFog'),
    EnvMap: inputSlotTexture('global', 'envMap'),
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
  DEBUG_SH_SPECULAR_AA: 307,

  // Terrain virtual texture
  DEBUG_VT_MIP: 400,
  DEBUG_VT_NO_MACRO: 401,
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
  /**
   * Entities that are not active when their slice is instantiated (isRuntimeActive = false),
   * e.g. alternative states switched by scripts or cutscenes. Hidden by default (camera visibility mask).
   */
  Inactive: 1 << 11,
  /**
   * Water volume surfaces (rivers, water volumes)
   */
  WaterVolume: 1 << 12,
}

const FLAGS_ARRAY = [
  'ADVANCED',
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
  'LOCAL_WEATHER',
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

export function setDitherFadeConstants(
  constants: Record<string, number>,
  options: {
    mode: 'in' | 'out'
    start: number
    end: number
  },
) {
  constants['DITHER_FADE_MODE'] = options.mode === 'in' ? 1 : 2
  constants['DITHER_FADE_START'] = options.start
  constants['DITHER_FADE_END'] = options.end
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

// Lumberyard uses:
// float4      SPIBendInfo;
// float4      SPIBendInfoPrev;
// float4      SPIAmbientOpacity;
// float4      SPIDissolveRef;
// TODO: replace single value setter with full row writer: setInstanceDissolveRef

export function setInstanceMaxViewDistance(instance: Float32Array, value: number) {
  instance[0] = value
}

export function setInstanceDissolveAmount(instance: Float32Array, value: number) {
  instance[1] = value
}

export function createInstanceData(options: { maxViewDistance?: number; dissolveAmount?: number }) {
  const data = new Float32Array(16)
  if (options.maxViewDistance != null) {
    setInstanceMaxViewDistance(data, options.maxViewDistance)
  }
  if (options.dissolveAmount != null) {
    setInstanceDissolveAmount(data, options.dissolveAmount)
  }
  return data
}
