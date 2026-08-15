import {
  CombineEffect,
  CombineOperator,
  DownsampleEffect,
  DownsampleOperator,
  ExtractEffect,
  ExtractOperator,
  UpsampleEffect,
  UpsampleOperator,
} from '@gglib/effects'
import { BlendState, Color, Device, Texture, TextureDescriptor, TextureUsage } from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderContext, RenderPass } from '../types'

export interface BloomPassOptions {
  order?: number
  enabled?: boolean
  threshold?: number
  knee?: number
  intensity?: number
  steps?: number
}

export class BloomPass implements RenderPass {
  /**
   * Pass name and debug label
   */
  public readonly name: string = 'Bloom'

  /**
   *
   */
  public order = 100

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

  private device: Device
  private fxExtract: ExtractEffect
  private fxDownsample: DownsampleEffect
  private fxUpsample: UpsampleEffect
  private fxCombine: CombineEffect

  private get isReady() {
    return (
      !!this.fxExtract?.isCompiled &&
      !!this.fxDownsample?.isCompiled &&
      !!this.fxUpsample?.isCompiled &&
      !!this.fxCombine?.isCompiled
    )
  }

  private active = false
  private source: FrameResource
  private target: FrameResource

  private texExtract: Texture
  private texExtractDesc: TextureDescriptor
  private texBlur: Texture
  private texBlurDesc: TextureDescriptor
  private texDownUp: Texture[] = []
  private texDownUpDesc: TextureDescriptor[] = []

  public constructor(device: Device, options: BloomPassOptions = {}) {
    this.device = device
    this.device.ready.then(() => {
      this.createEffects()
    })

    this.order = options.order ?? this.order
    this.enabled = options.enabled ?? this.enabled
    this.threshold = options.threshold ?? this.threshold
    this.intensity = options.intensity ?? this.intensity
    this.steps = options.steps ?? this.steps
  }

  private createEffects() {
    this.fxExtract ||= new ExtractEffect(this.device)
    this.fxDownsample ||= new DownsampleEffect(this.device)
    this.fxUpsample ||= new UpsampleEffect(this.device)
    this.fxCombine ||= new CombineEffect(this.device)
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.createEffects()
    this.active = this.enabled && this.isReady
    if (!this.active) {
      this.source = null
      this.target = null
      return
    }

    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    this.target = frame.write(RenderChannel.Color)

    this.texExtractDesc ||= {
      type: 'Texture2D',
      format: 'RGBA16_FLOAT',
      width: ctx.viewWidth,
      height: ctx.viewHeight,
      depth: 1,
      mipLevelCount: 1,
      sampleCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    }
    this.texExtractDesc.width = ctx.viewWidth
    this.texExtractDesc.height = ctx.viewHeight
    this.texExtract ||= ctx.resources.acquire(this.texExtractDesc, 'Bloom Extract')

    this.texBlurDesc ||= { ...this.texExtractDesc }
    this.texBlurDesc.width = ctx.viewWidth
    this.texBlurDesc.height = ctx.viewHeight
    this.texBlur ||= ctx.resources.acquire(this.texBlurDesc, `Bloom Blur`)

    const steps = Math.max(1, Math.min(10, this.steps))
    for (let i = 0; i < steps; i++) {
      this.texDownUpDesc[i] ||= { ...this.texExtractDesc }
      this.texDownUpDesc[i].width = Math.ceil(ctx.viewWidth / Math.pow(2, i + 1))
      this.texDownUpDesc[i].height = Math.ceil(ctx.viewHeight / Math.pow(2, i + 1))
      this.texDownUp[i] ||= ctx.resources.acquire(this.texDownUpDesc[i], `Bloom Step[${i}]`)
    }
  }

  public render(ctx: RenderContext) {
    if (!this.active) {
      return
    }

    const pass = ctx.device.renderPass
    pass.setClearColor(0, Color.TransparentBlack)
    pass.setRenderTarget(0, this.texExtract)
    pass.clear()
    pass.setRenderTarget(0, this.texBlur)
    pass.clear()
    pass.setRenderBlend(0, BlendState.Opaque)

    // extract pass
    {
      const fx = this.fxExtract
      fx.operatorId = ExtractOperator.HIGH_PASS
      fx.threshold = this.threshold
      fx.knee = this.knee
      fx.textureIn = this.source.texture
      fx.textureOut = this.texExtract
      fx.render(pass)
    }

    const steps = Math.max(1, Math.min(10, this.steps))
    // downsample pass
    {
      const fx = this.fxDownsample
      fx.operator = DownsampleOperator.KAWASE
      for (let i = 0; i < steps; i++) {
        fx.textureIn = i === 0 ? this.texExtract : this.texDownUp[i - 1]
        fx.textureOut = this.texDownUp[i]
        fx.render(pass)
      }
    }

    // upsample pass
    {
      const fx = this.fxUpsample
      fx.operator = UpsampleOperator.KAWASE
      fx.weight = this.intensity
      pass.setRenderBlend(0, BlendState.Additive)
      for (let i = steps - 1; i >= 0; i--) {
        fx.textureIn = this.texDownUp[i]
        fx.textureOut = this.texDownUp[i - 1] || this.texBlur
        fx.render(pass)
      }
      pass.setRenderBlend(0, BlendState.Opaque)
    }

    // combine pass
    {
      const fx = this.fxCombine
      fx.operator = CombineOperator.ADD
      fx.weight1 = 1
      fx.weight2 = 1
      fx.blend = 1
      fx.textureIn1 = this.source.texture
      fx.textureIn2 = this.texBlur
      fx.textureOut = this.target.texture
      fx.render(pass)
    }

    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    if (this.texExtract) {
      ctx.resources.release(this.texExtract)
      this.texExtract = null
    }
    if (this.texBlur) {
      ctx.resources.release(this.texBlur)
      this.texBlur = null
    }
    for (let i = 0; i < this.texDownUp.length; i++) {
      if (this.texDownUp[i]) {
        ctx.resources.release(this.texDownUp[i])
        this.texDownUp[i] = null
      }
    }
  }
}
