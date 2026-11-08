import {
  SamplerState,
  TextureUsage,
  type Device,
  type GpuTimer,
  type Program,
  type WebGpuDevice,
} from '@gglib/graphics'
import { FrameGraph, type FrameResource, type RenderChannel, type RenderContext, type RenderPass } from '@gglib/render'
import { LIGHTING_WGSL, LIGHTING_WORKGROUP_SIZE } from './LightingPass.wgsl'

export interface LightingPassOptions {
  /**
   * Single sample GBuffer channels (layout in material/gbuffer.wgsl.ts)
   */
  a: RenderChannel
  b: RenderChannel
  c: RenderChannel
  /**
   * Linear view depth written with the GBuffer, zero where no geometry was rendered
   */
  linearDepth: RenderChannel
  /**
   * HDR color the lit pixels are written to (rgba16float). Pixels without geometry are cleared.
   */
  output: RenderChannel
}

/**
 * Deferred lighting compute pass of the single sample GBuffer
 */
export class LightingPass implements RenderPass {
  public name: string = 'LightingPass'
  public enabled = true
  public gpuTimer?: GpuTimer

  private options: LightingPassOptions
  private program: Program
  private inputs: FrameResource[] = []
  private target: FrameResource

  public constructor(device: Device, options: LightingPassOptions) {
    this.options = options
    device.ready.then(() => {
      this.program = device
        .createShaderModule({ name: 'NW Deferred Lighting', wgsl: { source: LIGHTING_WGSL } })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!this.enabled) {
      return
    }
    // declared before the shader is compiled, later passes read the output
    frame.addPass(this)
    const { a, b, c, linearDepth, output } = this.options
    this.inputs = [frame.read(a), frame.read(b), frame.read(c), frame.read(linearDepth)]
    this.target = frame.write(output, {
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding | TextureUsage.StorageBinding,
    })
  }

  public render(ctx: RenderContext): void {
    const program = this.program
    if (!program?.isCompiled) {
      return
    }
    const target = this.target.texture
    program.applyBlocks(ctx.renderInputs.blocks)
    program.mustSet('gbufferA', this.inputs[0].texture)
    program.mustSet('gbufferB', this.inputs[1].texture)
    program.mustSet('gbufferC', this.inputs[2].texture)
    program.mustSet('linearDepth', this.inputs[3].texture)
    program.mustSet('envSampler', SamplerState.LinearClamp)
    program.mustSet('outColor', target)
    program.commit()

    // the pipeline only times the render encoder, compute passes time themselves
    const pass = (ctx.device as WebGpuDevice).computePass
    if (this.gpuTimer) {
      pass.beginTimer(this.gpuTimer)
    }
    pass.setProgram(program)
    pass.dispatch(Math.ceil(target.width / LIGHTING_WORKGROUP_SIZE), Math.ceil(target.height / LIGHTING_WORKGROUP_SIZE))
    if (this.gpuTimer) {
      pass.endTimer(this.gpuTimer)
    }
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
