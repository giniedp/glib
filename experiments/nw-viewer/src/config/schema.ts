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
  /**
   * The engine cvar e_LodFaceAreaTargetSize. The distance between two levels of detail is
   * `sqrt(geometric mean face area) / lodFaceAreaTargetSize / (lodRatio / 100)`, see ContentService.cgfLodInfo and
   * MeshLoaderComponent.attachLod.
   *
   * The game sets it per object detail spec (config/cvargroups/sys_spec_objectdetail.cfg):
   * - LOW ([4], [5]): 0.01
   * - MID ([6]): 0.0075
   * - HIGH (default [7]) and very high ([8]): 0.005
   *
   * Per mesh factors from nwbt (MeshLoaderComponent.attachLod):
   * - MeshRenderOptions.LODRatio: the distances are divided by lodRatio / 100 (engine GetLodDistances).
   *   100 is the default (98% of the meshes), 200 halves the switch distances, 50 doubles them.
   * - MeshRenderOptions.Lod_MinScreenPct: NW specific, the game data is mostly [-1, 0.675, 0.55, 0.425, 0.3, 0.175].
   *   Interpreted as the maximum screen size (fraction of the screen height) per level, it keeps large objects detailed.
   *
   * The game values switch too early in the viewer, viewer values with the game's ratios (1 : 1.5 : 2):
   * HIGH 0.0025 (default), MID 0.00375, LOW 0.005.
   */
  lodFaceAreaTargetSize: number({
    description:
      'Target triangle size on screen (e_LodFaceAreaTargetSize), smaller keeps finer levels longer. ' +
      'Game: low 0.01, mid 0.0075, high 0.005. Needs reload.',
    editable: true,
    default: 0.0025,
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
