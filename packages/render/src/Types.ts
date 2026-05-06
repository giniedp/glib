import type {
  Device,
  Geometry,
  Mesh,
  MeshPart,
  RenderVariant,
  Sprite,
  Texture,
  TextureDescriptor,
  ProgramInputValue,
} from '@gglib/graphics'
import type { IRect, Mat4 } from '@gglib/math'
import { brand, Brand } from '@gglib/utils'
import { Model } from 'model/src'
import type { FrameGraph } from './FrameGraph'
import type { RenderChannel } from './RenderChannel'
import type { Renderer } from './Renderer'
import { RenderList, RenderListCache } from './RenderList'
import { RenderItemFlags } from './RenderListMode'
import type { RenderPipeline } from './RenderPipeline'
import type { RenderTargetManager } from './RenderTargetManager'

export type LayerMask = number
export const LayerMask = {
  All: Number.MAX_SAFE_INTEGER,
}

export interface CameraData {
  /**
   * The layer mask that this camera renders.
   * If not provided, the camera is assumed to render all layers.
   */
  visibilityMask?: LayerMask | null
  /**
   * The world transform of the camera
   */
  world: Mat4
  /**
   * The view transform of the camera, usually the inverse of the world transform
   */
  view: Mat4
  /**
   * The projection transform of the camera
   */
  projection: Mat4

  /**
   * If true, the depth range is reversed, so that the near plane is mapped to 1 and the far plane is mapped to 0.
   */
  reversedZ: boolean
}

export type RenderItemType<K extends string, T> = Brand<K, T>
export const RenderItemType = {
  Light: brand<'light', unknown>('light'),
  Mesh: brand<'mesh', Mesh>('mesh'),
  MeshPart: brand<'meshPart', MeshPart>('meshPart'),
  Model: brand<'model', Model>('model'),
  Primitive: brand<'primitive', Geometry>('primitive'),
  Sprite: brand<'sprite', Sprite>('sprite'),
}

export type LightRenderItem = KeyedRenderItem<'light', unknown>
export type MeshRenderItem = KeyedRenderItem<'mesh', Mesh>
export type MeshPartRenderItem = KeyedRenderItem<'meshPart', MeshPart>
export type ModelRenderItem = KeyedRenderItem<'model', Model>
export type PrimitiveRenderItem = KeyedRenderItem<'primitive', Geometry>
export type SpriteRenderItem = KeyedRenderItem<'sprite', Sprite>

export type KeyedRenderItem<K extends string = string, T = unknown> = RenderItem & {
  type: K
} & {
  [P in K]: T
}

export type RenderItem = {
  type: RenderItemType<string, any>
  /**
   * The render layer of this item, used for sorting.
   */
  layer: LayerMask
  /**
   * The render flags of this item, used for filtering. Can be a combination of {@link RenderItemFlags}.
   */
  flags: RenderItemFlags
  /**
   * The world transform of this render item, used for sorting.
   */
  transform: Mat4
}

export function isRenderItem<K extends string, T>(item: RenderItem, type: Brand<K, T>): item is KeyedRenderItem<K, T> {
  return item.type === type
}

/**
 * A renderable scene that provides renderable items for the current frame.
 * The scene is responsible for culling e.g. by frustum and or layer, and should only
 * provide items that are visible for the given camera in the current frame.
 */
export interface RenderScene {
  /**
   * Collects renderable items for the given camera and adds them to the provided output array.
   * @remarks
   * It is up to the implementation to filter by layer mask and perform frustum culling, so that only visible items are collected.
   *
   * @param camera The camera for which the items should be collected.
   * @param out The output array where the collected items should be added to. Does not need to be cleared as it will be cleared by the renderer before collection.
   */
  collect(camera: CameraData, out: RenderItem[]): void
}

export interface RenderCollector<T extends RenderItem> {
  begin(context: RenderContext, list: RenderList): void
  add(item: T): void
  end(): void
}

export interface FrameInfo {
  /**
   * The frame number since the start of the application
   */
  id: number
  /**
   * The time in ms since the start of the application
   */
  time: number
  /**
   * The time in ms since the last frame
   */
  delta: number
}

export interface RenderView {
  /**
   * User defined name of this view
   */
  name: string
  /**
   * Bitmask that defines which layers are picked up for rendering.
   * If not provided, all layers are included.
   */
  includeMask?: LayerMask
  /**
   * The camera used for rendering this view
   */
  camera: CameraData
  /**
   * The viewport area where this view should be rendered to.
   * Can be either in
   * - normalized coordinates if the width and height are between 0 and 1
   * - absolute pixel values, if the width or height is greater than 1
   */
  viewport: IRect
  /**
   * The render pipeline to use for rendering this view, if not provided, the default pipeline of the renderer is used
   */
  pipeline: RenderPipeline
  /**
   * The render channels that this view should generate. Usually picked up by the frame graph
   * for pass culling and exporting the final results into {@link RenderView.exports}.
   */
  output: RenderChannel[]
  /**
   * The render channel of this view that should be presented to the screen
   * @remarks
   * If set to a render channel, the content of that channel will be presented.
   * If set to true, the first available color channel will be presented.
   * If set to false, nothing will be presented.
   * Default is false.
   */
  present?: RenderChannel | null | false
  /**
   * If true, rendering is skipped for this view
   */
  disabled?: boolean
  /**
   * Collection of render targets that are exported from the frame graph and can be used for presentation.
   * This is usually managed by the renderer or render pipeline.
   * Should not be manually assigned, modified or disposed.
   * @internal
   */
  exports: Record<RenderChannel, Texture>
  /**
   * Collection of renderable items that are generated for this view during the collection phase.
   * Should not be manually assigned or modified, but can be read during rendering.
   * @internal
   */
  items: RenderItem[]
}

export interface RenderContext {
  /**
   * The graphics device that is used for rendering this frame
   */
  device: Device
  /**
   * The renderer that is executing the current render pipeline
   */
  renderer: Renderer
  /**
   * The render target manager
   */
  resources: RenderTargetManager
  /**
   * The view that is being rendered in the current render pipeline
   */
  view: Readonly<RenderView>
  /**
   * Absolute width of the current view in pixels
   */
  viewWidth: number
  /**
   * Absolute height of the current view in pixels
   */
  viewHeight: number
  /**
   * The frame number and time information for the current frame
   */
  frame: Readonly<FrameInfo>
  /**
   * All registered descriptors for render channels
   */
  channelDescriptors: Record<RenderChannel, Readonly<TextureDescriptor>>
  /**
   *
   */
  renderLists: RenderListCache
  /**
   * Uniform values that are set globally for the current render pass and can be used by materials and effects.
   */
  renderParams: Record<string, ProgramInputValue>
  /**
   * The render variant that is currently being rendered, e.g. 'depth', 'forward', etc.
   * This can be used by materials and effects to determine which shader variant to use.
   */
  renderVariant: RenderVariant
}

export interface RenderPass {
  /**
   * Name of this render pass
   */
  name: string
  /**
   * Called to allow the pass to claim it's inputs and outputs
   */
  setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void
  /**
   * A function that is called to execute this render pass
   */
  render(ctx: RenderContext): void
  /**
   * A function that is called after all pipeline passs are executed
   */
  cleanup(ctx: RenderContext): void
}
