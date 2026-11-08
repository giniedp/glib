import {
  BlendState,
  Color,
  CullState,
  DepthState,
  RenderVariant,
  StencilState,
  type TextureDescriptor,
} from '@gglib/graphics'
import {
  RenderChannel,
  RenderListMode,
  type FrameGraph,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import type { MsaaResolver } from './MsaaResolve'

// Fork of the gglib GeometryPass (packages/render/src/passes/GeometryPass.ts) for the viewer pipeline.
// Differences:
// - `channels` may be empty: a depth only pass (e.g. shadow maps). The viewport then follows the depth target.
// - `variant` selects the material effect variant (RenderVariant) the list is collected and drawn with.
//   Caveat until render list caching is variant aware (plan step 2.2): two passes using the same `list` mode with
//   different variants would share one cached list. Use distinct RenderListMode instances per variant.

/**
 * Describes a render target of the {@link GeometryPass}
 */
export interface GeometryPassChannel {
  /**
   * Channel the geometry is rendered into (usually multisampled)
   */
  render: RenderChannel
  /**
   * Clear color. If set, the channel is cleared and written as a new resource.
   * Otherwise the geometry is rendered on top of the existing content (modified in place).
   */
  clear: Color | null
  /**
   * Blend state of the channel. Defaults to opaque.
   */
  blend?: BlendState
  /**
   * Single sampled channel to resolve the output into. If not set, the output is not resolved.
   */
  resolve?: RenderChannel | null
  /**
   * Custom resolver. If not set, the hardware resolve (average) is used.
   */
  resolver?: MsaaResolver
}

export interface GeometryPassOptions {
  name?: string
  /**
   * The geometry list to render. Defaults to {@link RenderListMode.Opaque}
   */
  list: RenderListMode
  /**
   * The material effect variant to render with. Defaults to {@link RenderVariant.Forward}
   */
  variant?: RenderVariant
  /**
   * The render targets. May be empty for a depth only pass.
   */
  channels: GeometryPassChannel[]
  /**
   * The depth target. Defaults to {@link RenderChannel.DepthMsaa}
   */
  depth: RenderChannel
  /**
   * Whether to clear the depth target. If not set, the depth target is modified in place.
   */
  clearDepth: boolean
  /**
   * Channels that are sampled by materials (e.g. scene color or scene depth of a previous pass).
   * Declared as reads, so the frame graph keeps them alive during this pass.
   */
  inputs?: RenderChannel[]
  /**
   * Descriptors of custom channels this pass writes (registered on the frame graph in setup)
   */
  descriptors?: Record<RenderChannel, Readonly<TextureDescriptor>>
}

/**
 * Renders a geometry list into a set of (multisampled) render targets and resolves them.
 * Covers the opaque case (cleared targets) as well as the transparent case (render on top of existing targets).
 */
export class GeometryPass implements RenderPass {
  public name: string = 'GeometryPass'

  private list: RenderListMode
  private variant: RenderVariant
  private channels: GeometryPassChannel[]
  private depth: RenderChannel
  private clearDepth: boolean
  private inputs: RenderChannel[]
  private descriptors: Record<RenderChannel, Readonly<TextureDescriptor>> | null
  private hasClear: boolean

  private depthResource: FrameResource
  private renderResources: FrameResource[] = []
  private resolveResources: Array<FrameResource | null> = []
  private resolver: Array<MsaaResolver | null> = []
  private frame: FrameGraph<RenderPass>
  // whether clearing and drawing can share one render pass: all targets are cleared, or none
  private singlePass: boolean

  public constructor(options: GeometryPassOptions) {
    this.name = options?.name ?? this.name
    this.list = options?.list ?? RenderListMode.Opaque
    this.variant = options?.variant ?? RenderVariant.Forward
    this.channels = options?.channels ?? []
    this.depth = options?.depth ?? RenderChannel.DepthMsaa
    this.clearDepth = options?.clearDepth ?? false
    this.inputs = options?.inputs ?? []
    this.descriptors = options?.descriptors ?? null
    this.hasClear = this.clearDepth || this.channels.some((it) => !!it.clear)
    this.singlePass = !this.hasClear || (this.clearDepth && this.channels.every((it) => !!it.clear))
    this.resolver = this.channels.map((it) => it.resolver ?? null)
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.frame = frame
    if (this.descriptors) {
      frame.setDescriptors(this.descriptors)
    }
    frame.addPass(this)

    // reads first, so that a subsequent write of the same channel creates a new version
    for (const channel of this.inputs) {
      frame.read(channel)
    }

    if (this.clearDepth) {
      this.depthResource = frame.write(this.depth)
    } else {
      this.depthResource = frame.modifyInPlace(this.depth)
    }

    for (let i = 0; i < this.channels.length; i++) {
      const channel = this.channels[i]
      this.renderResources[i] = channel.clear ? frame.write(channel.render) : frame.modifyInPlace(channel.render)
      this.resolveResources[i] = channel.resolve ? frame.write(channel.resolve) : null
    }
  }

  /**
   * Whether no later pass needs the content of the resource
   */
  private isLastUse(resource: FrameResource) {
    return !resource.exported && this.frame.nodes[resource.lastUse]?.pass === this
  }

  /**
   * Whether a later pass overwrites the resolved channel without reading it, so resolving here is wasted work
   */
  private isOverwritten(resource: FrameResource) {
    // passes that modify the resource in place read the resolved content, so they don't count
    const writer = resource.writer
    return !!writer && writer.pass !== this && !writer.culled
  }

  public render(ctx: RenderContext): void {
    const pass = ctx.device.renderPass
    const viewport = this.renderResources[0]?.texture ?? this.depthResource.texture
    const variant = ctx.renderVariant
    ctx.renderVariant = this.variant

    pass.flush()
    pass.setAsync(true)
    pass.setCullState(CullState.CullBack)
    pass.setStencilState(StencilState.Default)
    pass.setViewportState(0, 0, viewport.width, viewport.height)

    try {
      if (this.singlePass) {
        this.renderSinglePass(ctx)
      } else {
        this.renderSeparateClear(ctx)
      }
    } finally {
      ctx.renderVariant = variant
    }
    pass.flush()
  }

  /**
   * Clears, draws and resolves in one render pass. Multisampled targets that no later pass uses are discarded,
   * so tile based GPUs never write their samples to memory
   */
  private renderSinglePass(ctx: RenderContext) {
    const pass = ctx.device.renderPass
    const targets = this.renderResources
    const resolves = this.resolveResources
    const resolvers = this.resolver

    pass.setDepthTarget(this.depthResource.texture)
    pass.setDepthDiscard(this.isLastUse(this.depthResource))
    let hasHardwareResolve = false
    for (let i = 0; i < this.channels.length; i++) {
      const resolve = resolves[i] && !this.isOverwritten(resolves[i]) ? resolves[i] : null
      const hardware = !!resolve && !resolvers[i]
      hasHardwareResolve ||= hardware
      pass.setRenderTarget(i, targets[i].texture, 0, 0, hardware ? resolve.texture : null)
      // a custom resolver reads the samples after the pass
      pass.setDiscard(i, this.isLastUse(targets[i]) && !(resolve && resolvers[i]))
      pass.setRenderBlend(i, this.channels[i].blend ?? BlendState.Opaque)
      if (this.channels[i].clear) {
        pass.setClearColor(i, this.channels[i].clear)
      }
    }
    if (this.hasClear) {
      pass.setClearDepth(ctx.view.camera.reversedZ ? 0 : 1)
      pass.clear()
    }
    pass.setDepthState(ctx.view.camera.reversedZ ? DepthState.GreaterEqual : DepthState.LessEqual)
    pass.render(ctx.renderer.getList(this.list, ctx))
    if (hasHardwareResolve) {
      pass.resolve()
    }
    pass.submit()

    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    for (let i = 0; i < targets.length; i++) {
      pass.setRenderTarget(i, null)
    }

    // custom resolve
    for (let i = 0; i < targets.length; i++) {
      if (resolves[i] && resolvers[i] && !this.isOverwritten(resolves[i])) {
        resolvers[i].resolve(pass, targets[i].texture, resolves[i].texture)
        pass.setRenderTarget(0, null)
      }
    }
    pass.submit()
  }

  /**
   * Clears some targets and loads others, so clearing needs its own pass
   */
  private renderSeparateClear(ctx: RenderContext) {
    const pass = ctx.device.renderPass
    const targets = this.renderResources

    // #region Clear
    if (this.hasClear) {
      pass.setDepthTarget(this.clearDepth ? this.depthResource.texture : null)
      pass.setClearDepth(ctx.view.camera.reversedZ ? 0 : 1)
      for (let i = 0; i < this.channels.length; i++) {
        const clear = this.channels[i].clear
        if (clear) {
          pass.setRenderTarget(i, targets[i].texture)
          pass.setClearColor(i, clear)
        } else {
          pass.setRenderTarget(i, null)
        }
      }
      pass.clear()
    }
    // #endregion

    // #region Render
    pass.setDepthTarget(this.depthResource.texture)
    pass.setDepthState(ctx.view.camera.reversedZ ? DepthState.GreaterEqual : DepthState.LessEqual)
    for (let i = 0; i < this.channels.length; i++) {
      pass.setRenderTarget(i, targets[i].texture)
      pass.setRenderBlend(i, this.channels[i].blend ?? BlendState.Opaque)
    }
    pass.render(ctx.renderer.getList(this.list, ctx))
    pass.submit()

    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    // #endregion

    // #region Resolve
    {
      const resolves = this.resolveResources
      const resolvers = this.resolver
      let hasHardwareResolve = false
      for (let i = 0; i < targets.length; i++) {
        if (resolves[i] && !resolvers[i]) {
          pass.setRenderTarget(i, targets[i].texture, 0, 0, resolves[i].texture)
          hasHardwareResolve = true
        } else {
          pass.setRenderTarget(i, null)
        }
      }
      if (hasHardwareResolve) {
        pass.resolve()
      }
      for (let i = 0; i < targets.length; i++) {
        pass.setRenderTarget(i, null)
      }

      // custom resolve
      for (let i = 0; i < targets.length; i++) {
        if (resolves[i] && resolvers[i]) {
          resolvers[i].resolve(pass, targets[i].texture, resolves[i].texture)
          pass.setRenderTarget(0, null)
        }
      }
      pass.submit()
    }
    // #endregion
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
