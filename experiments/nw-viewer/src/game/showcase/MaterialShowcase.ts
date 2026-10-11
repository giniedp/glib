import {
  boxGeometry,
  Color,
  cylinderGeometry,
  planeGeometry,
  sphereGeometry,
  type Device,
  type Geometry,
} from '@gglib/graphics'
import { mat4$preRotateZ, mat4$preTranslateXYZ, mat4CreateRotationX, type Mat4 } from '@gglib/math'

/**
 * An item of a material showcase set, shown on its own shader stage
 */
export interface MaterialShowcaseItem {
  label: string
  /**
   * The material on the stage primitives (sphere, box, cylinder, sheet)
   */
  material?: string
  /**
   * Sub material index, all sub materials are shown if omitted
   */
  index?: number
  /**
   * A model on the stage, with its own material (vegetation needs real vertex data: bending, vertex colors)
   */
  model?: string
  /**
   * Shows the material on a water volume surface instead of the shader ball (water volume shaders need the
   * surface geometry and fog parameters)
   */
  water?: boolean
}

export interface MaterialShowcaseSet {
  label: string
  description: string
  /**
   * Time of day in hours the set is best reviewed at, e.g. night for emissive and additive effects
   */
  time?: number
  items: MaterialShowcaseItem[]
}

/**
 * Neutral grey Illum material of the stage floor and wall
 */
export const SHOWCASE_STAGE_MATERIAL = 'materials/references/base_colors/grey_01.mtl'

/**
 * Common materials per shader. Picked by usage (number of open world regions, tmp/asset-analysis/levels.jsonl) and
 * feature flags (StringGenMask), see tmp/showcase/pick-materials.mjs.
 */
