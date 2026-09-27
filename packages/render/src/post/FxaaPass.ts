import { FxaaEffect } from '@gglib/effects'
import { Device } from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderContext, RenderPass } from '../types'

export interface FxaaOptions {
  order?: number
  enabled?: boolean
  thresholdMin?: number
  thresholdMax?: number
  quality?: number
}
export class FxaaPass implements RenderPass {
  public order = 100
  public name: string = 'Fxaa Pass'

  public enabled = false
  public thresholdMin = 0.0312
  public thresholdMax = 0.125
  public quality = 0.75

  private device: Device
  private effect: FxaaEffect
  private source: FrameResource
  private target: FrameResource
  private active = false

  public constructor(device: Device, options: FxaaOptions = {}) {
    this.device = device
    if (device.isReady) {
      this.effect = new FxaaEffect(device)
    }

    this.order = options.order ?? this.order
    this.enabled = options.enabled ?? this.enabled
    this.thresholdMin = options.thresholdMin ?? this.thresholdMin
    this.thresholdMax = options.thresholdMax ?? this.thresholdMax
    this.quality = options.quality ?? this.quality
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.effect ||= new FxaaEffect(this.device)
    this.active = this.enabled && this.effect.isCompiled

    if (this.active) {
      frame.addPass(this)
      this.source = frame.read(RenderChannel.Color)
      this.target = frame.write(RenderChannel.Color)
    } else {
      this.source = null
      this.target = null
    }
  }

  public render(ctx: RenderContext) {
    if (!this.active) {
      return
    }
    const pass = ctx.device.renderPass
    const effect = this.effect
    effect.thresholdMin = this.thresholdMin
    effect.thresholdMax = this.thresholdMax
    effect.quality = this.quality
    effect.textureIn = this.source.texture
    effect.textureOut = this.target.texture
    effect.render(pass)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
