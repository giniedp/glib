import {
  BlendState,
  Color,
  CommonInputs,
  CullState,
  DepthState,
  InputSlot,
  RenderEncoder,
  StencilState,
  Texture,
} from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderListMode } from '../RenderListMode'
import { RenderContext, RenderPass } from '../types'

export interface GeometryPassOptions {
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
  resolver?: Array<{ resolve: (pass: RenderEncoder, input: Texture, output: Texture) => void }>
  /**
   * Input slots to set on context after opaque pass
   */
  slots?: Array<InputSlot<'texture'> | null>
}

export class GeometryPass implements RenderPass {
  public order = 0
  public name: string = 'GeometryPass'

  private clearColors: Color[]
  private outputsMsaa: RenderChannel[]
  private outputs: RenderChannel[]
  private resourcesMsaa: FrameResource[]
  private resources: FrameResource[]
  private resolver: Array<{ resolve: (pass: RenderEncoder, input: Texture, output: Texture) => void }>
  private slots: InputSlot<'texture'>[]

  private msaaDepth: FrameResource

  public constructor(options?: GeometryPassOptions) {
    this.order = options?.order ?? this.order
    this.outputs = options?.outputs ?? [RenderChannel.Color]
    this.outputsMsaa = options?.outputsMsaa ?? [RenderChannel.ColorMsaa]
    this.clearColors = options?.clearColors ?? this.outputs.map(() => Color.TransparentBlack)
    this.slots = options?.slots ?? [CommonInputs.View.SceneColorMap]
    this.resolver = options?.resolver ?? []
    this.resources = []
    this.resourcesMsaa = []

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
      this.resources[i] = frame.write(this.outputs[i])
      this.resourcesMsaa[i] = frame.write(this.outputsMsaa[i])
    }
  }

  public render(ctx: RenderContext): void {
    const device = ctx.device
    const pass = device.renderPass

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

    // Render Target setup for opaque pass
    for (let i = 0; i < this.outputs.length; i++) {
      pass.setRenderTarget(i, this.resourcesMsaa[i].texture)
      pass.setClearColor(i, this.clearColors[i] ?? Color.TransparentBlack)
      pass.setRenderBlend(i, BlendState.Opaque)
    }
    pass.setViewportState(0, 0, this.resourcesMsaa[0].texture.width, this.resourcesMsaa[0].texture.height)
    pass.clear()

    // Render opaque pass
    pass.render(ctx.renderer.getList(RenderListMode.Opaque, ctx))
    pass.submit()

    // Resolve rendered result, to feed into context for next pass
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    for (let i = 0; i < this.outputs.length; i++) {
      if (this.resolver[i]) {
        pass.setRenderTarget(i, null)
      } else {
        pass.setRenderTarget(i, this.resourcesMsaa[i].texture, 0, 0, this.resources[i].texture)
      }
    }
    pass.resolve()
    for (let i = 0; i < this.outputs.length; i++) {
      pass.setRenderTarget(i, null)
    }
    for (let i = 0; i < this.outputs.length; i++) {
      if (this.resolver[i]) {
        this.resolver[i].resolve(pass, this.resourcesMsaa[i].texture, this.resources[i].texture)
      }
      pass.setRenderTarget(i, null)
    }

    // Update context input
    for (let i = 0; i < this.outputs.length; i++) {
      if (this.slots[i]) {
        ctx.renderInputs.set(this.slots[i], this.resources[i].texture)
      }
    }

    // Render Target setup for transparent pass
    pass.setDepthTarget(this.msaaDepth.texture)
    if (ctx.view.camera.reversedZ) {
      pass.setDepthState(DepthState.GreaterEqual)
      pass.setClearDepth(0)
    } else {
      pass.setDepthState(DepthState.LessEqual)
      pass.setClearDepth(1)
    }
    for (let i = 0; i < this.outputs.length; i++) {
      pass.setRenderTarget(i, this.resourcesMsaa[i].texture)
      pass.setRenderBlend(i, i === 0 ? BlendState.Alpha : BlendState.Opaque)
    }

    // Render transparent pass
    pass.render(ctx.renderer.getList(RenderListMode.Transparent, ctx))
    pass.submit()

    // Resolve rendered result
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    for (let i = 0; i < this.outputs.length; i++) {
      pass.setRenderTarget(i, this.resourcesMsaa[i].texture, 0, 0, this.resources[i].texture)
    }
    pass.resolve()
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
