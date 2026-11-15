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

  /**
   * RCAS sharpening of fsr1, higher is sharper. Applied as `2 * (1 - value)` stops (UpscalePass.sharpness): 1 is the
   * strongest, 0 is 2 stops (a quarter), 0.9 is the AMD default of 0.2 stops.
   */
  upscaleSharpness: number({
    description: 'RCAS sharpening of fsr1, higher is sharper. 0.9 is the AMD default.',
    editable: true,
    default: 0.9,
    min: 0,
    max: 1,
    step: 0.05,
    group: 'Display',
  }),
  /**
   * Object detail tier of the game (sys_spec_ObjectDetail). The values of each tier are in constants.ts
   * (OBJECT_DETAIL_TIERS): impostor range, spawn radius scale (g_GDE_AOIScale), LOD target size
   * (e_LodFaceAreaTargetSize) and slices spawned per frame. The game does not thin out meshes on lower tiers.
   */
  objectDetail: choice({
    description:
      'Object detail tier of the game: impostor range (600/800/1200/1400 m), spawn radius scale and LOD target size. ' +
      'The LOD target size needs reload.',
    editable: true,
    options: ['low', 'medium', 'high', 'veryHigh'],
    default: 'high',
    group: 'Object detail',
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

  volumetricFog: boolean({
    description:
      'The analytical volumetric fog 2 of the game (VOLFOG2 time of day values: height fog, ramp, scattering). ' +
      'Off disables the fog (the froxel fog included), the legacy fog of the engine is not tuned by New World.',
    editable: true,
    default: true,
    group: 'Fog',
  }),

  antialiasing: choice({
    description:
      "Post-process anti-aliasing of the final image. smaa1tx is the game's SMAA 1TX: SMAA 1x plus a temporal resolve " +
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

  playerCollision: boolean({
    description:
      'Walls block the player in grounded movement mode (key G). When off, the player walks through walls but stays on the ground.',
    editable: true,
    default: true,
    group: 'Movement',
  }),
})
