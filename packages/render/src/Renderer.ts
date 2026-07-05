import {
  Color,
  CommonBlocks,
  CommonInputs,
  CullState,
  DepthState,
  Device,
  DeviceOutput,
  BufferWriter,
  ProgramInputBlockCollection,
  RenderVariant,
  SpriteBatch,
  surfaceFormatIsSrgb,
  Texture,
  WebglDevice,
} from '@gglib/graphics'

import { Mat4, Vec3 } from '@gglib/math'
import { eventSource } from '@gglib/utils'
import { GeometryPass } from './passes/GeometryPass'
import { createRenderChannelSchema, RenderChannel } from './RenderChannel'
import {
  MeshPartRenderCollector,
  MeshRenderCollector,
  ModelRenderCollector,
  RenderCollectorRegistry,
  SpriteRenderCollector,
} from './RenderCollector'
import { RenderList, RenderListCache } from './RenderList'
import { RenderListMode } from './RenderListMode'
import { RenderPipeline } from './RenderPipeline'
import { RenderTargetManager } from './RenderTargetManager'
import {
  LayerMask,
  RenderItemType,
  type FrameInfo,
  type RenderContext,
  type RenderScene,
  type RenderView,
} from './types'

export const ViewDataSymbol = Symbol('ViewData')
export const ViewChannelsSymbol = Symbol('ViewChannels')

export interface RendererStats {
  drawCount: number
}

export class Renderer {
  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * Default rendering pipeline, being used for views without own pipeline assigned.
   */
  public pipeline: RenderPipeline

  /**
   * Preferred clear color. Some render passes may ignore this if they have their own clear color assigned.
   */
  public clearColor: Color = Color.Black

  /**
   * If enabled, automatically convert linear to sRGB color space when presenting to non-sRGB surfaces.
   */
  public autoSrgb = false

  public perInstanceTransforms: BufferWriter
  public perInstanceData: BufferWriter

  public lastInstanceCount = 0
  protected renderLists: RenderListCache
  protected collectors: RenderCollectorRegistry
  protected spriteBatch: SpriteBatch
  protected context: RenderContext
  protected resources: RenderTargetManager
  protected frameInfo: FrameInfo = {
    id: 0,
    time: 0,
    delta: 0,
  }

  /**
   * Event emitted when the render context is ready to be used for rendering.
   * This allows to set custom render parameters or perform other preparations before the render pipeline is executed.
   */
  public readonly onContextReady = eventSource<RenderContext>()

  public constructor(device: Device) {
    this.device = device
    this.pipeline = new RenderPipeline()
    this.pipeline.addPass(new GeometryPass())
    this.renderLists = new RenderListCache()
    this.collectors = new RenderCollectorRegistry()
    this.collectors.register(RenderItemType.Mesh, new MeshRenderCollector())
    this.collectors.register(RenderItemType.MeshPart, new MeshPartRenderCollector())
    this.collectors.register(RenderItemType.Model, new ModelRenderCollector())
    this.collectors.register(RenderItemType.Sprite, new SpriteRenderCollector())
    this.resources = new RenderTargetManager(device)

    if (device.isReady) {
      this.createInstanceBuffers()
    } else {
      device.ready.then(() => this.createInstanceBuffers())
    }

    this.context = {
      device: this.device,
      renderer: this,
      resources: this.resources,
      frame: this.frameInfo,
      view: null,
      viewWidth: 1,
      viewHeight: 1,
      channelDescriptors: createRenderChannelSchema(device),
      renderLists: this.renderLists,
      renderVariant: RenderVariant.Forward,
      renderInputs: new ProgramInputBlockCollection({
        createIfMissing: false,
        initialBlocks: [CommonBlocks.Global, CommonBlocks.Frame, CommonBlocks.View],
      }),
    }
  }

  public stats<T extends RendererStats>(out?: T): T
  public stats(out?: RendererStats): RendererStats {
    out ||= { drawCount: 0 } as RendererStats
    out.drawCount = this.renderLists.sumDrawCount()
    return out
  }

  protected createInstanceBuffers() {
    if (this.device.isWebGPU) {
      this.createInstanceBuffersWebGpu()
    } else {
      this.createInstanceBuffersWebGL()
    }
  }

  protected createInstanceBuffersWebGpu() {
    const device = this.device
    const capacity = 512 // arbitrary initial capacity, will be automatically resized if needed
    const strideInBytes = 16 * Float32Array.BYTES_PER_ELEMENT // Mat4 or 4 vec4s for unknown data
    this.perInstanceTransforms = new BufferWriter({
      capacity,
      autosize: true,
      recordByteSize: strideInBytes,
      buffer: device.createBuffer({
        size: capacity * strideInBytes,
        type: 'StorageBuffer',
      }),
    })
    this.perInstanceData = new BufferWriter({
      capacity,
      autosize: true,
      recordByteSize: strideInBytes, // unknown data, using 4 vec4s just in case
      buffer: device.createBuffer({
        size: capacity * strideInBytes,
        type: 'StorageBuffer',
      }),
    })
  }

