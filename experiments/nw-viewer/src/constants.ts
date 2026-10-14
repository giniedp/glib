export const REGION_SIZE = 2048
export const SEGMENT_SIZE = 128
export const QUAD_TREE_LEAF_SIZE = 32
export const TERRAIN_LOD_RANGE_FACTOR = 2

// terrain virtual texture, see coatlicue-terrain.cfx and the GPA capture findings
// world size of a page at mip m is VT_PAGE_WORLD_SIZE * 2^m
export const VT_TEXELS_PER_METER = 256
export const VT_PAGE_SIZE = 512
export const VT_PAGE_WORLD_SIZE = VT_PAGE_SIZE / VT_TEXELS_PER_METER
export const VT_MIP_COUNT = 8
export const VT_PAGE_CAPACITY = 640
// texel to pixel ratio for the page selection, 1 = page texel density matches the screen pixel density
// at perpendicular view, higher values keep detail at grazing angles
export const VT_LOD_QUALITY = 1.5

/**
 * How ambient only lights (light component flag Ambient) are rendered.
 *
 * Ambient lights do not emit light, they multiply the ambient lighting of the environment probes
 * (lerp(1, color, attenuation), TiledShading.cfi).
 *
 * - `fake-probe`: like modulate, and adds FAKE_PROBE_AMBIENT within the range of the ambient lights as a stand-in
 *   for the missing probe ambient. Designers place ambient lights where probes are, so indoor areas get a base ambient
 *   while open terrain is not affected.
 * - `modulate`: multiply the ambient lighting we have (sky IBL), as the original does with the probe ambient
 * - `skip`: ignore them
 * - `direct`: render them as regular direct lights, adds light the original does not have
 */
export const AMBIENT_LIGHT_MODE: 'fake-probe' | 'modulate' | 'skip' | 'direct' = 'fake-probe'
/**
 * Base ambient (linear rgb) within the range of ambient lights, see AMBIENT_LIGHT_MODE `fake-probe`.
 * Not taken from the game data, tuned by eye.
 */
export const FAKE_PROBE_AMBIENT: [number, number, number] = [0.5, 0.5, 0.5]

/**
 * Fog with the analytical volumetric fog 2 (VOLFOG2_* time of day parameters), like the game.
 * When disabled the legacy fog (VOLFOG_* and FOG_COLOR* parameters) is used, which New World does not tune.
 */
export const ENABLE_VOLUMETRIC_FOG_2 = true
/**
 * Scales the distance in the volumetric fog 2 (PerFrame_FogDistanceScale.x in the shader).
 *
 * 1 in all GPA captures. An earlier value of 0.5 was tuned by eye to compensate for the fog pass reconstructing
 * its view rays with the camera entity transform instead of the inverse view matrix (fixed).
 */
export const FOG_DISTANCE_SCALE = 0.5

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
 * Size of the merged material textures (`merge=true&size=N`), same as the `--texture-size` of nwbt (pnpm dev:nwbt)
 * that it uses for the textures of its glTF files
 */
export const MATERIAL_TEXTURE_SIZE = 1024
/**
 * Requests the `.cgfheap` of a model only after its `.cgf` is parsed, and only if the file references heap data.
 *
 * Off: `.cgf` and `.cgfheap` are requested in parallel (one round trip). Files of the old format (inline vertex data,
 * 0.7% of the files) have no heap, their heap request fails with 404.
 * On: no heap request for those files, but one more round trip per model.
 */
export const CGF_HEAP_AFTER_PARSE = false
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
 * Renders level objects with their levels of detail (`$lodN` nodes and `_lodN.cgf` sibling files)
 */
export const ENABLE_MODEL_LOD = true
/**
 * A level of detail with at most this many triangles is cheap enough, coarser sibling files are not requested.
 *
 * @remarks
 * Saves the failing request of the probe after the last level: in the paks 46% of the last levels have at most
 * 128 triangles. A skipped coarser level would have even fewer triangles.
 */
export const LOD_PROBE_MIN_TRIANGLES = 128

