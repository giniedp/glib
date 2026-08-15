import { TonemapEffect, TonemapOperator } from '@gglib/effects'
import { Device } from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderContext, RenderPass } from '../types'

export interface TonemapPassOptions {
  order?: number
  enabled?: boolean
  exposure?: number
  whitePoint?: number
  autoExposure?: boolean
  operator?: TonemapOperator
  srgb?: boolean
}

export class TonemapPass implements RenderPass {
  public order = 100
  public name: string = 'Tonemap Pass'

  public enabled: boolean = true
  public exposure: number = 1.0
  public whitePoint: number = 1.0
  public operator: TonemapOperator = TonemapOperator.PBR_NEUTRAL
  public srgb: boolean = false

  private active = false
  private device: Device
  private effect: TonemapEffect
  private source: FrameResource
  private target: FrameResource

  public constructor(device: Device, options?: TonemapPassOptions) {
    this.device = device
    if (device.isReady) {
      this.effect = new TonemapEffect(device)
    }

    this.order = options.order ?? this.order
    this.enabled = options.enabled ?? this.enabled
    this.exposure = options?.exposure ?? this.exposure
    this.whitePoint = options?.whitePoint ?? this.whitePoint
    this.operator = options?.operator ?? this.operator
    this.srgb = options?.srgb ?? this.srgb
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.effect ||= new TonemapEffect(this.device)
    this.active = this.enabled && this.effect.isCompiled
    if (!this.active) {
      this.source = null
      this.target = null
      return
    }
    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    this.target = frame.write(RenderChannel.Color)
  }

  public render(ctx: RenderContext) {
    if (!this.active) {
      return
    }

    const fx = this.effect
    fx.textureIn = this.source.texture
    fx.textureOut = this.target.texture
    fx.operator = this.operator
    fx.whitePoint = this.whitePoint
    fx.exposure = this.exposure
    fx.srgb = this.srgb

    const pass = ctx.device.renderPass
    pass.render(fx)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