export const MATERIAL_SHOWCASE_SETS: Record<string, MaterialShowcaseSet> = {
  illum: {
    label: 'Illum',
    description: 'props, rocks, bark, decals, emittance',
    items: [
      {
        label: 'plain',
        material: 'objects/crafting/props/props_sandworm/tarps/sw_legion_struc_support_tarp_01_mat.mtl',
        index: 0,
      },
      { label: 'sacks', material: 'objects/crafting/props/storage/sacks/jav_prp_sacks_mat.mtl', index: 1 },
      {
        label: 'blend layer, POM',
        material: 'objects/nature/rock_boulders/boulders_forest/jav_fst_boulder_md_a_mat.mtl',
        index: 0,
        model: 'objects/nature/rock_boulders/boulders_forest/jav_fst_boulder_md_a.cgf',
      },
      {
        label: 'detail map',
        material: 'objects/nature/rock_boulders/boulders_flint/jav_boulder_flint_sm_a_mat.mtl',
        index: 0,
      },
      {
        label: 'vertex colors (bark)',
        material: 'objects/nature/veg_trees/trees_forest/pine/jav_fst_pinetree_a_mat.mtl',
        index: 0,
      },
      {
        label: 'decal (ore veins)',
        material: 'objects/nature/rock_boulders/boulders_ore/jav_boulder_ironore_a_mat.mtl',
        index: 1,
        model: 'objects/nature/rock_boulders/boulders_ore/jav_boulder_ironore_d.cgf',
      },
      {
        label: 'emittance (lantern)',
        material: 'objects/crafting/props/lighting/lantern/glasslantern/jav_prp_glasslantern_mat.mtl',
        index: 1,
      },
      {
        label: 'emittance (coal)',
        material: 'objects/crafting/props/lighting/fireplacepile/jav_prp_fireplacepile_mat.mtl',
        index: 1,
      },
      {
        label: 'alpha test (foliage cards)',
        material: 'objects/nature/veg_bramble/bramble_forest/pinecone/jav_fst_pinecone_a_mat.mtl',
        index: 1,
      },
      {
        label: 'transparent',
        material: 'objects/nature/rock_cliffs/cliffs_world/jav_wld_waterfall_cliff_g_vfx01.mtl',
        index: 0,
      },
    ],
  },
  glass: {
    label: 'Glass',
    description: 'bottles, candle holders',
    items: [
      {
        label: 'candle holder',
        material: 'objects/crafting/props/lighting/candleholders/jav_prp_candleholders_mat.mtl',
        index: 2,
      },
      {
        label: 'bottles',
        material: 'objects/crafting/props/shopwares/alchemyprops/jav_prp_alchemyprops.mtl',
        index: 1,
      },
      {
        label: 'demijohns',
        material: 'objects/crafting/props/housewares/demijohns/jav_prp_demijohns_mat.mtl',
        index: 1,
      },
      {
        label: 'cartography',
        material: 'objects/crafting/props/shopwares/cartography/jav_prp_cartography_mat.mtl',
        index: 1,
      },
    ],
  },
  vegetation: {
    label: 'Vegetation',
    description: 'bushes, grass, flowers',
    items: [
      {
        label: 'honeysuckle',
        model: 'objects/nature/veg_bushes/bushes_mountain/honeysuckle/jav_mtn_honeysuckle_b.cgf',
      },
      {
        label: 'rhododendron',
        model: 'objects/nature/veg_bushes/bushes_mountain/rhododendron/jav_mtn_rhododendron_c.cgf',
      },
      { label: 'pawpaw', model: 'objects/nature/veg_bushes/bushes_forest/pawpaw/jav_fst_pawpawbush_b.cgf' },
      { label: 'sea oats', model: 'objects/nature/veg_grass/grass_coast/maritimegrass/jav_cst_seaoatsgrass_b.cgf' },
      { label: 'daisy', model: 'objects/nature/veg_grass/grass_forest/flowers/jav_fst_flower_daisy_a.cgf' },
      { label: 'medium grass', model: 'objects/nature/veg_grass/grass_forest/mediumgrass/jav_fst_medgrass_a.cgf' },
    ],
  },
  fx: {
    label: 'FX meshes',
    description: 'FxMeshAdvanced, Meshparticle',
    time: 22,
    items: [
      { label: 'lava flow', material: 'materials/vfx/enviroment/lava/lava_flow_base_01.mtl' },
      { label: 'magma ball', material: 'materials/vfx/solids/magmaball_02.mtl' },
      { label: 'corrupted orb', material: 'materials/vfx/corruption/corrupted_orb_vfx_black_2.mtl' },
      {
        label: 'teleporter water (transp)',
        material: 'materials/vfx/procedural/teleporter_water_procedural_1_alt.mtl',
      },
      { label: 'capture point (transp)', material: 'materials/vfx/misc/capturepoint_blue_alpha.mtl' },
      { label: 'light ray card (meshparticle)', material: 'materials/vfx/lightrays/fx_lightraycard02.mtl' },
      { label: 'portal sphere (meshparticle)', material: 'objects/vfx/mesh/fx_portalsphere01.mtl' },
    ],
  },
  volumetrics: {
    label: 'Volumetrics',
    description: 'fog sheets, light beams, fog imposters',
    time: 22,
    items: [
      { label: 'fog sheet ghost', material: 'objects/volumetrics/fogsheet_ghost_close_mat.mtl' },
      { label: 'ground fog', material: 'objects/volumetrics/fogsheet_groundfog_cool.mtl' },
      { label: 'fog sphere fire', material: 'objects/volumetrics/fogsphere_fire_mat.mtl' },
      { label: 'layered fog (simple)', material: 'materials/climax/vfx/layered_fog.mtl' },
      { label: 'jump pad ring (simple)', material: 'materials/vfx/jumppads/vfx_jumppad_ring_01.mtl' },
      { label: 'light beam (geometryfog)', material: 'objects/volumetrics/beam_dungeon_lightblue_mat.mtl' },
      {
        label: 'fog flat (particleimposter)',
        material: 'objects/landmarks/brightwood_tree/brightwood_fog_flat_02.mtl',
      },
    ],
  },
  water: {
    label: 'Water',
    description: 'water volumes',
    items: [
      { label: 'default river', material: 'materials/river/defaultriver.mtl', water: true },
      { label: 'azoth well flow', material: 'materials/vfx/azothwell/jav_fst_azothwell_a_flow.mtl', water: true },
    ],
  },
}

/**
 * Size of a shader stage cell
 */
