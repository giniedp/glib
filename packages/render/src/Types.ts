import { Material, PrimitiveBatch, ShaderProgram, SpriteBatch, Texture, ViewportStateParams } from '@gglib/graphics'
import { IVec4, Mat4 } from '@gglib/math'
import { RenderManager } from './RenderManager'

/**
 * An object that is drawable with a shader program
 *
 * @public
 */
export interface Drawable {
  /**
   * Is called when the object should be rendered with given program
   */
  draw: (program: ShaderProgram) => void
}

/**
 * An object that is drawable with a debug batch
 *
 * @public
 */
export interface DebugDrawable {
  /**
   * Is called when the object should be rendered with given primitive batch
   */
  draw: (batch: PrimitiveBatch) => void
}

/**
 * An object that is drawable with a sprite batch
 *
 * @public
 */
export interface SpriteBatchDrawable {
  /**
   * Is called when the object should be rendered with given sprite batch
   */
  draw: (batch: SpriteBatch) => void
}

/**
 * @public
 */
export interface SceneItem {
  /**
   * The drawable type
   */
  type: string
  /**
   * The world transform of the drawable object. If not provided identity is assumed
   */
  transform: Mat4
  /**
   * The sort order key
   */
  sortkey?: number
}

/**
 * An object holding a drawable with its rendering properties
 *
 * @public
 */
export interface SceneItemDrawable extends SceneItem {
  /**
   * The drawable type
   */
  type: 'drawable'
  /**
   * The drawable object.
   */
  drawable: Drawable
  /**
   * The drawing material.
   */
  material: Material
}

/**
 * An object holding a drawable with its rendering properties
 *
 * @public
 */
export interface SceneDebugDrawable extends SceneItem {
  /**
   * The drawable type
   */
  type: 'debug'
  /**
   * The drawable object.
   */
  debug: DebugDrawable
}

/**
 * An object holding a sprite with its rendering properties
 *
 * @public
 */
export interface SceneItemSprite extends SceneItem {
  /**
   * The drawable type
   */
  type: 'sprite'
  /**
   * The drawable object.
   */
  sprite: SpriteBatchDrawable
  /**
   * The drawing material.
   */
  material: Material
}

/**
 * Light source properties
 *
 * @public
 */
export interface LightSourceData {
  /**
   * The light color
   */
  color: IVec4 | ArrayLike<number>
  /**
   * The position of the light source
   */
  position: IVec4 | ArrayLike<number>
  /**
   * The direction of the light source
   */
  direction: IVec4 | ArrayLike<number>
}

/**
 * An object with camera properties
 *
 * @public
 */
export interface CameraData {
  /**
   * The transform matrix.
   *
   * @remarks
   * If not set, the inverse ov `view` matrix is assumed
   */
  world?: Mat4
  /**
   * The view matrix
   */
  view: Mat4
  /**
   * The projection matrix
   */
  projection: Mat4
  /**
   * The precalculated view projection matrix
   */
  viewProjection?: Mat4
}

/**
 * An object implementing one step of a rendering pipeline
 *
 * @public
 */
export interface RenderStep {
  /**
   * Indicates whether the render step is ready to render
   */
  ready: boolean
  /**
   * Is called for each step before any step is rendered
   */
  setup?: (manager: RenderManager) => void
  /**
   * Is called for each step to render its technique
   */
  render: (manager: RenderManager) => void
  /**
   * Is called for each step after all steps have been rendered
   */
  cleanup?: (manager: RenderManager) => void
}

/**
 * An object describing a renderable scene
 *
 * @public
 */
export interface Scene {
  /**
   * The unique identifier
   */
  id: string | number
  /**
   * The rendering priority key.
   *
   * @remarks
   * Scenes with lower sortKey value are rendered first
   */
  sortKey?: number
  /**
   * Indicates whether the scene should be skipped during rendering
   */
  disabled?: boolean
  /**
   * Indicates whether this scene is used for off screen rendering
   *
   * @remarks
   * If `true` the result of this scene will not be presented on screen
   */
  offscreen?: boolean
  /**
   * Render destination on screen or render target
   */
  viewport?: {
    /**
     * How the  `x`, `y`, `width` and `height` parameters should be interpreted
     *
     * @remarks
     * When set to `pixels`, the parameters are directly used as pixel values.
     *
     * When set to `normalized`, the parameters are assumed to be in range [0:1]
     *
     * When missing `pixels` is assumed.
     */
    type?: 'normalized' | 'pixels'
    /**
     * X position on screen or render target
     */
    x: number
    /**
     * Y position on screen or render target
     */
    y: number
    /**
     * Width on screen or render target
     */
    width: number
    /**
     * Height on screen or render target
     */
    height: number
    /**
     * The aspect ratio
     *
     * @remarks
     * This is calculated automatically each frame based on current canvas size (or render target).
     * Thus this must not be provided manually when setting up the scene viewport.
     */
    aspect?: number,
  }
  /**
   * The camera that is rendering this view
   *
   * @remarks
   * If this is missing, the scene is not rendered even if it is enabled.
   */
  camera?: CameraData
  /**
   * The camera that is rendering this view
   *
   * @remarks
   * If this is missing, the scene is not rendered even if it is enabled.
   */
  debugCamera?: CameraData
  /**
   * The items that are visible by this view
   */
  items: SceneItem[]
  /**
   * The lights that affect this view
   */
  lights: LightSourceData[]
  /**
   * The rendering steps
   */
  steps: RenderStep[]
}

/**
 * @public
 */
export interface SceneOutput extends ViewportStateParams {
  /**
   * The render target
   */
  target?: Texture
}
