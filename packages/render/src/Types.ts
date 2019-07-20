import { Material, ShaderProgram, Texture } from '@gglib/graphics'
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
 * An object holding a drawable with its rendering properties
 *
 * @public
 */
export interface DrawableData<T = any> {
  /**
   * The transform matrix
   */
  transform: Mat4
  /**
   * The drawable object
   */
  drawable: Drawable
  /**
   * The drawing material
   */
  material: Material
  /**
   * Additional data.
   *
   * @remarks
   * The actual data depends on the used rendering pipeline
   */
  data?: T
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
  id: string | number,
  /**
   * Indicates whether this scene is enabled for rendering
   *
   * @remarks
   * If value is missing `true` is assumed
   */
  enabled?: boolean
  /**
   * A custom tag
   *
   * @remarks
   * All scenes without a tag are automatically rendered on screen by the render manager.
   */
  tag?: string
  /**
   * Render destination on Screen (or texture)
   */
  viewport?: {
    type?: 'normalized' | 'pixels',
    /**
     * X position on screen
     */
    x: number,
    /**
     * Y position on screen
     */
    y: number,
    /**
     * Width on screen
     */
    width: number,
    /**
     * Height on screen
     */
    height: number,
    /**
     * Aspect ration
     *
     * @remarks
     * Will be calculated based on canvas size and written back to this property
     */
    aspect?: number,
  },
  /**
   * The camera that is rendering this view
   */
  camera?: CameraData
  /**
   * The items that are visible by this view
   */
  items: DrawableData[]
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
export interface SceneOutput {
  /**
   * The render target
   */
  target?: Texture
  /**
   * X position on render target
   */
  x?: number
  /**
   * Y position on render target
   */
  y?: number
  /**
   * Width on render target
   */
  width?: number
  /**
   * Height on render target
   */
  height?: number
}
