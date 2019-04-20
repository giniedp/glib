import { Material, ShaderProgram, Texture } from '@gglib/graphics'
import { IVec4, Mat4 } from '@gglib/math'
import { Manager } from './Manager'

/**
 * @public
 */
export interface Drawable {
  draw: (program: ShaderProgram) => void
}

/**
 * @public
 */
export interface DrawableData<T = any> {
  world: Mat4
  drawable: Drawable
  material: Material
  data?: T
}

/**
 * @public
 */
export interface LightData {
  color: IVec4
  position: IVec4
  direction: IVec4
  misc: IVec4
}

/**
 * @public
 */
export interface CameraData {
  world?: Mat4
  view: Mat4
  projection: Mat4
  viewProjection?: Mat4
}

/**
 * @public
 */
export interface Step {
  setup?: (manager: Manager) => void
  render?: (manager: Manager) => void
  cleanup?: (manager: Manager) => void
}

/**
 * @public
 */
export interface View {
  /**
   * Whether this view is enabled for rendering or not
   */
  enabled?: boolean
  /**
   * The layout definition in normalized coordinates
   */
  layout?: any
  /**
   * X position on screen
   */
  x?: number
  /**
   * Y position on screen
   */
  y?: number
  /**
   * Width on screen
   */
  width?: number
  /**
   * Height on screen
   */
  height?: number
  /**
   * The render target
   */
  target?: Texture
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
  steps: Step[]
}
