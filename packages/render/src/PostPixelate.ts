import { PostPixelateEffect, PostPixelateOptions } from '@gglib/effects'
import { Device } from '@gglib/graphics'
import { RenderContext } from './RenderContext'
import { RenderPass } from './Types'

/**
 * @public
 */
export class PostPixelateStep implements RenderPass {
  public get ready() {
    return this.effect.isReady
  }

  public enabled = true
  public get pixelWidth(): number {
    return this.effect.pixelWidth
  }
  public set pixelWidth(value: number) {
    this.effect.pixelWidth = value
  }
  public get pixelHeight(): number {
    return this.effect.pixelHeight
  }
  public set pixelHeight(value: number) {
    this.effect.pixelHeight = value
  }

  private effect: PostPixelateEffect

  constructor(device: Device, options?: PostPixelateOptions & { enabled?: boolean }) {
    this.effect = new PostPixelateEffect(device, options)
    this.enabled = options?.enabled ?? this.enabled
  }

  public render(ctx: RenderContext) {
    if (!this.ready || !this.enabled) {
      return
    }

    const rt = ctx.channels.color
    if (!rt) {
      console.warn('PostPixelateStep: no color target')
      return
    }
    const rt2 = ctx.targets.require(rt)

    this.effect.inputTexture = rt
    this.effect.outputTexture = rt2
    this.effect.draw()
    this.effect.inputTexture = null
    this.effect.outputTexture = null

    ctx.swapChannel('color', rt2)
  }
}
