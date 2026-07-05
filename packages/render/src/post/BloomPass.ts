import { BloomShader } from '@gglib/effects'
import { Device, Texture, TextureDescriptor, TextureUsage } from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderContext, RenderPass } from '../types'

export interface BloomPassOptions {
  enabled?: boolean
  gaussSigma?: number
  glowCut?: number
  multiplier?: number
  iterations?: number
  resolutionScale?: number
}

export class BloomPass implements RenderPass {
  public name: string = 'Bloom Pass'

  public enabled = true
  public gaussSigma = 5
  public glowCut = 0.75
  public multiplier = 0.75
  public iterations = 5
  public resolutionScale = 0.25

  private device: Device
  private effect: BloomShader
  private source: FrameResource
  private target: FrameResource
  private temp1: Texture
  private temp1Desc: TextureDescriptor
  private temp2: Texture
  private temp2Desc: TextureDescriptor
  private active = false

  public constructor(device: Device, options: BloomPassOptions = {}) {
    this.device = device
    if (device.isReady) {
      this.effect = new BloomShader(device)
    }

    this.enabled = options.enabled ?? this.enabled
    this.gaussSigma = options.gaussSigma ?? this.gaussSigma
    this.glowCut = options.glowCut ?? this.glowCut
    this.multiplier = options.multiplier ?? this.multiplier
    this.iterations = options.iterations ?? this.iterations
    this.resolutionScale = options.resolutionScale ?? this.resolutionScale
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.effect ||= new BloomShader(this.device)
    this.active = this.enabled && this.effect.isReady
    if (!this.active) {
      this.source = null
      this.target = null
      return
    }

    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    this.target = frame.write(RenderChannel.Color)
    this.temp1Desc ||= {
      type: 'Texture2D',
      width: ctx.viewWidth,
      height: ctx.viewHeight,
      format: ctx.device.output.format,
      depth: 1,
      mipLevelCount: 1,
      sampleCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.Sampled,
    }
    this.temp2Desc ||= {
      ...this.temp1Desc,
    }

    this.temp1Desc.width = Math.round(ctx.viewWidth * this.resolutionScale)
    this.temp1Desc.height = Math.round(ctx.viewHeight * this.resolutionScale)
    this.temp2Desc.width = this.temp1Desc.width
    this.temp2Desc.height = this.temp1Desc.height

    this.temp1 = ctx.resources.acquire(this.temp1Desc, 'Bloom Temp 1')
    this.temp2 = ctx.resources.acquire(this.temp2Desc, 'Bloom Temp 2')
  }

  public render(ctx: RenderContext) {
    if (!this.active) {
      return
    }
    const effect = this.effect
    effect.textureInput = this.source.texture
    effect.textureTemp1 = this.temp1
    effect.textureTemp2 = this.temp2
    effect.textureOuput = this.target.texture
    effect.gaussSigma = this.gaussSigma
    effect.glowCut = this.glowCut
    effect.multiplier = this.multiplier
    effect.iterations = this.iterations

    const pass = ctx.device.renderPass
    pass.render(effect)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    if (this.temp1) {
      ctx.resources.release(this.temp1)
      this.temp1 = null
    }
    if (this.temp2) {
      ctx.resources.release(this.temp2)
      this.temp2 = null
    }
  }
}
