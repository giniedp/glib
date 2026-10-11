import { boolean, choice, defineConfig, integer, number } from './properties'

/**
 * Runtime settings of the viewer
 *
 * @remarks
 * Constants of `constants.ts` are moved here one by one. Constants that are not really configurable,
 * or are hard to pass through the config, stay constants.
 */
export const viewerConfigSchema = defineConfig({
  /**
   * Plays the ambient audio, see AudioSystem. Browsers only allow audio after a user gesture, so a saved value
   * starts the audio with the first click or key press.
   */
  audioEnabled: boolean({
    description: 'Plays the ambient audio. When saved, audio starts with the first click or key press (autoplay policy).',
    editable: true,
    default: false,
    group: 'Audio',
  }),
  /**
   * Size of the rendered image, see RenderSizeSystem. Helps to profile at a specific resolution without changing the
   * browser window.
   */
  renderResolution: choice({
    description:
      'Render size in pixels. window follows the window size (device pixels), a fixed size keeps the resolution ' +
      'and is displayed by renderScaling.',
    editable: true,
    options: ['window', '1280x720', '1600x900', '1920x1080', '2560x1440', '3840x2160'],
    default: 'window',
    group: 'Display',
  }),
  /**
   * How a fixed render resolution is displayed, see RenderSizeSystem
   */
  renderScaling: choice({
    description:
      'Display of a fixed render resolution. fit scales the image into the window and keeps the aspect ratio, ' +
      'none shows one render pixel per device pixel, centered and cropped if larger than the window.',
    editable: true,
    options: ['fit', 'none'],
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
})
