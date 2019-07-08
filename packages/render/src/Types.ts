import { Material, ShaderProgram, Texture } from '@gglib/graphics'
import { IVec4, Mat4 } from '@gglib/math'
import { Manager } from './Manager'

/**
 * An object that is drawable with a shader program
 *
 * @public
 */
export interface Drawable {
  draw: (program: ShaderProgram) => void
}

/**
 * On Object holding a drawable object
 *
 * @public
 */
export interface DrawableData<T = any> {
  world: Mat4
  drawable: Drawable
  material: Material
  data?: T
}

/**
 * Describes a light source
 * @public
 */
export interface LightData {
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
 * Describes a camera and its placement in the world
 *
 * @public
 */
export interface CameraData {
  /**
   * The world matrix
   *
   * @remarks
   * If null then identity is assumed
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
 * @public
 */
export interface Stage {
  ready: boolean
  setup?: (manager: Manager) => void
  render: (manager: Manager) => void
  cleanup?: (manager: Manager) => void
}

/**
 * @public
 */
export interface Scene {
  /**
   * The unique identifier of this view
   */
  id: string | number,
  /**
   * Whether this view is enabled for rendering or not
   *
   * @remarks
   * A missing value defaults to `true`
   */
  enabled?: boolean
  /**
   * A custom tag
   *
   * @remarks
   * All scenes without a tag are automatically rendered on screen by the render manager
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
  lights: LightData[]
  /**
   * The rendering steps
   */
  steps: Stage[]
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
