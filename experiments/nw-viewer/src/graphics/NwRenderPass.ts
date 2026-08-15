import { BlendState, CullState, DepthState, StencilState } from '@gglib/graphics'
import {
  type FrameGraph,
  type FrameResource,
  type RenderContext,
  type RenderPass,
  RenderChannel,
  RenderListMode,
} from '@gglib/render'

export class GeometryPass implements RenderPass {
  public order = 0
  public name: string = 'GeometryPass'

  private msaaColor: FrameResource
  private msaaSceneDepth: FrameResource
  private msaaDepth: FrameResource
  private outColor: FrameResource

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    frame.addPass(this)
    this.msaaColor = frame.write(RenderChannel.ColorMsaa)
    this.msaaDepth = frame.write(RenderChannel.DepthMsaa)
    this.outColor = frame.write(RenderChannel.Color)
  }

  public render(ctx: RenderContext): void {
    const device = ctx.device
    const pass = device.renderPass
    pass.flush()
    pass.setRenderTarget(0, this.msaaColor.texture)
    pass.setDepthTarget(this.msaaDepth.texture)

    pass.setCullState(CullState.CullBack)
    pass.setStencilState(StencilState.Default)

    pass.setClearColor(0, ctx.renderer.clearColor)
    if (ctx.view.camera.reversedZ) {
      pass.setDepthState(DepthState.GreaterEqual)
      pass.setClearDepth(0)
    } else {
      pass.setDepthState(DepthState.LessEqual)
      pass.setClearDepth(1.1)
    }
    pass.clear()

    pass.setRenderBlend(0, BlendState.Opaque)
    pass.render(ctx.renderer.getList(RenderListMode.Opaque, ctx))
    pass.submit()

    pass.setRenderBlend(0, BlendState.Alpha)
    pass.render(ctx.renderer.getList(RenderListMode.Transparent, ctx))
    pass.submit()

    pass.setRenderTarget(0, this.msaaColor.texture, 0, 0, this.outColor.texture)
    pass.setDepthTarget(null)
    pass.resolve()
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
