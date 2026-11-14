import { boolean, choice, defineConfig, integer, number } from './properties'

/**
 * Runtime settings of the viewer
 *
 * @remarks
 * Constants of `constants.ts` are moved here one by one. Constants that are not really configurable,
 * or are hard to pass through the config, stay constants.
 */
export const viewerConfigSchema = defineConfig({
  audioEnabled: boolean({
    description:
      'Plays the ambient audio. When saved, audio starts with the first click or key press (autoplay policy).',
    editable: true,
    default: false,
    group: 'Audio',
  }),

  renderResolution: choice({
    description:
      'Render size in pixels. window follows the window size (device pixels), a fixed size keeps the resolution ' +
      'and is displayed by renderScaling.',
    editable: true,
    options: ['window', '1280x720', '1600x900', '1920x1080', '2560x1440', '3840x2160'],
    default: 'window',
    group: 'Display',
  }),

  renderScaling: choice({
    description: 'Display of a fixed render resolution.',
    editable: true,
    options: [
      'fit', // scales the image into the window and keeps the aspect ratio
      'none', // unscaled, centered and cropped if larger than the window
    ],
    default: 'fit',
    group: 'Display',
  }),

  renderScale: choice({
    description:
      'Render resolution relative to the window (renderResolution window), upscaled to the window size. ' +
      'The presets of FSR: 77% ultra quality (1.3x), 67% quality (1.5x), 59% balanced (1.7x), 50% performance (2x).',
    editable: true,
    options: ['native', '77%', '67%', '59%', '50%'],
    default: 'native',
    group: 'Display',
  }),

  upscaler: choice({
    description:
      'Upscale of a render scale below native, after the post AA: fsr1 is AMD FSR 1 (edge adaptive upsampling + ' +
      'RCAS sharpening), bicubic the B-spline of the game (soft, no ringing), bilinear the plain filter.',
    editable: true,
    options: ['fsr1', 'bicubic', 'bilinear'],
    default: 'fsr1',
    group: 'Display',
  }),

  upscaleSharpness: number({
    description: 'RCAS sharpening of fsr1 in stops: 0 is the strongest, each stop halves it (AMD default 0.2).',
    editable: true,
    default: 0.2,
    min: 0,
    max: 2,
    step: 0.05,
    group: 'Display',
  }),
  /**
   * The engine cvar e_LodFaceAreaTargetSize. Level 1 begins at
   * `sqrt(geometric mean face area) / lodFaceAreaTargetSize / (lodRatio / 100) * world z scale`, every further level at
   * twice the distance of the previous one, see ContentService.cgfLodInfo and MeshLoaderComponent.attachLod.
   *
   * The game sets it per object detail spec (config/cvargroups/sys_spec_objectdetail.cfg):
   * - LOW ([4], [5]): 0.01
   * - MID ([6]): 0.0075
   * - HIGH (default [7]) and very high ([8]): 0.005
   *
   * Per mesh factor from nwbt: MeshRenderOptions.LODRatio, the distances are divided by lodRatio / 100 (engine
   * GetLodDistances). 100 is the default (98% of the meshes), 200 halves the switch distances, 50 doubles them.
   * MeshRenderOptions.Lod_MinScreenPct is not used: the game leaves e_UseScreenPctLOD off (tmp/game-parity).
   */
  lodFaceAreaTargetSize: number({
    description:
      'Target triangle size on screen (e_LodFaceAreaTargetSize), smaller keeps finer levels longer. ' +
      'Game: low 0.01, mid 0.0075, high 0.005. Needs reload.',
    editable: true,
    default: 0.005,
    min: 0.0005,
    max: 0.02,
    step: 0.0005,
    group: 'LOD',
  }),
  /**
   * Coarsest level of detail that is used. The engine supports 6 levels (MAX_STATOBJ_LODS_NUM), and the game does not
   * limit them (e_LodMax is a cheat cvar that stays at 5).
   */
  lodMaxLevel: integer({
    description: 'Coarsest level of detail that is used, the game always allows 5. Needs reload.',
    editable: true,
    default: 2,
    min: 0,
    max: 5,
    group: 'LOD',
  }),
  /**
   * Distance up to which particle emitters are active, multiplied by the emitter view distance multiplier.
   * The engine derives it from the emitter bounds and e_ViewDistRatio, see SliceSystem.
   */
  particleViewDistance: number({
    description: 'Distance up to which particle emitters are active (times the emitter multiplier). Needs reload.',
    editable: true,
    default: 64,
    min: 8,
    max: 512,
    step: 8,
    group: 'Particles',
  }),
  particleCountScale: number({
    description: 'Scales the particle count of all emitters. Needs reload.',
    editable: true,
    default: 1,
    min: 0.1,
    max: 4,
    step: 0.1,
    group: 'Particles',
  }),
  /**
   * One shot effects (demolish, loot, impacts …) are triggered by game events. Shown, they play once on activation.
   */
  particleOneShots: boolean({
    description: 'Also plays one shot effects (game event effects) once when they come into range. Needs reload.',
    editable: true,
    default: false,
    group: 'Particles',
  }),

  environmentLight: choice({
    description:
      'Source of the environment lighting. baked uses the environment probes of the game, sky the dynamic sky cube.',
    editable: true,
    options: ['baked', 'sky'],
    default: 'baked',
    group: 'Lighting',
  }),

  froxelFog: boolean({
    description:
      'Volumetric fog in a view frustum volume (froxels) up to the time of day ray-marching range, like the game: ' +
      'fog volumes, lights in fog, transparent surfaces fogged by the same volume. Off uses the analytical fog only.',
    editable: true,
    default: true,
    group: 'Fog',
  }),

  froxelTileSize: integer({
    description: 'Screen pixels per froxel in x and y. The game uses 10. Smaller is sharper and more expensive.',
    editable: true,
    min: 4,
    max: 32,
    step: 1,
    default: 10,
    group: 'Fog',
  }),

  froxelSlices: integer({
    description: 'Depth slices of the froxel volume. The game uses 32. More slices reduce banding in depth.',
    editable: true,
    min: 8,
    max: 128,
    step: 4,
    default: 32,
    group: 'Fog',
  }),

  antialiasing: choice({
    description:
      'Post-process anti-aliasing of the final image. smaa1tx is the game\'s SMAA 1TX: SMAA 1x plus a temporal resolve ' +
      'with the reprojected previous frame (calms specular and emissive pixels). smaa is SMAA 1x with depth ' +
      'predication, cmaa2 is Intel CMAA2 (conservative, keeps texture detail), fxaa is FXAA 3.11 (cheaper, softer).',
    editable: true,
    options: ['smaa1tx', 'smaa', 'cmaa2', 'fxaa', 'off'],
    default: 'smaa1tx',
    group: 'Display',
  }),

  reflections: boolean({
    description:
      'Screen space reflections (Hi-Z traced, cone traced gloss) on glossy surfaces and water, blended over the probe ' +
      'and env reflections like the game. Off keeps the probe and env reflections only.',
    editable: true,
    default: true,
    group: 'Lighting',
  }),

  snow: boolean({
    description:
      'Snow and frost of snow volumes (SnowComponent) on the snow receivers (terrain and meshes with acceptSnow), ' +
      'the deferred snow layer of the game. Off shows the surfaces without snow.',
    editable: true,
    default: true,
    group: 'Lighting',
  }),

  tonemapper: choice({
    description:
      'film uses the tone mapping of the game with the time of day values. aces is the previous generic curve.',
    editable: true,
    options: ['film', 'aces'],
    default: 'film',
    group: 'Lighting',
  }),

  exposure: choice({
    description:
      'Exposure of the film tone mapping. auto adapts to the scene luminance like the game (EV mode), fixed uses exposure 1.',
    editable: true,
    options: ['auto', 'fixed'],
    default: 'auto',
    group: 'Lighting',
  }),

  workerCulling: boolean({
    description:
      'Culls static level objects in a worker and draws them as instance batches, instead of the scene traversal. ' +
      'Needs reload.',
    editable: true,
    default: true,
    group: 'Performance',
  }),

  playerCollision: boolean({
    description:
      'Walls block the player in grounded movement mode (key G). When off, the player walks through walls but stays on the ground.',
    editable: true,
    default: true,
    group: 'Movement',
  }),
})
