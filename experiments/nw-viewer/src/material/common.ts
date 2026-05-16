export const NwBindingKeys = {
  Environment: {
    SunDirection: 'env.sunDirection',
    SunColor: 'env.sunColor',
    BottomFogColor: 'env.bottomFogColor',
    BottomFogHeight: 'env.bottomFogHeight',
    BottomFogDensity: 'env.bottomFogDensity',
    TopFogColor: 'env.topFogColor',
    TopFogHeight: 'env.topFogHeight',
    TopFogDensity: 'env.topFogDensity',
    FogHeightOffset: 'env.fogHeightOffset',
    FogNear: 'env.fog_near',
    FogFar: 'env.fog_far',
  },
  Settings: {
    Debug: 'settings.debug',
  },
} as const

export const DebugOptions = {
  DEBUG_OFF: 0,
  DEBUG_MTL_BASE: 1,
  DEBUG_MTL_SPEC: 2,
  DEBUG_MTL_PBR: 3,
  DEBUG_NORMALS: 4,
  DEBUG_TANGENTS: 5,
  DEBUG_BINORMALS: 6,
  DEBUG_COLOR1: 7,
  DEBUG_COLOR2: 8,
  DEBUG_UV1: 9,
  DEBUG_UV2: 10,
} as const