  protected createInstanceBuffersWebGL() {
    const device = this.device as WebglDevice
    const strideInBytes = 16 * Float32Array.BYTES_PER_ELEMENT // Mat4
    const instanceCount = device.capabilities.maxUniformBlockSize / strideInBytes
    this.perInstanceTransforms = new BufferWriter({
      autosize: false,
      capacity: instanceCount,
      recordByteSize: strideInBytes,
      buffer: device.createBuffer({
        size: instanceCount * strideInBytes,
        type: 'UniformBuffer',
      }),
    })
    this.perInstanceData = new BufferWriter({
      autosize: false,
      capacity: instanceCount,
      recordByteSize: strideInBytes,
      buffer: device.createBuffer({
        size: instanceCount * strideInBytes,
        type: 'UniformBuffer',
      }),
    })
  }

  public createView(options: Partial<RenderView>): RenderView {
    options.name ??= 'view'
    options.camera ??= null
    options.disabled ??= false
    options.viewport ??= { x: 0, y: 0, width: 1, height: 1 }
    options.output ??= [options.present || RenderChannel.Color]
    options.pipeline ??= this.pipeline
    options.exports ??= {}
    options.items ??= []
    options.includeMask ??= LayerMask.All
    if (options.present === undefined) {
      options.present = options.output[0]
    }
    return options as RenderView
  }

  public releaseView(view: RenderView): void {
    const channels = view.exports
    for (const key in channels) {
      const texture = channels[key as RenderChannel]
      if (texture) {
        this.resources.release(texture)
        channels[key as RenderChannel] = null
      }
    }
  }

  /**
   * Simply updates the internal frame info.
   * Should be called once per frame before rendering.
   */
  public update(time: number) {
    this.lastInstanceCount = this.perInstanceTransforms.count
    this.frameInfo.time ||= time
    this.frameInfo.delta = time - this.frameInfo.time
    this.frameInfo.time = time
    this.frameInfo.id++
    this.resources.update()
    this.perInstanceData.reset()
    this.perInstanceTransforms.reset()
  }

  /**
   * Renders the given scene into all views.
   */
  public render(scene: RenderScene): void {
    for (const view of scene.views) {
      this.renderSceneView(scene, view)
    }
    this.present(scene.views, scene.output)
  }

  /**
   * Renders the given scene into the given view.
   * Skips rendering if the view is disabled or invalid.
   */
  public renderSceneView(scene: RenderScene, view: RenderView): void {
    if (!this.validateView(view)) {
      return
    }

    view.items ||= []
    view.items.length = 0
    scene.collect(this.frameInfo, view.camera, view.items)
    this.renderView(view)
  }

  protected validateView(view: RenderView): boolean {
    if (view.disabled) {
      return false
    }
    if (!view.camera) {
      console.warn(`View '${view.name}' has no camera. View will be disabled to prevent further warnings.`)
      view.disabled = true
      return false
    }
    if (!view.viewport) {
      console.warn(`View '${view.name}' has no viewport. View will be disabled to prevent further warnings.`)
      view.disabled = true
    }
    if (!view.pipeline) {
      console.warn(`View '${view.name}' has no render pipeline. View will be disabled to prevent further warnings.`)
      view.disabled = true
    }
    if (view.includeMask == null) {
      console.warn(`View '${view.name}' has no include mask assigned, using default`)
      view.includeMask = LayerMask.All
    }
    if (view.camera.visibilityMask == null) {
      console.warn(`View '${view.name}' has no camera layer mask assigned, using default`)
      view.camera.visibilityMask = LayerMask.All
    }
    if (!(view.includeMask & view.camera.visibilityMask)) {
      console.warn(
        `View '${view.name}' include mask and camera visibility mask have no common layers, view will be disabled to prevent further warnings.`,
      )
      view.disabled = true
    }
    return !view.disabled
  }

  /**
   * Renders the given view. Does not perform any validation and assumes that
   * the view data are already collected.
   */
  public renderView(view: RenderView) {
    if (!this.validateView(view)) {
      return
    }
    const context = this.context
    context.frame = this.frameInfo
    context.view = view
    context.viewWidth = getViewWidth(view.viewport.width, this.device.output)
    context.viewHeight = getViewHeight(view.viewport.height, this.device.output)
    this.updateInputs(context)
    this.onContextReady.emit(context)

    this.renderLists.clear()
    view.pipeline.execute(context)
  }

