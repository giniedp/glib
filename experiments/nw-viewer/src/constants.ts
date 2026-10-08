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
 * TEMPORARY: the game renders thinner fog than the time of day parameters give with a scale of 1.
 * The source of the runtime value is unknown (not in the slices, possibly the weather system). Tuned by eye.
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
 * Mesh chunk sizes whose loading holds their cell's POI impostor (see RegionImpostorComponent cell state).
 * Chunks of other sizes are activated with their cell but do not delay it.
 */
export const IMPOSTOR_HOLD_CHUNK_SIZES: number[] = [128]