/**
 * Base view distance of road decals, scaled by the road ViewDistanceMultiplier
 */
export const ROAD_VIEW_DISTANCE = 256

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

export type LodSpan = {
  start: number
  visibleFor: number
  keepAliveFor: number
}

export const ENABLE_IMPOSTOR_VEG = true
export const ENABLE_IMPOSTOR_POI = true
export const ENABLE_DISTRIBUTION = true
export const ENABLE_VEGETATION = true
export const ENABLE_CAPITALS = true
export const ENABLE_CHUNKS = true

/**
 * Distance from camera to where impostor begin, where game objects fade out and impostor fades in
 */
export const IMPOSTOR_VISIBILITY_START = SEGMENT_SIZE * 1.5

/**
 * Distance from camera to maximum distance where impostor are still visible
 */
export const IMPOSTOR_VISIBILITY_END = SEGMENT_SIZE * 6

/**
 * Range
 */
export const IMPOSTOR_LOAD_RANGE = SEGMENT_SIZE * 0.25

/**
 * Width of the dithered crossfade between the distribution and the vegetation impostors.
 * The band ends where the impostor span starts, impostor cells are activated early enough to cover it.
 */
export const IMPOSTOR_FADE_RANGE = 20
/**
 * Fade out distance of the groundcover vegetation before VEGETATION_VISIBLE_DISTANCE
 */
export const VEGETATION_FADE_RANGE = 24

/**
 * View distance cap of meshes in chunk slices.
 *
 * One impostor cell beyond the hand-over: a POI impostor cell covers many meshes and disappears per pixel
 * at the start of its span, so the meshes of the whole cell must be active by then.
 */
export const CHUNK_MESH_RANGE = IMPOSTOR_VISIBILITY_START + IMPOSTOR_FADE_RANGE
/**
 * Mesh chunk sizes whose meshes hold their cell's POI impostor (see RegionImpostorComponent cell state).
 * Chunk meshes have no impostor flag (see ViewerMeshComponent.impostor), the large chunks hold the far visible meshes.
 */
export const IMPOSTOR_HOLD_CHUNK_SIZES: number[] = [128, 64, 32]

/**
 * Collision shape assets are loaded for debug display within this distance of the camera
 */
export const COLLISION_DEBUG_RANGE = 128
/**
 * Maximum number of collision shape assets that load at the same time
 */
export const COLLISION_LOAD_CONCURRENCY = 32
/**
 * Player capsule radius in grounded movement mode
 */
export const PLAYER_RADIUS = 0.4
/**
 * Player capsule height (feet to head) in grounded movement mode
 */
export const PLAYER_HEIGHT = 1.8
/**
 * Camera height above the feet in grounded movement mode
 */
export const PLAYER_EYE_HEIGHT = 1.7
/**
 * Ground up to this height above the feet is stepped onto instantly
 */
export const PLAYER_STEP_HEIGHT = 0.5
/**
 * Constant fall speed in m/s (no acceleration) when the ground is below the feet
 */
export const PLAYER_FALL_SPEED = 20
/**
 * Collider shapes are loaded for the player within this distance (grounded movement mode)
 */
export const COLLISION_PLAYER_RANGE = 64
/**
 * Maximum number of collider shape assets the collision worker loads at the same time for the player
 */
export const COLLISION_PLAYER_LOAD_CONCURRENCY = 16
/**
 * Cell size of the collision worker's spatial grid in meters
 */
export const COLLISION_GRID_CELL_SIZE = 16
/**
 * Collider filters that never block the player (e.g. projectile only colliders), compared to `ViewerColliderComponent.filter`
 */
export const COLLISION_NON_BLOCKING_FILTERS: readonly string[] = []
/**
 * The culling worker culls with a frustum widened by this fraction (tangent of the half field of view), so objects
 * do not pop in at the screen edges while turning, its results are 1–2 frames late
 */
export const WORKER_CULLING_FOV_MARGIN = 0.15
/**
 * Maximum number of cull requests that wait for the culling worker
 */
export const WORKER_CULLING_IN_FLIGHT = 2
