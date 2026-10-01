import { BlendState, Color, CullState, DepthState, RenderEncoder, StencilState, Texture } from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderListMode } from '../RenderListMode'
import { RenderContext, RenderPass } from '../Types'

export function opaquePassMSAA() {
  return new GeometryPass({
    name: 'Opaque Pass MSAA',
    list: RenderListMode.Opaque,
    depth: RenderChannel.DepthMsaa,
    clearDepth: true,
    channels: [
      {
        clear: Color.TransparentBlack,
        render: RenderChannel.ColorMsaa,
        resolve: RenderChannel.Color,
        blend: BlendState.Opaque,
      },
    ],
  })
}

export function opaquePass() {
  return new GeometryPass({
    name: 'Opaque Pass',
    list: RenderListMode.Opaque,
    depth: RenderChannel.Depth,
    clearDepth: true,
    channels: [
      {
        clear: Color.TransparentBlack,
        render: RenderChannel.Color,
        blend: BlendState.Opaque,
      },
    ],
  })
}

export function transparentPassMSAA() {
  return new GeometryPass({
    name: 'Transparent Pass MSAA',
    clearDepth: false,
    list: RenderListMode.Transparent,
    depth: RenderChannel.DepthMsaa,
    channels: [
      {
        clear: null, // no clear, render on top
        render: RenderChannel.ColorMsaa,
        resolve: RenderChannel.Color,
        blend: BlendState.Alpha,
      },
    ],
  })
}

export function transparentPass() {
  return new GeometryPass({
    name: 'Transparent Pass',
    clearDepth: false,
    list: RenderListMode.Transparent,
    depth: RenderChannel.Depth,
    channels: [
      {
        clear: null, // no clear, render on top
        render: RenderChannel.Color,
        resolve: null, // no resolve, single sampled
        blend: BlendState.Alpha,
      },
    ],
  })
}

/**
 * Resolves a multisampled texture into a single sampled texture
 */
export interface MsaaResolver {
  resolve(pass: RenderEncoder, input: Texture, output: Texture): void
}

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
  resolve?: RenderChannel
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
   * The render targets. Defaults to a cleared {@link RenderChannel.ColorMsaa} resolved into {@link RenderChannel.Color}
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
}

/**
 * Renders a geometry list into a set of (multisampled) render targets and resolves them.
 * Covers the opaque case (cleared targets) as well as the transparent case (render on top of existing targets).
 */
export class GeometryPass implements RenderPass {
  public name: string = 'GeometryPass'

  private list: RenderListMode
  private channels: GeometryPassChannel[]
  private depth: RenderChannel
  private clearDepth: boolean
  private inputs: RenderChannel[]
  private hasClear: boolean

  private depthResource: FrameResource
  private renderResources: FrameResource[] = []
  private resolveResources: Array<FrameResource | null> = []
  private resolver: Array<MsaaResolver | null> = []

  public constructor(options: GeometryPassOptions) {
    this.name = options?.name ?? this.name
    this.list = options?.list ?? RenderListMode.Opaque
    if (options?.channels?.length) {
      this.channels = options.channels
    } else {
      this.channels = [
        {
          render: RenderChannel.ColorMsaa,
          clear: Color.TransparentBlack,
          resolve: RenderChannel.Color,
        },
      ]
    }
    this.depth = options?.depth ?? RenderChannel.DepthMsaa
    this.clearDepth = options?.clearDepth ?? false
    this.inputs = options?.inputs ?? []
    this.hasClear = this.clearDepth || this.channels.some((it) => !!it.clear)
    this.resolver = this.channels.map((it) => it.resolver ?? null)

    if (!this.channels.length) {
      throw new Error(`no output channels`)
    }
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
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

  public render(ctx: RenderContext): void {
    const pass = ctx.device.renderPass
    const targets = this.renderResources

    pass.flush()
    pass.setAsync(true)
    pass.setCullState(CullState.CullBack)
    pass.setStencilState(StencilState.Default)
    pass.setViewportState(0, 0, targets[0].texture.width, targets[0].texture.height)

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

    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
