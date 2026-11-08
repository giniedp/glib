import {
  SamplerState,
  TextureUsage,
  type Device,
  type GpuTimer,
  type Program,
  type WebGpuDevice,
} from '@gglib/graphics'
import { FrameGraph, type FrameResource, type RenderChannel, type RenderContext, type RenderPass } from '@gglib/render'
import { LightingDebugModes, lightingWgsl, LIGHTING_WORKGROUP_SIZE, type LightingDebugMode } from './LightingPass.wgsl'

export interface LightingPassOptions {
  /**
   * Sample count of the GBuffer channels
   */
  samples: 1 | 4
  /**
   * GBuffer channels (layout in material/gbuffer.wgsl.ts), multisampled when samples > 1
   */
  a: RenderChannel
  b: RenderChannel
  c: RenderChannel
  /**
   * Linear view depth written with the GBuffer, zero where no geometry was rendered. Same sample count as the GBuffer.
   */
  linearDepth: RenderChannel
  /**
   * Single sample sky color, composed into pixels and samples without geometry
   */
  sky: RenderChannel
  /**
   * Single sample HDR color the resolved lighting is written to (rgba16float)
   */
  output: RenderChannel
  /**
   * Single sample linear depth the resolved depth is written to (r32float): the farthest sample, the far plane
   * without geometry
   */
  outputDepth: RenderChannel
}

const STORAGE_USAGE = TextureUsage.RenderTarget | TextureUsage.TextureBinding | TextureUsage.StorageBinding

/**
 * Deferred lighting compute pass. Lights the GBuffer, shades edge pixels per sample with MSAA and resolves into
 * single sample color and linear depth.
 */
export class LightingPass implements RenderPass {
  public name: string = 'LightingPass'
  public enabled = true
  public gpuTimer?: GpuTimer
  /**
   * 'edges' tints the pixels that are shaded per sample
   */
  public debug: LightingDebugMode = 'off'

  private options: LightingPassOptions
  private program: Program
  private inputs: FrameResource[] = []
  private target: FrameResource
  private targetDepth: FrameResource
  private params = new Float32Array(4)

  public constructor(device: Device, options: LightingPassOptions) {
    this.options = options
    device.ready.then(() => {
      this.program = device
        .createShaderModule({
          name: `NW Deferred Lighting ${options.samples}x`,
          wgsl: { source: lightingWgsl(options.samples) },
        })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!this.enabled) {
      return
    }
    // declared before the shader is compiled, later passes read the output
    frame.addPass(this)
    const { a, b, c, linearDepth, sky, output, outputDepth } = this.options
    this.inputs = [frame.read(a), frame.read(b), frame.read(c), frame.read(linearDepth), frame.read(sky)]
    this.target = frame.write(output, { usage: STORAGE_USAGE })
    this.targetDepth = frame.write(outputDepth, { usage: STORAGE_USAGE })
  }

  public render(ctx: RenderContext): void {
    const program = this.program
    if (!program?.isCompiled) {
      return
    }
    const target = this.target.texture
    this.params[0] = LightingDebugModes.indexOf(this.debug)
    program.applyBlocks(ctx.renderInputs.blocks)
    program.mustSet('gbufferA', this.inputs[0].texture)
    program.mustSet('gbufferB', this.inputs[1].texture)
    program.mustSet('gbufferC', this.inputs[2].texture)
    program.mustSet('linearDepth', this.inputs[3].texture)
    program.mustSet('skyColor', this.inputs[4].texture)
    program.mustSet('envSampler', SamplerState.LinearClamp)
    program.mustSet('outColor', target)
    program.mustSet('outDepth', this.targetDepth.texture)
    program.mustSet('params.values', this.params)
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
