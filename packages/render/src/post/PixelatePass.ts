import { PixelateShader } from '@gglib/effects'
import { Device, type Ownable, ResourceOwnership } from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderContext, RenderPass } from '../Types'

export interface PixelatePassOptions {
  order?: number
  enabled?: boolean
  size?: number
  corner?: number
  dither?: number
  aspect?: number
  gap?: number
}
export class PixelatePass implements RenderPass, Ownable {
  /**
   * The ownership state of this pass
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  public name: string = 'Pixelate Pass'

  public enabled = false
  public size = 10
  public corner = 0
  public dither = 0
  public aspect = 1
  public gap = 0

  private device: Device
  private pixelate: PixelateShader
  private source: FrameResource
  private target: FrameResource
  private active = false

  public constructor(device: Device, options: PixelatePassOptions = {}) {
    this.device = device
    if (device.isReady) {
      this.pixelate = this.ownership.adopt(new PixelateShader(device))
    }

    this.enabled = options.enabled ?? this.enabled
    this.size = options.size ?? this.size
    this.corner = options.corner ?? this.corner
    this.dither = options.dither ?? this.dither
    this.aspect = options.aspect ?? this.aspect
    this.gap = options.gap ?? this.gap
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.pixelate ||= this.ownership.adopt(new PixelateShader(this.device))
    this.active = this.enabled && this.pixelate.isReady

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
    const effect = this.pixelate
    effect.size = this.size
    effect.corner = this.corner
    effect.dither = this.dither
    effect.aspect = this.aspect
    effect.gap = this.gap
    effect.texture = this.source.texture

    const pass = ctx.device.renderPass
    pass.setRenderTarget(0, this.target.texture)
    pass.render(effect)
    pass.flush()
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
