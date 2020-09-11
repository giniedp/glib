import { Device } from '@gglib/graphics'
import { RenderManager } from '../RenderManager'
import { RenderStep } from '../Types'
import { PostPixelateOptions, PostPixelateEffect } from '@gglib/fx-post'

/**
 * @public
 */
export class PostPixelateStep implements RenderStep {
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

  constructor(device: Device, options: PostPixelateOptions) {
    this.effect = new PostPixelateEffect(device, options)
  }

  public render(manager: RenderManager) {
    if (!this.ready || !this.enabled) {
      return
    }

    const rt = manager.beginStep()
    const rt2 = manager.acquireTarget(rt)

    this.effect.inputTexture = rt
    this.effect.outputTexture = rt2
    this.effect.draw()
    this.effect.inputTexture = null
    this.effect.outputTexture = null

    manager.endStep(rt2)
  }
}
