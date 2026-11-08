import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import { BlendState, DepthState, StencilState, type Device, type Program } from '@gglib/graphics'
import { FrameGraph, type FrameResource, type RenderChannel, type RenderContext, type RenderPass } from '@gglib/render'

const WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

@group(0) @binding(0) var depthMsaa: texture_depth_multisampled_2d;
@group(0) @binding(1) var linearDepthMsaa: texture_multisampled_2d<f32>;

struct ResolveOutput {
  @location(0) linearDepth: vec4f,
  @builtin(frag_depth) depth: f32,
};

// the farthest sample. Reversed z: min, linear depth: max
@fragment
fn fs_main(in: FragmentInput) -> ResolveOutput {
  let p = vec2i(in.position.xy);
  var depth = textureLoad(depthMsaa, p, 0);
  var linear = textureLoad(linearDepthMsaa, p, 0).r;
  for (var s = 1; s < 4; s++) {
    depth = min(depth, textureLoad(depthMsaa, p, s));
    linear = max(linear, textureLoad(linearDepthMsaa, p, s).r);
  }
  var out: ResolveOutput;
  out.depth = depth;
  out.linearDepth = vec4f(linear, 0.0, 0.0, 0.0);
  return out;
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
  /**
   * 4x multisampled linear view depth (r32float), 0 without geometry
   */
  linearInput: RenderChannel
  /**
   * Single sample linear depth target (r32float)
   */
  linearOutput: RenderChannel
}

/**
 * Resolves the multisampled hardware depth and linear depth into single sample targets, for the screen space passes
 * (AO) and the passes after the deferred lighting that render single sampled (plan steps 4.3, 5.1).
 *
 * Takes the farthest sample: a surface drawn again at 1x (e.g. the emissive variant) is evaluated at the pixel
 * center, which never lies behind the farthest of the symmetric sample positions, so it passes a GreaterEqual test.
 * The linear depth resolves to the farthest geometry sample. Pixels with samples without geometry get the far plane
 * from the sky pass, which draws exactly there. Assumes reversed z.
 */
export class DepthMsaaResolvePass implements RenderPass {
  public name: string = 'DepthResolve'
  public enabled = true

  private options: DepthMsaaResolvePassOptions
  private program: Program
  private input: FrameResource
  private output: FrameResource
  private linearInput: FrameResource
  private linearOutput: FrameResource

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
    this.linearInput = frame.read(this.options.linearInput)
    this.output = frame.write(this.options.output)
    this.linearOutput = frame.write(this.options.linearOutput)
  }

  public render(ctx: RenderContext): void {
    if (!this.program?.isCompiled) {
      return
    }
    const pass = ctx.device.renderPass
    const target = this.output.texture
    pass.flush()
    this.program.mustSet('depthMsaa', this.input.texture)
    this.program.mustSet('linearDepthMsaa', this.linearInput.texture)
    this.program.commit()
    pass.setDepthTarget(target)
    pass.setDepthState(DepthState.Always)
    pass.setStencilState(StencilState.Default)
    pass.setRenderTarget(0, this.linearOutput.texture)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
