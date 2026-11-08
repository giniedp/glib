import {
  SamplerState,
  TextureUsage,
  type Device,
  type GpuTimer,
  type Program,
  type WebGpuDevice,
} from '@gglib/graphics'
import { FrameGraph, type FrameResource, type RenderChannel, type RenderContext, type RenderPass } from '@gglib/render'
import { LightingDebugModes, LIGHTING_WGSL, LIGHTING_WORKGROUP_SIZE, type LightingDebugMode } from './LightingPass.wgsl'

export interface LightingPassOptions {
  /**
   * GBuffer channels (layout in material/gbuffer.wgsl.ts)
   */
  a: RenderChannel
  b: RenderChannel
  c: RenderChannel
  /**
   * Linear view depth of the GBuffer pass, 0 without geometry
   */
  linearDepth: RenderChannel
  /**
   * Ambient occlusion term (1 = not occluded). Not applied while no pass produced it.
   */
  ao: RenderChannel
  /**
   * HDR color the lighting is written to (rgba16float)
   */
  output: RenderChannel
}

const STORAGE_USAGE = TextureUsage.RenderTarget | TextureUsage.TextureBinding | TextureUsage.StorageBinding

/**
 * Deferred lighting compute pass. Lights the GBuffer into the HDR color, pixels without geometry are left black for
 * the sky.
 */
export class LightingPass implements RenderPass {
  public name: string = 'LightingPass'
  public enabled = true
  public gpuTimer?: GpuTimer
  /**
   * 'ao' shows the ambient occlusion term
   */
  public debug: LightingDebugMode = 'off'
  /**
   * Blends between no ambient occlusion (0) and the full term (1)
   */
  public aoStrength = 1

  private options: LightingPassOptions
  private program: Program
  private inputs: FrameResource[] = []
  private aoInput: FrameResource | null = null
  private target: FrameResource
  private params = new Float32Array(4)

  public constructor(device: Device, options: LightingPassOptions) {
    this.options = options
    device.ready.then(() => {
      this.program = device
        .createShaderModule({
          name: 'NW Deferred Lighting',
          wgsl: { source: LIGHTING_WGSL },
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
    const { a, b, c, linearDepth, ao, output } = this.options
    this.inputs = [frame.read(a), frame.read(b), frame.read(c), frame.read(linearDepth)]
    // the AO pass declares its output only once its shaders are compiled
    this.aoInput = frame.has(ao) ? frame.read(ao) : null
    this.target = frame.write(output, { usage: STORAGE_USAGE })
  }

  public render(ctx: RenderContext): void {
    const program = this.program
    if (!program?.isCompiled) {
      return
    }
    const target = this.target.texture
    this.params[0] = LightingDebugModes.indexOf(this.debug)
    this.params[1] = this.aoInput ? 1 : 0
    this.params[2] = this.aoStrength
    program.applyBlocks(ctx.renderInputs.blocks)
    program.mustSet('gbufferA', this.inputs[0].texture)
    program.mustSet('gbufferB', this.inputs[1].texture)
    program.mustSet('gbufferC', this.inputs[2].texture)
    program.mustSet('linearDepth', this.inputs[3].texture)
    // without AO any filterable texture is bound, the shader does not read it
    program.mustSet('aoMap', (this.aoInput ?? this.inputs[0]).texture)
    program.mustSet('envSampler', SamplerState.LinearClamp)
    program.mustSet('outColor', target)
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
