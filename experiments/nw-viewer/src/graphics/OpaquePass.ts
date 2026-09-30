import { BlendState, Color, CommonInputs, CullState, DepthState, StencilState, type InputSlot } from '@gglib/graphics'
import {
  FrameGraph,
  RenderChannel,
  RenderListMode,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import { resolveTargets, type MsaaResolver } from './MsaaResolve'

export interface OpaquePassOptions {
  /**
   * Execution order of this pass, usually 0
   */
  order?: number
  /**
   * Clear colors for each channel
   */
  clearColors?: Color[]
  /**
   * MSAA Channel names
   */
  outputsMsaa?: RenderChannel[]
  /**
   * Single sample channel names
   */
  outputs?: RenderChannel[]
  /**
   * Custom resolver for each channel. Channels without a resolver use the hardware resolve (average)
   */
  resolver?: Array<MsaaResolver | null>
  /**
   * Input slots to set on context after the pass
   */
  slots?: Array<InputSlot<'texture'> | null>
}

/**
 * Clears the MSAA targets, renders opaque geometry and resolves the result into the single sampled outputs.
 */
export class OpaquePass implements RenderPass {
  public order = 0
  public name: string = 'OpaquePass'

  private clearColors: Color[]
  private outputsMsaa: RenderChannel[]
  private outputs: RenderChannel[]
  private resourcesMsaa: FrameResource[] = []
  private resources: FrameResource[] = []
  private resolver: Array<MsaaResolver | null>
  private slots: Array<InputSlot<'texture'> | null>

  private msaaDepth: FrameResource

  public constructor(options?: OpaquePassOptions) {
    this.order = options?.order ?? this.order
    this.outputs = options?.outputs ?? [RenderChannel.Color]
    this.outputsMsaa = options?.outputsMsaa ?? [RenderChannel.ColorMsaa]
    this.clearColors = options?.clearColors ?? this.outputs.map(() => Color.TransparentBlack)
    this.slots = options?.slots ?? [CommonInputs.View.SceneColorMap]
    this.resolver = options?.resolver ?? []

    if (this.outputs.length !== this.outputsMsaa.length) {
      throw new Error(
        `number of msaa channels and output channels must match: ${this.outputsMsaa.length} != ${this.outputs.length}`,
      )
    }
    if (!this.outputs.length) {
      throw new Error(`no output channels`)
    }
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    frame.addPass(this)

    this.msaaDepth = frame.write(RenderChannel.DepthMsaa)
    for (let i = 0; i < this.outputs.length; i++) {
      this.resourcesMsaa[i] = frame.write(this.outputsMsaa[i])
      this.resources[i] = frame.write(this.outputs[i])
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
      pass.setClearDepth(0)
    } else {
      pass.setDepthState(DepthState.LessEqual)
      pass.setClearDepth(1)
    }

    // Render Targets
    for (let i = 0; i < this.outputs.length; i++) {
      pass.setRenderTarget(i, this.resourcesMsaa[i].texture)
      pass.setClearColor(i, this.clearColors[i] ?? Color.TransparentBlack)
      pass.setRenderBlend(i, BlendState.Opaque)
    }
    pass.setViewportState(0, 0, this.resourcesMsaa[0].texture.width, this.resourcesMsaa[0].texture.height)
    pass.clear()

    pass.render(ctx.renderer.getList(RenderListMode.Opaque, ctx))
    pass.submit()

    resolveTargets(pass, this.resourcesMsaa, this.resources, this.resolver)

    // Update context input
    for (let i = 0; i < this.outputs.length; i++) {
      if (this.slots[i]) {
        ctx.renderInputs.set(this.slots[i], this.resources[i].texture)
      }
    }
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