export const SHOWCASE_STAGE_WIDTH = 4
export const SHOWCASE_STAGE_DEPTH = 3

/**
 * Vertex layout of the material previews. Vertex colors are white: the builder default is black, and materials
 * multiply by vertex colors (VERTCOLORS) or blend by them (BLENDLAYER, vegetation bending).
 * Volumetric shaders (GeometryBeam, GeometryFog) also fade by vertex alpha: `1 - exp2(-f * a * a)`, 1 is visible.
 */
const GEOMETRY_OPTIONS = {
  vertexLayout: [['position', 'normal', 'tangent', 'bitangent', 'texture', 'color']] as any,
  vertexDefaults: { color: [Color.packToRGBA(Color.White)] },
}

/**
 * Transform from the y up primitive builders to the z up world: rotation about x by 90° (y → z),
 * then a rotation about z and a translation
 */
function place(x: number, y: number, z: number, rotateZ = 0, rotateX = Math.PI / 2): Mat4 {
  const m = mat4CreateRotationX(rotateX)
  mat4$preRotateZ(m, rotateZ)
  return mat4$preTranslateXYZ(m, x, y, z)
}

/**
 * The neutral stage of a cell: a floor plate (top at z = 0) and a back wall at +y
 */
export function createStageGeometries(device: Device): Geometry[] {
  return [
    boxGeometry(device, {
      ...GEOMETRY_OPTIONS,
      vertexTransform: place(0, 0, -0.1),
      width: SHOWCASE_STAGE_WIDTH,
      height: 0.2,
      depth: SHOWCASE_STAGE_DEPTH,
    }),
    boxGeometry(device, {
      ...GEOMETRY_OPTIONS,
      vertexTransform: place(0, SHOWCASE_STAGE_DEPTH / 2 - 0.1, 1.25),
      width: SHOWCASE_STAGE_WIDTH,
      height: 2.5,
      depth: 0.2,
    }),
  ]
}

/**
 * The shader ball arrangement of a cell. Every primitive intersects the stage or another primitive,
 * so depth aware effects (soft edges, fog volumes, decals) have something to work with:
 * - a sphere sunk into the floor
 * - a box pushed into the back wall
 * - a cylinder standing on the floor
 * - a vertical sheet crossing the floor and the sphere (fog sheets, light cards)
 */
export function createShaderBallGeometries(device: Device): Geometry[] {
  return [
    sphereGeometry(device, {
      ...GEOMETRY_OPTIONS,
      vertexTransform: place(-0.9, 0.1, 0.4),
      radius: 0.6,
    }),
    boxGeometry(device, {
      ...GEOMETRY_OPTIONS,
      vertexTransform: place(0.7, 1.1, 0.35, 30 * (Math.PI / 180)),
      size: 0.9,
    }),
    cylinderGeometry(device, {
      ...GEOMETRY_OPTIONS,
      vertexTransform: place(1.35, -0.6, 0.6),
      radius: 0.3,
      height: 1.4,
      closeTop: true,
      closeBottom: true,
    }),
    // y up plane (normal +y) turned upright, facing -y (the camera), rotated a little about z
    planeGeometry(device, {
      ...GEOMETRY_OPTIONS,
      vertexTransform: place(-0.4, -0.5, 0.55, -15 * (Math.PI / 180), Math.PI),
      width: 2,
      depth: 1.4,
    }),
  ]
}

/**
 * A large neutral ground below the stages, for contrast against the bright sky
 */
export function createGroundGeometry(device: Device, size = 400): Geometry {
  return planeGeometry(device, {
    ...GEOMETRY_OPTIONS,
    vertexTransform: place(0, 0, -0.25),
    width: size,
    depth: size,
  })
}

/**
 * Shape of the water surface of a water item, in cell space: the surface is at the top (z = 0.3),
 * crossing the sphere, the cylinder and the stage wall
 */
export const SHOWCASE_WATER_SHAPE = {
  kind: 'box' as const,
  center: [0, 0, 0.15] as [number, number, number],
  halfExtents: [SHOWCASE_STAGE_WIDTH / 2 - 0.1, SHOWCASE_STAGE_DEPTH / 2, 0.15] as [number, number, number],
}