  /**
   *
   * @param mode
   * @param ctx
   * @returns
   */
  public getList(mode: RenderListMode, ctx: RenderContext): RenderList {
    const list = this.renderLists.get(mode)
    if (list.isSorted) {
      return list
    }
    list.begin(mode, ctx.view, ctx.renderInputs.blocks, this.perInstanceTransforms, this.perInstanceData)
    this.collectors.begin(ctx, list)
    for (const item of ctx.view.items) {
      if (!(item.flags & mode.mask)) {
        continue
      }
      this.collectors.add(item)
    }
    this.collectors.end()
    list.end()
    return list
  }

  /**
   * Presents all prerendered views to screen or to the given target texture.
   * Skips views that have no presentable channels or have {@link RenderView.present} set to false.
   */
  public present(views: RenderView[], target: Texture = null): void {
    this.spriteBatch ||= new SpriteBatch(this.device)

    const isSRGB = surfaceFormatIsSrgb((target || this.device.output).format)
    const pass = this.device.renderPass
    pass.flush()
    pass.setRenderTarget(0, target)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.setClearDepth(1)
    pass.clear()
    pass.setCullState(CullState.Disabled)
    pass.setDepthState(DepthState.Disabled)

    this.spriteBatch.begin()
    this.spriteBatch.linearToSrgb = this.autoSrgb && !isSRGB
    for (const view of views) {
      if (!view.present) {
        continue
      }
      const texture = view.exports[view.present]
      if (!texture) {
        continue
      }

      const rect = view.viewport
      this.spriteBatch
        .next(texture)
        .source(0, 0, texture.width, texture.height)
        .flipY(this.device.isWebGL2)
        .destination(
          getViewWidth(rect.x, target || this.device.output),
          getViewHeight(rect.y, target || this.device.output),
          getViewWidth(rect.width, target || this.device.output),
          getViewHeight(rect.height, target || this.device.output),
        )
    }
    pass.render(this.spriteBatch)
    pass.submit()
    pass.flush()
  }

  protected updateInputs(ctx: RenderContext) {
    ctx.renderInputs.set(CommonInputs.Frame.FrameIndex, ctx.frame.id)
    ctx.renderInputs.set(CommonInputs.Frame.ElapsedTime, ctx.frame.time)
    ctx.renderInputs.set(CommonInputs.Frame.DeltaTime, ctx.frame.delta)

    ctx.renderInputs.set(CommonInputs.View.Far, ctx.view.camera.far)
    ctx.renderInputs.set(CommonInputs.View.Near, ctx.view.camera.near)
    ctx.renderInputs.set(CommonInputs.View.ViewMatrix, ctx.view.camera.view)
    ctx.renderInputs.set(CommonInputs.View.ProjectionMatrix, ctx.view.camera.projection)

    const inverseViewMatrix: Mat4 = (ctx['__inverseViewMatrix'] ||= Mat4.createIdentity())
    Mat4.invert(ctx.view.camera.view, inverseViewMatrix)
    ctx.renderInputs.set(CommonInputs.View.InverseViewMatrix, inverseViewMatrix)

    const inverseProjectionMatrix: Mat4 = (ctx['__inverseProjectionMatrix'] ||= Mat4.createIdentity())
    Mat4.invert(ctx.view.camera.projection, inverseProjectionMatrix)
    ctx.renderInputs.set(CommonInputs.View.InverseProjectionMatrix, inverseProjectionMatrix)

    const viewProjectionMatrix: Mat4 = (ctx['__viewProjectionMatrix'] ||= Mat4.createIdentity())
    Mat4.multiply(ctx.view.camera.projection, ctx.view.camera.view, viewProjectionMatrix)
    ctx.renderInputs.set(CommonInputs.View.ViewProjectionMatrix, viewProjectionMatrix)

    const inverseViewProjectionMatrix: Mat4 = (ctx['__inverseViewProjectionMatrix'] ||= Mat4.createIdentity())
    Mat4.invert(viewProjectionMatrix, inverseViewProjectionMatrix)
    ctx.renderInputs.set(CommonInputs.View.InverseViewProjectionMatrix, inverseViewProjectionMatrix)

    const cameraPosition: Vec3 = (ctx['__cameraPosition'] ||= Vec3.create())
    ctx.view.camera.world.getTranslation(cameraPosition)
    ctx.renderInputs.set(CommonInputs.View.CameraPosition, cameraPosition)

    const cameraDirection: Vec3 = (ctx['__cameraDirection'] ||= Vec3.create())
    ctx.view.camera.world.getForward(cameraDirection)
    ctx.renderInputs.set(CommonInputs.View.CameraDirection, cameraDirection)
  }

  public dispose() {
    // TODO:
  }
}

function getViewWidth(width: number, target: Texture | DeviceOutput): number {
  if (width > 1) {
    return width
  }
  return Math.round(target.width * width)
}

function getViewHeight(height: number, target: Texture | DeviceOutput): number {
  if (height > 1) {
    return height
  }
  return Math.round(target.height * height)
}
