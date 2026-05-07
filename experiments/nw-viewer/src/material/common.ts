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
  _None: 0,
  MetallicRougnessIOR: 1,
  Normals: 2,
  UVs: 3,
  Color: 4,
} as const
