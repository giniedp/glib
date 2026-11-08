import { RenderChannel, RenderListMode, type FrameGraph, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots, NwRenderVariant } from '../../material/common'
import { GeometryPass } from './GeometryPass'

/**
 * Draws the material debug views (`global.debug`, the "Output" select) of opaque surfaces over the lit color, with
 * the {@link NwRenderVariant.Debug} effects (`fs_debug`). Only runs while a debug mode is selected. Shading modes
 * have no material view, their `fs_debug` discards and the lighting pass shows them.
 */
export class MaterialDebugPass extends GeometryPass {
  public constructor() {
    super({
      name: 'MaterialDebugPass',
      list: RenderListMode.Opaque,
      variant: NwRenderVariant.Debug,
      depth: RenderChannel.Depth,
      clearDepth: false,
      channels: [{ clear: null, render: RenderChannel.Color }],
    })
  }

  public override setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!ctx.renderInputs.get(InputSlots.Global.Debug)) {
      return
    }
    super.setup(frame, ctx)
  }
}
