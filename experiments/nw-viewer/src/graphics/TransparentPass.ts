import { BlendState, CullState, DepthState, StencilState } from '@gglib/graphics'
import {
  FrameGraph,
  RenderChannel,
  RenderListMode,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import { resolveTargets, type MsaaResolver } from './MsaaResolve'

export interface TransparentPassOptions {
  /**
   * Execution order of this pass. Must run after the opaque pass
   */
  order?: number
  /**
   * MSAA Channel names, rendered on top of the opaque result (not cleared)
   */
  outputsMsaa?: RenderChannel[]
  /**
   * Single sample channel names. A null entry skips the resolve of the corresponding msaa channel
   */
  outputs?: Array<RenderChannel | null>
  /**
   * Custom resolver for each channel. Channels without a resolver use the hardware resolve (average)
   */
  resolver?: Array<MsaaResolver | null>
  /**
   * Blend state for each channel. Defaults to alpha blending for the first channel and opaque for the rest
   */
  blend?: BlendState[]
  /**
   * Channels that are sampled by transparent materials (e.g. scene color or scene depth set by the opaque pass).
   * Declared as reads, so the frame graph keeps them alive during this pass.
   */
  inputs?: RenderChannel[]
}

/**
 * Renders transparent geometry on top of the msaa targets of the opaque pass and resolves the result.
 */
export class TransparentPass implements RenderPass {
  public order = 10
  public name: string = 'TransparentPass'

  private outputsMsaa: RenderChannel[]
  private outputs: Array<RenderChannel | null>
  private inputs: RenderChannel[]
  private resourcesMsaa: FrameResource[] = []
  private resources: Array<FrameResource | null> = []
  private resolver: Array<MsaaResolver | null>
  private blend: BlendState[]

  private msaaDepth: FrameResource

  public constructor(options?: TransparentPassOptions) {
    this.order = options?.order ?? this.order
    this.outputs = options?.outputs ?? [RenderChannel.Color]
    this.outputsMsaa = options?.outputsMsaa ?? [RenderChannel.ColorMsaa]
    this.inputs = options?.inputs ?? []
    this.resolver = options?.resolver ?? []
    this.blend = options?.blend ?? this.outputsMsaa.map((_, i) => (i === 0 ? BlendState.Alpha : BlendState.Opaque))

    if (this.outputs.length !== this.outputsMsaa.length) {
      throw new Error(
        `number of msaa channels and output channels must match: ${this.outputsMsaa.length} != ${this.outputs.length}`,
      )
    }
    if (!this.outputsMsaa.length) {
      throw new Error(`no output channels`)
    }
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    frame.addPass(this)

    for (const channel of this.inputs) {
      frame.read(channel)
    }
    this.msaaDepth = frame.modifyInPlace(RenderChannel.DepthMsaa)
    for (let i = 0; i < this.outputsMsaa.length; i++) {
      this.resourcesMsaa[i] = frame.modifyInPlace(this.outputsMsaa[i])
      this.resources[i] = this.outputs[i] ? frame.write(this.outputs[i]) : null
    }
  }

  public render(ctx: RenderContext): void {
    const pass = ctx.device.renderPass

    pass.flush()
    pass.setAsync(true)
    pass.setCullState(CullState.CullBack)
    pass.setStencilState(StencilState.Default)

    // Depth Target
    pass.setDepthTarget(this.msaaDepth.texture)
    if (ctx.view.camera.reversedZ) {
      pass.setDepthState(DepthState.GreaterEqual)
    } else {
      pass.setDepthState(DepthState.LessEqual)
    }

    // Render Targets, no clear
    for (let i = 0; i < this.outputsMsaa.length; i++) {
      pass.setRenderTarget(i, this.resourcesMsaa[i].texture)
      pass.setRenderBlend(i, this.blend[i] ?? BlendState.Opaque)
    }
    pass.setViewportState(0, 0, this.resourcesMsaa[0].texture.width, this.resourcesMsaa[0].texture.height)

    pass.render(ctx.renderer.getList(RenderListMode.Transparent, ctx))
    pass.submit()

    resolveTargets(pass, this.resourcesMsaa, this.resources, this.resolver)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
