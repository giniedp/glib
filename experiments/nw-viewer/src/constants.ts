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
/**
 * Loads only the smaller mips of split DDS material textures instead of the merged texture (merge=partial in nwbt).
 * The textures are allocated with their full mip chain, only the loaded mips are sampled (Texture.residentMipLevel).
 * Impostor and terrain textures are always loaded in full.
 */
export const PARTIAL_TEXTURES = false
/**
 * Largest mip size that is loaded for partial textures
 */
export const PARTIAL_TEXTURE_SIZE = 256
/**
 * Renders meshes with an instance array (InstancedMeshComponent) with GPU culling and indirect draws.
 * Disabled: indirect draws are expensive per call and level objects have few instances per draw.
 * Measured at x=5500 y=600: all level objects 82ms vs 37ms, instance arrays only 25ms vs 16.8ms (median frame).
 * The regular render path already merges instances of the same mesh into instanced draws per frame.
 */
export const ENABLE_INSTANCED_LEVEL_OBJECTS = false
/**
 * Creates a single entity for all instances of an instance array (InstancedMeshComponent) instead of one entity per instance.
 * Reduces the number of entities, spatial nodes and bounds, culling happens per instance array.
 */
export const COMBINE_INSTANCE_ARRAYS = true
/**
 * Scales the max view distance of distribution meshes, 0 ignores the view distance
 */
export const DISTRIBUTION_VIEW_DISTANCE_SCALE = 1

/**
 * Renders the baked vegetation of the region.vegetation files (mostly groundcover)
 */
export const ENABLE_VEGETATION = true
/**
 * Vegetation is rendered up to this distance. Lumberyard spawns a 13x13 grid of 16m sectors around the camera.
 */
export const VEGETATION_VISIBLE_DISTANCE = 104
/**
 * Cells within visible distance + margin are uploaded, so they are ready when they become visible
 */
export const VEGETATION_LOAD_MARGIN = 16
/**
 * Cells beyond visible distance + margin are released
 */
export const VEGETATION_UNLOAD_MARGIN = 32
/**
 * Number of cells a region can keep loaded at once (each cell holds up to 1024 instances)
 */
export const VEGETATION_SLOT_COUNT = 320
export const VEGETATION_CELL_UPLOADS_PER_FRAME = 16

/**
 * Range activation of slice entities (meshes, lights with a view distance), see RangeActivationSystem.
 * Smallest range class, also the cell size of the finest grid. Smaller ranges are rounded up.
 * Ranges are bucketed into power of two classes, the cell size of a class equals its range.
 */
export const RANGE_CLASS_MIN = 32
/**
 * Largest range class, larger ranges are clamped (1.5% of the meshes, up to 80km).
 */
export const RANGE_CLASS_MAX = 4096
/**
 * Entities activate at their range and deactivate at range * hysteresis
 */
export const RANGE_HYSTERESIS = 1.1
/**
 * A range class is re-evaluated when the camera moved this fraction of its cell size
 */
export const RANGE_UPDATE_DISTANCE_FACTOR = 1 / 64
/**
 * Time budget for entity activations per frame
 */
export const RANGE_ACTIVATION_BUDGET_MS = 2

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
    visibleFor: 1,
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
  // rocks and structures, capitals hand over at the start of this span.
  // Starts one cell out (128), so chunk slices that spawn at 384 have time to load before their meshes are needed
  // (chunk meshes are active up to CHUNK_MESH_RANGE = start + fade + one cell)
  impostorPoi: {
    start: 0.5,
    visibleFor: 9.5,
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

/**
 * Caps the view distance of meshes in coatgen chunk slices at the POI impostor hand-over.
 *
 * Chunk slices carry the editor computed view distance (several km) and no impostor flag,
 * the source slices of their content are flagged with impostorFarDistance in their .slice.meta.
 */
export const ENABLE_CHUNK_RANGE_CLAMP = true
/**
 * Distance at which POI impostors are fully faded in
 */
export const IMPOSTOR_POI_HANDOVER_RANGE = lodSpanStart(LOD_SPANS.impostorPoi) + POI_IMPOSTOR_FADE_LENGTH
/**
 * View distance cap of meshes in chunk slices.
 *
 * One impostor cell beyond the hand-over: a POI impostor cell covers many meshes and disappears per pixel
 * at the start of its span, so the meshes of the whole cell must be active by then.
 */
export const CHUNK_MESH_RANGE = IMPOSTOR_POI_HANDOVER_RANGE + SEGMENT_SIZE
/**
 * Mesh chunk sizes whose loading holds their cell's POI impostor (see RegionImpostorComponent cell state).
 * Chunks of other sizes are activated with their cell but do not delay it.
 */
export const IMPOSTOR_HOLD_CHUNK_SIZES: number[] = [128]
/**
 * Dither fade-in of POI impostors (start of their span + POI_IMPOSTOR_FADE_LENGTH).
 *
 * TODO: disabled until the impostor dither can be switched per cell. A cell that holds its impostor while its
 * chunk meshes load must not discard its near pixels.
 */
export const ENABLE_POI_IMPOSTOR_DITHER = true
