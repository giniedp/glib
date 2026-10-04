export const REGION_SIZE = 2048
export const MOUNTAIN_HEIGHT = 2048
export const SEGMENT_SIZE = 128
export const HEIGHTMAP_TILE_SIZE = 256
export const QUAD_TREE_LEAF_SIZE = 32
export const TERRAIN_TILE_TEXTURE_SIZE = 512
export const TERRAIN_TILE_TEXTURE_MIP_COUNT = 1
export const TERRAIN_LOD_RANGE_FACTOR = 2

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
export const ENABLE_CAPITALS = true
export const ENABLE_DISTRIBUTION = true

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
  // vegetation impostors, distribution hands over at the start of this span.
  // The distribution culls instances by cell, an instance can be one cell diagonal further away than its cell.
  // Instances must not reach their max view distance (trees 255, bushes 270) before the impostor shows,
  // so start + cell diagonal (181) must stay below the max view distance of trees and bushes.
  impostor: {
    start: 0.5,
    visibleFor: 9.5,
    keepAliveFor: 4,
  },
  // rocks and structures, capitals hand over at the start of this span
  impostorPoi: {
    start: 2,
    visibleFor: 8,
    keepAliveFor: 4,
  },
  // vegetation impostors take over beyond the visible span, so visible span must end where impostors start
  distribution: {
    start: 0,
    visibleFor: 0.5,
    keepAliveFor: 0,
  },
}

/**
 * Width of the dithered crossfade between the distribution and the vegetation impostors.
 * The band ends where the impostor span starts, impostor cells are activated early enough to cover it.
 */
export const IMPOSTOR_FADE_RANGE = 16
/**
 * Fade in distance of POI impostors after the start of their span (gImpostorsFadeDistance in illum.cfx)
 */
export const POI_IMPOSTOR_FADE_LENGTH = 20
/**
 * Fade out distance of the groundcover vegetation before VEGETATION_VISIBLE_DISTANCE
 */
export const VEGETATION_FADE_LENGTH = 24

export function lodSpanStart(span: LodSpan) {
  return span.start * SEGMENT_SIZE
}
export function lodSpanVisibleEnd(span: LodSpan) {
  return (span.start + span.visibleFor) * SEGMENT_SIZE
}
export function lodSpanEnd(span: LodSpan) {
  return (span.start + span.visibleFor + span.keepAliveFor) * SEGMENT_SIZE
}
