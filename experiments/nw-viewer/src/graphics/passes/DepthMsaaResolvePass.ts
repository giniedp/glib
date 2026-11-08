import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import { DepthState, StencilState, type Device, type Program } from '@gglib/graphics'
import { FrameGraph, type FrameResource, type RenderChannel, type RenderContext, type RenderPass } from '@gglib/render'

const WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

@group(0) @binding(0) var depthMsaa: texture_depth_multisampled_2d;

// the farthest sample. Reversed z: min
@fragment
fn fs_main(in: FragmentInput) -> @builtin(frag_depth) f32 {
  let p = vec2i(in.position.xy);
  var depth = textureLoad(depthMsaa, p, 0);
  for (var s = 1; s < 4; s++) {
    depth = min(depth, textureLoad(depthMsaa, p, s));
  }
  return depth;
}
`

export interface DepthMsaaResolvePassOptions {
  /**
   * 4x multisampled depth target (depth24plus-stencil8)
   */
  input: RenderChannel
  /**
   * Single sample depth target of the same format
   */
  output: RenderChannel
}

/**
 * Resolves the multisampled hardware depth into a single sample depth target, for the passes after the deferred
 * lighting that render single sampled (plan step 4.3).
 *
 * Takes the farthest sample: a surface drawn again at 1x (e.g. the emissive variant) is evaluated at the pixel
 * center, which never lies behind the farthest of the symmetric sample positions, so it passes a GreaterEqual test.
 * Assumes reversed z.
 */
export class DepthMsaaResolvePass implements RenderPass {
  public name: string = 'DepthResolve'
  public enabled = true

  private options: DepthMsaaResolvePassOptions
  private program: Program
  private input: FrameResource
  private output: FrameResource

  public constructor(device: Device, options: DepthMsaaResolvePassOptions) {
    this.options = options
    device.ready.then(() => {
      this.program = device.createShaderModule({ name: 'NW Depth MSAA Resolve', wgsl: { source: WGSL } }).program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!this.enabled) {
      return
    }
    // declared before the shader is compiled, later passes depth test against the output
    frame.addPass(this)
    this.input = frame.read(this.options.input)
    this.output = frame.write(this.options.output)
  }

  public render(ctx: RenderContext): void {
    if (!this.program?.isCompiled) {
      return
    }
    const pass = ctx.device.renderPass
    const target = this.output.texture
    pass.flush()
    this.program.mustSet('depthMsaa', this.input.texture)
    this.program.commit()
    pass.setDepthTarget(target)
    pass.setDepthState(DepthState.Always)
    pass.setStencilState(StencilState.Default)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
