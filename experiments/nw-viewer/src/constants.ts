export const REGION_SIZE = 2048
export const MOUNTAIN_HEIGHT = 2048
export const SEGMENT_SIZE = 128
export const HEIGHTMAP_TILE_SIZE = 256
export const QUAD_LEAF_SIZE = 32
export const MATERIAL_TEXTURE_SIZE = 512
export const LOD_RANGE_FACTOR = 2
export const SHOW_TERRAIN_LINES = false

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
    visibleFor: 4,
    keepAliveFor: 1,
  },
  impostorPoi: {
    start: 0,
    visibleFor: 6,
    keepAliveFor: 1,
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
