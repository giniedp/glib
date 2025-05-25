import type {
  Material,
  PrimitiveBatch,
  ShaderProgram,
  SpriteBatch,
  Texture,
  ViewportStateParams,
} from '@gglib/graphics'
import { IVec4, Mat4 } from '@gglib/math'
import type { RenderContext } from './RenderContext'

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
 * An object that is drawable with a primtive batch, usually for debugging purposes
 *
 * @public
 */
export interface PrimitiveDrawable {
  /**
   * Is called when the object should be rendered with given primitive batch
   */
  drawPrimitive: (batch: PrimitiveBatch) => void
}

/**
 * An object that is drawable with a sprite batch, usually for 2D UI elements or 2D games
 *
 * @public
 */
export interface SpriteDrawable {
  /**
   * Is called when the object should be rendered with given sprite batch
   */
  drawSprite: (batch: SpriteBatch) => void
}

/**
 * @public
 */
export interface ItemInfo<T = unknown> {
  /**
   * The drawable type
   */
  type: string

  /**
   * The world transform of the drawable object. If not provided identity is assumed
   */
  transform: Mat4

  /**
   * The item being rendered
   */
  item: T

  /**
   * The material to be used for rendering
   */
  material?: Material

  /**
   * The sort order for this item
   */
  order?: number

  /**
   * The layer ID on which this item should be rendered
   */
  layer?: number

  /**
   * Visibility flag for internal use
   *
   * @remarks
   * Does not need to be set. Will be used throughout the rendering for layer culling
   */
  hidden?: boolean
}

/**
 * An object holding a drawable with its rendering properties
 *
 * @public
 */
export interface DrawableInfo extends ItemInfo<Drawable> {
  /**
   * The drawable type
   */
  type: 'drawable'
}

export function isDrawableItem(item: ItemInfo): item is DrawableInfo {
  return item.type === 'drawable'
}

/**
 * An object holding a drawable with its rendering properties
 *
 * @public
 */
export interface DrawablePrimitiveInfo extends ItemInfo<PrimitiveDrawable> {
  /**
   * The drawable type
   */
  type: 'primitive'
}

export function isDrawablePrimitive(item: ItemInfo): item is DrawablePrimitiveInfo {
  return item.type === 'primitive'
}

/**
 * An object holding a sprite with its rendering properties
 *
 * @public
 */
export interface DrawableSpriteInfo extends ItemInfo<SpriteDrawable> {
  /**
   * The drawable type
   */
  type: 'sprite'
}

export function isDrawableSpriteItem(item: ItemInfo): item is DrawableSpriteInfo {
  return item.type === 'sprite'
}

/**
 * Light source properties
 *
 * @public
 */
export interface LightInfo {
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
export interface CameraInfo {
  /**
   * The layer mask to be used for culling
   *
   * @remarks
   * The layer mask is a bit mask that indicates which layers should be rendered.
   * If not set, the default of `0xFFFFFFFF` is used
   */
  layerMask?: number

  /**
   * Position and orientation of the camera in the world
   *
   * @remarks
   * This is a convenience property for the application layer and is not used by the renderer.
   */
  world: Mat4

  /**
   * The view matrix
   */
  view: Mat4

  /**
   * The projection matrix
   */
  projection: Mat4
}

/**
 * An object implementing one step of a rendering pipeline
 *
 * @public
 */
export interface RenderPass {
  /**
   * Indicates whether the render step is ready to render
   */
  ready: boolean
  /**
   * Is called for each step before any step is rendered
   */
  setup?: (context: RenderContext) => void
  /**
   * Is called for each step to render its technique
   */
  render: (context: RenderContext) => void
  /**
   * Is called for each step after all steps have been rendered
   */
  cleanup?: (context: RenderContext) => void
}

/**
 * An object describing a renderable scene
 *
 * @public
 */
export interface SceneComposition {
  /**
   * A user defined name for this composition
   */
  name?: string

  /**
   * A user defined data object
   */
  meta?: Record<string, any>

  /**
   * The sort order key for this composition
   *
   * @remarks
   * Compositions with lower value are rendered first
   */
  order?: number

  /**
   * Indicates that the composition is disabled and should be ignored
   */
  disabled?: boolean

  /**
   * Indicates that the output should not be presented on screen but kept in a render target
   */
  muted?: boolean

  /**
   * Camera to be used for view frustum culling and as a fallback camera for any subview.
   *
   * @remarks
   * If not set, any subview without an own camera is not rendered even if enabled.
   */
  camera: CameraInfo

  /**
   * The items being rendered with this composition
   */
  items: ItemInfo[]

  /**
   * The lights being rendered with this composition
   */
  lights: LightInfo[]

  /**
   * The rendering steps for this composition.
   *
   * @remarks
   * If not set, the default rendering steps will be used
   */
  steps?: RenderPass[]

  /**
   * Sub views to be rendered
   *
   * @remarks
   * This allows to render the same scene with different cameras and/or to different viewports and render targets.
   *
   * If not set, an array with one default view will be created on first render.
   */
  views?: SceneView[]
}

export class Scene implements SceneComposition {
  public name = 'Scene'
  public meta = {}
  public order = 0
  public disabled = false
  public muted = false
  public camera: CameraInfo = null
  public items: ItemInfo<unknown>[] = []
  public lights: LightInfo[] = []
  public steps: RenderPass[] = null
  public views: SceneView[] = [{}]
}

/**
 * @public
 */
export interface SceneView {
  /**
   * A user defined name for this view
   */
  name?: string

  /**
   * Indicates whether this view should be skipped for rendering
   */
  disabled?: boolean

  /**
   * The sort order key for this view
   *
   * @remarks
   * Views with lower value are rendered first
   */
  order?: number

  /**
   * The viewport area where this view should be rendered to
   *
   * @remarks
   * if not set, the whole screen or render target will be used
   */
  viewport?: ViewportArea

  /**
   * The camera to be used to render this view
   *
   * @remarks
   * If not set, the main camera will be used
   */
  camera?: CameraInfo

  /**
   * The rendering steps for this view.
   *
   * @remarks
   * If not set, the main composition steps vill be used
   */
  steps?: RenderPass[]
}

/**
 * The viewport area where this view should be rendered to
 *
 * @public
 * @remarks
 * The x, y, widh and height can be either pixels or normalized coordinates.
 *
 * When all values are <= 1, the coordinates are assumed to be normalized coordinates.
 */
export interface ViewportArea {
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
}

export type OutputSemantic = 'color' | 'depth' | 'normal' | 'position'

/**
 * @public
 */
export interface CompositionOutput {
  /**
   * The viewport area where this view should be rendered to
   */
  viewport: ViewportStateParams

  /**
   * The name of the channel to present on screen at the end of the pipeline
   */
  channel: string

  /**
   * The render channels used during rendering
   */
  channels: Partial<Record<OutputSemantic, Texture>>
}
