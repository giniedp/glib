import { BlendState, CommonInputs, CullState, DepthState, StencilState } from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderListMode } from '../RenderListMode'
import { RenderContext, RenderPass } from '../types'

export class GeometryPass implements RenderPass {
  public order = 0
  public name: string = 'GeometryPass'

  private msaaColor: FrameResource
  private msaaDepth: FrameResource
  private linearDepthMsaa: FrameResource
  private linearDepthRes: FrameResource
  private outColor: FrameResource

  public enableLinearDepthMrt = false

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    frame.addPass(this)
    this.msaaColor = frame.write(RenderChannel.ColorMsaa)
    this.msaaDepth = frame.write(RenderChannel.DepthMsaa)
    this.outColor = frame.write(RenderChannel.Color)
    if (this.enableLinearDepthMrt) {
      this.linearDepthMsaa = frame.write(RenderChannel.LinearDepthMsaa)
      this.linearDepthRes = frame.write(RenderChannel.LinearDepthRes)
    }
  }

  public render(ctx: RenderContext): void {
    const device = ctx.device
    const pass = device.renderPass

    pass.flush()
    pass.setAsync(true)
    pass.setCullState(CullState.CullBack)
    pass.setStencilState(StencilState.Default)

    // Render Target 0 - color + resolve target
    pass.setRenderTarget(0, this.msaaColor.texture)
    pass.setClearColor(0, ctx.renderer.clearColor)

    // Render Target 1 - depth + resolve target
    if (this.enableLinearDepthMrt) {
      pass.setRenderTarget(1, this.linearDepthMsaa.texture)
      pass.setClearColor(1, [0, 0, 0, 0])
    }

    // Depth Target
    pass.setDepthTarget(this.msaaDepth.texture)
    if (ctx.view.camera.reversedZ) {
      pass.setDepthState(DepthState.GreaterEqual)
      pass.setClearDepth(0)
    } else {
      pass.setDepthState(DepthState.LessEqual)
      pass.setClearDepth(1)
    }

    pass.clear()

    // Opaque objects
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setRenderBlend(1, BlendState.Opaque)
    pass.render(ctx.renderer.getList(RenderListMode.Opaque, ctx))
    pass.submit()

    // Resolve intermediate results for next pass
    pass.setRenderTarget(0, this.msaaColor.texture, 0, 0, this.outColor.texture)
    if (this.enableLinearDepthMrt) {
      pass.setRenderTarget(1, this.linearDepthMsaa.texture, 0, 0, this.linearDepthRes.texture)
    }
    pass.setDepthTarget(null)
    pass.resolve()
    pass.setRenderTarget(0, this.msaaColor.texture)
    if (this.enableLinearDepthMrt) {
      pass.setRenderTarget(1, this.linearDepthMsaa.texture)
    }
    pass.setDepthTarget(this.msaaDepth.texture)

    ctx.renderInputs.set(CommonInputs.View.SceneColorMap, this.outColor.texture)
    if (this.enableLinearDepthMrt) {
      ctx.renderInputs.set(CommonInputs.View.SceneDepthMap, this.linearDepthRes.texture)
    }

    // Transparent objects
    pass.setRenderBlend(0, BlendState.Alpha)
    pass.setRenderBlend(1, BlendState.Opaque)
    pass.render(ctx.renderer.getList(RenderListMode.Transparent, ctx))
    pass.submit()

    // Resolve MSAA and copy to output
    pass.setRenderTarget(0, this.msaaColor.texture, 0, 0, this.outColor.texture)
    if (this.enableLinearDepthMrt) {
      pass.setRenderTarget(1, this.linearDepthMsaa.texture, 0, 0, this.linearDepthRes.texture)
    }
    pass.setDepthTarget(null)
    pass.resolve()
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
