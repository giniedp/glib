import { CommonInputs, inputSlotScalar, inputSlotVec3 } from '@gglib/graphics'

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

    PaniniBlend: inputSlotScalar('view', 'paniniBlend'),
    PaniniDistance: inputSlotScalar('view', 'paniniDistance'),
    PaniniScale: inputSlotScalar('view', 'paniniScale'),
  },
  Global: {
    SunDirection: inputSlotVec3('global', 'sunDirection'),
    SunColor: inputSlotVec3('global', 'sunColor'),
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
