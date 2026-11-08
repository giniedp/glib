import { DownsampleEffect, DownsampleOperator, UpsampleEffect, UpsampleOperator } from '@gglib/effects'
import {
  BlendState,
  Color,
  Device,
  type Ownable,
  ResourceOwnership,
  Texture,
  TextureDescriptor,
  TextureUsage,
} from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderContext, RenderPass } from '../Types'

export interface BloomPassOptions {
  order?: number
  enabled?: boolean
  threshold?: number
  knee?: number
  intensity?: number
  steps?: number
  mode?: BloomPassMode
}

export type BloomPassMode = 'kawase' | 'jimnez'

export function bloomPass(device: Device, options: BloomPassOptions = {}): BloomPass {
  return new BloomPass(device, options)
}

/**
 * Adds the glow onto the color like {@link BlendState.Additive} (the upsample output is scaled by its alpha), and
 * keeps the alpha of the color
 */
const BLOOM_COMPOSITE = BlendState.get({
  enable: true,
  colorBlendFunction: 'add',
  alphaBlendFunction: 'add',
  colorSrcBlend: 'src-alpha',
  colorDstBlend: 'one',
  alphaSrcBlend: 'zero',
  alphaDstBlend: 'one',
})

export class BloomPass implements RenderPass, Ownable {
  /**
   * The ownership state of this pass
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  /**
   * Pass name and debug label
   */
  public readonly name: string = 'Bloom'

  /**
   *
   */
  public enabled = true

  /**
   * Glow cut threshold
   */
  public threshold = 0.75

  /**
   * Glow cut knee
   */
  public knee = 0.5

  /**
   * Number of down and upsample steps. Affects blur strength
   */
  public steps = 6

  /**
   *
   */
  public intensity = 0.5

  public mode: BloomPassMode = 'kawase'

  private device: Device
  private fxDownsample: DownsampleEffect
  private fxUpsample: UpsampleEffect

  private get isReady() {
    return !!this.fxDownsample?.isCompiled && !!this.fxUpsample?.isCompiled
  }

  private get isKawase() {
    return this.mode === 'kawase'
  }

  private active = false
  private target: FrameResource

  private texDownUp: Texture[] = []
  private texDownUpDesc: TextureDescriptor[] = []

  public constructor(device: Device, options: BloomPassOptions = {}) {
    this.device = device
    this.device.ready.then(() => {
      this.createEffects()
    })

    this.enabled = options.enabled ?? this.enabled
    this.threshold = options.threshold ?? this.threshold
    this.knee = options.knee ?? this.knee
    this.intensity = options.intensity ?? this.intensity
    this.steps = options.steps ?? this.steps
    this.mode = options.mode ?? this.mode
  }

  private createEffects() {
    this.fxDownsample ||= this.ownership.adopt(new DownsampleEffect(this.device))
    this.fxUpsample ||= this.ownership.adopt(new UpsampleEffect(this.device))
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.createEffects()
    this.active = this.enabled && this.isReady
    if (!this.active) {
      this.target = null
      return
    }

    frame.addPass(this)
    // the glow is blended onto the color, so no full resolution target is needed
    this.target = frame.modifyInPlace(RenderChannel.Color)

    const steps = this.stepCount
    for (let i = 0; i < steps; i++) {
      this.texDownUpDesc[i] ||= {
        type: '2d',
        format: 'rgba16float',
        width: 1,
        height: 1,
        depth: 1,
        mipLevelCount: 1,
        sampleCount: 1,
        usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
      }
      this.texDownUpDesc[i].width = Math.ceil(ctx.viewWidth / Math.pow(2, i + 1))
      this.texDownUpDesc[i].height = Math.ceil(ctx.viewHeight / Math.pow(2, i + 1))
    }
  }

  private get stepCount() {
    return Math.max(1, Math.min(10, this.steps))
  }

  /**
   * Downsamples the color into a mip chain (the first step applies the threshold), upsamples it back while
   * accumulating the levels, and adds the half resolution level onto the color.
   *
   * @remarks
   * The chain targets are acquired and released within this pass, so later passes reuse them.
   */
  public render(ctx: RenderContext) {
    if (!this.active) {
      return
    }

    const color = this.target.texture
    const steps = this.stepCount
    for (let i = 0; i < steps; i++) {
      this.texDownUp[i] = ctx.resources.acquire(this.texDownUpDesc[i], `Bloom Step[${i}]`)
    }

    const pass = ctx.device.renderPass
    pass.setRenderBlend(0, BlendState.Opaque)

    const kawase = this.isKawase
    // downsample pass, the first step extracts the bright parts
    {
      const fx = this.fxDownsample
      for (let i = 0; i < steps; i++) {
        if (!kawase) {
          fx.operator = i === 0 ? DownsampleOperator.JIMENEZ_13TAP_KARIS : DownsampleOperator.JIMENEZ_13TAP
        } else {
          fx.operator = DownsampleOperator.KAWASE
        }
        fx.highPass = i === 0
        fx.threshold = this.threshold
        fx.knee = this.knee
        fx.textureIn = i === 0 ? color : this.texDownUp[i - 1]
        fx.textureOut = this.texDownUp[i]
        fx.render(pass)
      }
      fx.highPass = false
    }

    // upsample pass, each level is added onto the next larger one, the last onto the color
    {
      const fx = this.fxUpsample
      fx.operator = kawase ? UpsampleOperator.KAWASE : UpsampleOperator.TENT_3X3
      fx.weight = this.intensity
      pass.setRenderBlend(0, BlendState.Additive)
      for (let i = steps - 1; i >= 0; i--) {
        if (i === 0) {
          pass.setRenderBlend(0, BLOOM_COMPOSITE)
        }
        fx.textureIn = this.texDownUp[i]
        fx.textureOut = this.texDownUp[i - 1] || color
        fx.render(pass)
      }
      pass.setRenderBlend(0, BlendState.Opaque)
    }

    pass.flush()

    for (let i = 0; i < steps; i++) {
      ctx.resources.release(this.texDownUp[i])
      this.texDownUp[i] = null
    }
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  /**
   * Immediately finalizes this pass and its effects
   */
  public dispose() {
    this.ownership.finalize()
  }
}
