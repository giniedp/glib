export const REGION_SIZE = 2048
export const MOUNTAIN_HEIGHT = 2048
export const SEGMENT_SIZE = 128
export const HEIGHTMAP_TILE_SIZE = 256
export const QUAD_LEAF_SIZE = 32
export const MATERIAL_TEXTURE_SIZE = 512
export const LOD_RANGE_FACTOR = 2
export const SHOW_TERRAIN_LINES = true

export const POM_DISPLACEMENT = 0.25 // in world units -> 0.25 / QUAD_LEAF_SIZE
export const POM_BIAS = 0.0
export const POM_SELF_SHADOW_STRENGTH = 2.0
export const MACRO_VIEW_DISTANCE = 1000
export const MACRO_BLEND_DISTANCE = 100
export const MACRO_WORLD_SIZE = REGION_SIZE
export const ALBEDO_MULTIPLIER = 8.0
export const MAX_ANISOTROPY = 4.0
export const MAX_MIP_LEVELS = 8.0

export const ENABLE_IMPOSTORS = true
export const ENABLE_CAPITAL_INDICATOR = false
export const ENABLE_ENTITY_INDICATOR = false

export const REGION_VISIBILITY = 4 * SEGMENT_SIZE
export const SEGMENT_VISIBILITY = 4 * SEGMENT_SIZE

export type LodSpan = {
  start: number
  visibleFor: number
  keepAliveFor: number
}

export const LOD_SPANS = {
  capital: {
    start: 0,
    visibleFor: 2,
    keepAliveFor: 1,
  },
  impostor: {
    start: 0,
    visibleFor: 8,
    keepAliveFor: 4,
  },
  impostorPoi: {
    start: 0,
    visibleFor: 8,
    keepAliveFor: 4,
  },
}

export function lodSpanStart(span: LodSpan) {
  return span.start * SEGMENT_SIZE
}
export function lodSpanVisibleEnd(span: LodSpan) {
  return (span.start + span.visibleFor) * SEGMENT_SIZE
}
export function lodSpanEnd(span: LodSpan) {
  return (span.start + span.visibleFor + span.keepAliveFor) * SEGMENT_SIZE
}
