import { DEGREE_TO_RAD } from '@gglib/math'

// ---------------------------------------------------------------------------
// the player boat
// ---------------------------------------------------------------------------

export const LIVES = 3
export const MIN_SPEED = 5
export const MAX_SPEED = 22
/**
 * Acceleration with full throttle, deceleration when braking and without input, in units per second²
 */
export const ACCELERATION = 9
export const BRAKING = 16
export const DRAG = 1.5
/**
 * Half extents of the collision rectangle of the player boat, a bit smaller than the model
 */
export const BOAT_HALF_X = 0.7
export const BOAT_HALF_Z = 1.4
/**
 * Seconds after a crash in which the boat passes through obstacles
 */
export const INVULNERABLE = 2
export const GRAVITY = 18
/**
 * Points of a jump per unit of speed
 */
export const JUMP_POINTS = 10

// ---------------------------------------------------------------------------
// camera and screen
// ---------------------------------------------------------------------------

export const FOV = 50 * DEGREE_TO_RAD
/**
 * Elevation of the camera view: straight down when slow, tilted forward a little at full speed
 */
export const PITCH_SLOW = 90 * DEGREE_TO_RAD
export const PITCH_FAST = 45 * DEGREE_TO_RAD
/**
 * Share of the screen width that the river covers, up to {@link MAX_FIT_ASPECT}
 */
export const RIVER_SCREEN_WIDTH = 1 / 2.2
/**
 * Up to this aspect ratio the camera keeps the river at its share of the screen width. Wider screens use the camera
 * distance of this aspect and show more scenery on the sides, instead of moving closer and showing less ahead
 */
export const MAX_FIT_ASPECT = 16 / 9
/**
 * Seconds the points of a jump are shown
 */
export const POPUP_TIME = 1.2

export const STATUS = {
  ready: 'Press Up or touch to start',
  running: 'Racing',
  over: 'Game over. Press Space or touch to restart',
}

// ---------------------------------------------------------------------------
// the river
// ---------------------------------------------------------------------------

/**
 * Size of a block model, the models span -1 to 1. The scenery is a grid of blocks, a row of the river is one block
 * deep. Blocks are not scaled or rotated, only the tree trunks are thinner
 */
export const BLOCK = 2
/**
 * Height of the water surface, the top of the ground blocks at level 0 is at 0
 */
export const WATER_LEVEL = -0.2
/**
 * Half width of the river in blocks, the boats race along +z
 */
export const RIVER_HALF = 4
/**
 * Half width of the river in world units
 */
export const RIVER_WIDTH = RIVER_HALF * BLOCK
/**
 * Columns of a row: grass, sand, the river, sand, grass. They move with the river when it curves.
 * Wide enough for ultra wide screens, only the columns on the screen are placed
 */
export const SHORE_COLUMNS = 20
export const COLUMNS = 2 * (RIVER_HALF + SHORE_COLUMNS)
/**
 * Highest level of the hills, in blocks. The land never goes below level 0
 */
export const MAX_LEVEL = 2
/**
 * Rows that are kept in memory. The game only needs the rows on the screen and a section ahead
 */
export const ROW_CAPACITY = 256
/**
 * Lanes of the river, relative to its center. Obstacles are placed in lanes, so there is always a way around them
 */
export const LANES = [-6, -2, 2, 6]
export const INNER_LANES = [2, 6]
/**
 * The two columns of each lane, blocks are placed on them
 */
export const LANE_COLUMNS: Record<number, [number, number]> = { [-6]: [-7, -5], [-2]: [-3, -1], 2: [1, 3], 6: [5, 7] }
/**
 * Unused entities wait far below the scene, outside of the view
 */
export const PARKED_Y = -1000

// ---------------------------------------------------------------------------
// models
// ---------------------------------------------------------------------------

const BLOCKS = '/models/gltf/blocks/'
const WATERCRAFT = '/models/gltf/watercraft/'

/**
 * The models of the river. Paths are built once, the generator only passes them around
 */
export const MODELS = {
  water: `${BLOCKS}water.gltf`,
  sand: `${BLOCKS}sand_A.gltf`,
  grass: `${BLOCKS}grass.gltf`,
  snow: `${BLOCKS}grass_with_snow.gltf`,
  dirt: `${BLOCKS}dirt.gltf`,
  wood: `${BLOCKS}wood.gltf`,
  tree: `${BLOCKS}tree.gltf`,
  treeSnow: `${BLOCKS}tree_with_snow.gltf`,
  stone: `${BLOCKS}stone.gltf`,
  stoneDark: `${BLOCKS}stone_dark.gltf`,
  boat: `${WATERCRAFT}boat-speed-a.glb`,
  buoy: `${WATERCRAFT}buoy.glb`,
  buoyFlag: `${WATERCRAFT}buoy-flag.glb`,
  ramp: `${WATERCRAFT}ramp.glb`,
  rampWide: `${WATERCRAFT}ramp-wide.glb`,
  // the blue container can't be seen on the water, it only lies on land
  containerBlue: `${WATERCRAFT}cargo-container-b.glb`,
}
export const PROPS = ['crate', 'barrel', 'hay_bale', 'stone', 'stone_dark', 'melon'].map((it) => `${BLOCKS}${it}.gltf`)
export const STONES = [MODELS.stone, MODELS.stoneDark]
export const CONTAINERS = ['cargo-container-a', 'cargo-container-c'].map((it) => `${WATERCRAFT}${it}.glb`)
export const CARGO = ['cargo-pile-a', 'cargo-pile-b'].map((it) => `${WATERCRAFT}${it}.glb`)
export const TRAFFIC = ['boat-row-small', 'boat-row-large', 'boat-fishing-small', 'boat-tug-a', 'boat-sail-a'].map(
  (it) => `${WATERCRAFT}${it}.glb`,
)
/**
 * The first traffic models are row boats, they are low and a jump passes above them
 */
export const LOW_TRAFFIC = 2
