import { BlendState, type Device, type InputValueType, type Program } from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../material/common'
import { FOG_MSAA_WGSL, FOG_WGSL } from './FogPass.wgsl'

export interface FogPassTarget {
  /**
   * Color channel to apply fog to (modified in place)
   */
  color: RenderChannel
  /**
   * Linear view space depth channel with the same size and sample count as the color channel
   */
  depth: RenderChannel
}

export interface FogPassOptions {
  enabled?: boolean
  targets?: FogPassTarget[]
}

/**
 * `dst = src.rgb + dst.rgb * src.a`, keeps destination alpha
 */
const FOG_BLEND = BlendState.get({
  enable: true,
  colorBlendFunction: 'add',
  colorSrcBlend: 'one',
  colorDstBlend: 'src-alpha',
  alphaBlendFunction: 'add',
  alphaSrcBlend: 'zero',
  alphaDstBlend: 'one',
})

/**
 * Applies volumetric fog to opaque geometry (deferred).
 *
 * Opaque materials skip fog while {@link InputSlots.Global.SkipFog} is set, so fog is applied
 * after screen space effects (e.g. ambient occlusion) and before transparent geometry.
 * Pixels without depth or at the far plane (sky) are skipped, the sky applies its own fog.
 */
export class FogPass implements RenderPass {
  public name: string = 'Fog'
  public enabled = true

  private targets: FogPassTarget[]
  private program: Program
  private programMsaa: Program
  private isActive = false

  private colorResources: FrameResource[] = []
  private depthResources: FrameResource[] = []

  private ndcToView = new Float32Array(4)
  private viewport = new Float32Array(4)
  private depthRange = new Float32Array(4)

  private get isReady() {
    return !!this.program?.isCompiled && !!this.programMsaa?.isCompiled
  }

  public constructor(device: Device, options?: FogPassOptions) {
    this.enabled = options?.enabled ?? this.enabled
    this.targets = options?.targets ?? [
      { color: RenderChannel.ColorMsaa, depth: RenderChannel.LinearDepthMsaa },
      { color: RenderChannel.Color, depth: RenderChannel.LinearDepth },
    ]
    device.ready.then(() => {
      this.program = device.createShaderModule({ name: 'NW Fog', wgsl: { source: FOG_WGSL } }).program.clone()
      this.programMsaa = device
        .createShaderModule({ name: 'NW Fog MSAA', wgsl: { source: FOG_MSAA_WGSL } })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && this.isReady
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    this.colorResources.length = 0
    this.depthResources.length = 0
    for (const target of this.targets) {
      this.depthResources.push(frame.read(target.depth))
      this.colorResources.push(frame.modifyInPlace(target.color))
    }
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }

    const pass = ctx.device.renderPass
    pass.flush()

    this.updateParams(ctx)
    for (let i = 0; i < this.colorResources.length; i++) {
      const color = this.colorResources[i].texture
      const depth = this.depthResources[i].texture
      const program = depth.sampleCount > 1 ? this.programMsaa : this.program
      this.setParams(ctx, program)
      program.mustSet('depthMap', depth)
      program.commit()

      pass.setRenderTarget(0, color)
      pass.setRenderBlend(0, FOG_BLEND)
      pass.setViewportState(0, 0, color.width, color.height)
      pass.setProgram(program)
      pass.draw(3)
      pass.submit()
    }
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  private updateParams(ctx: RenderContext) {
    const camera = ctx.view.camera
    const proj = camera.projection
    const width = ctx.viewWidth
    const height = ctx.viewHeight

    // right handed view space, looking down -z
    this.ndcToView[0] = 2 / proj[0]
    this.ndcToView[1] = -2 / proj[5]
    this.ndcToView[2] = (proj[8] - 1) / proj[0]
    this.ndcToView[3] = (proj[9] + 1) / proj[5]

    this.viewport[0] = width
    this.viewport[1] = height
    this.viewport[2] = 1 / width
    this.viewport[3] = 1 / height

    this.depthRange[0] = camera.far * 0.99
  }

  private setParams(ctx: RenderContext, program: Program) {
    const inputs = ctx.renderInputs
    program.set('params.cameraWorld', ctx.view.camera.world)
    program.set('params.ndcToView', this.ndcToView)
    program.set('params.viewport', this.viewport)
    program.set('params.depthRange', this.depthRange)
    // unset until the time of day system provides fog parameters, zero values result in no fog
    setIfPresent(program, 'params.volumetricFogParams', inputs.get(InputSlots.Global.VolumetricFogParams))
    setIfPresent(program, 'params.volumetricFogRampParams', inputs.get(InputSlots.Global.VolumetricFogRampParams))
    setIfPresent(
      program,
      'params.volumetricFogColorGradientBase',
      inputs.get(InputSlots.Global.VolumetricFogColorGradientBase),
    )
  }
}

function setIfPresent(program: Program, path: string, value: InputValueType | null) {
  if (value != null) {
    program.set(path, value)
  }
}
