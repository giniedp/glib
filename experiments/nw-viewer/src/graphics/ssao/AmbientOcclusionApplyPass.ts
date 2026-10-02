import { BlendState, type Device, type Program } from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { XE_GTAO_APPLY_WGSL } from './XeGtao.wgsl'
import { NwRenderChannel } from './XeGtaoPass'

export interface AmbientOcclusionApplyPassOptions {
  /**
   * Whether this pass is enabled. The input channel must be produced by a previous pass when enabled
   */
  enabled?: boolean
  /**
   * Occlusion term channel
   */
  input?: RenderChannel
  /**
   * Color channels to multiply with the occlusion term (modified in place)
   */
  targets?: RenderChannel[]
  /**
   * Blends between no occlusion (0) and full occlusion (1)
   */
  strength?: number
}

/**
 * Multiplies color channels with the ambient occlusion term.
 *
 * Applies to the msaa color (so transparent geometry is rendered on top of the occluded scene)
 * and to the resolved color (so the scene color input for transparent materials matches)
 */
export class AmbientOcclusionApplyPass implements RenderPass {
  public name: string = 'AmbientOcclusionApply'

  public enabled = true
  public strength = 1

  private input: RenderChannel
  private targets: RenderChannel[]
  private isActive = false
  private program: Program
  private params = new Float32Array(4)

  private inputResource: FrameResource
  private targetResources: FrameResource[] = []

  public constructor(device: Device, options?: AmbientOcclusionApplyPassOptions) {
    this.enabled = options?.enabled ?? this.enabled
    this.input = options?.input ?? NwRenderChannel.AmbientOcclusion
    this.targets = options?.targets ?? [RenderChannel.ColorMsaa, RenderChannel.Color]
    this.strength = options?.strength ?? this.strength
    device.ready.then(() => {
      this.program = device
        .createShaderModule({ name: 'XeGTAO Apply', wgsl: { source: XE_GTAO_APPLY_WGSL } })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && !!this.program?.isCompiled && this.strength > 0
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    this.inputResource = frame.read(this.input)
    this.targetResources.length = 0
    for (const channel of this.targets) {
      this.targetResources.push(frame.modifyInPlace(channel))
    }
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const pass = ctx.device.renderPass
    pass.flush()

    this.params[0] = this.strength
    this.program.mustSet('params.values', this.params)
    this.program.mustSet('aoMap', this.inputResource.texture)
    this.program.commit()

    for (const resource of this.targetResources) {
      const target = resource.texture
      pass.setRenderTarget(0, target)
      pass.setRenderBlend(0, BlendState.Multiply)
      pass.setViewportState(0, 0, target.width, target.height)
      pass.setProgram(this.program)
      pass.draw(3)
      pass.submit()
    }
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
