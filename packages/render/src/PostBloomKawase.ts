import { PostKawaseBloomEffect, PostKawaseBloomOptions } from '@gglib/effects'
import { Device, TextureOptions } from '@gglib/graphics'
import { RenderContext } from './RenderContext'
import { RenderPass } from './Types'

/**
 * @public
 */
export class PostBloomKawase implements RenderPass {
  public get ready() {
    return this.effect.isReady
  }

  public enabled = true

  public get glowCut() {
    return this.effect.glowCut
  }
  public set glowCut(value: number) {
    this.effect.glowCut = value
  }
  public get iterations() {
    return this.effect.iterations
  }
  public set iterations(value: number) {
    this.effect.iterations = value
  }
  public halfSize: boolean = true

  private targetOptions: TextureOptions = {
    width: 2,
    height: 2,
    depthFormat: 'None',
  }

  private effect: PostKawaseBloomEffect

  public constructor(device: Device, options?: PostKawaseBloomOptions & { enabled?: boolean }) {
    this.effect = new PostKawaseBloomEffect(device, options)
    this.enabled = options?.enabled ?? this.enabled
  }

  public render(ctx: RenderContext) {
    if (!this.ready || !this.enabled) {
      return
    }

    const baseTarget = ctx.channels.color
    if (!baseTarget) {
      console.warn('PostBloomKawase: no color target')
      return
    }

    if (this.halfSize) {
      this.targetOptions.width = (baseTarget.width / 2) | 0
      this.targetOptions.height = (baseTarget.height / 2) | 0
    } else {
      this.targetOptions.width = baseTarget.width
      this.targetOptions.height = baseTarget.height
    }

    const resultTarget = ctx.targets.require(baseTarget)
    const renderTarget1 = ctx.targets.require(this.targetOptions)
    const renderTarget2 = ctx.targets.require(this.targetOptions)

    try {
      this.effect.inputTexture = resultTarget
      this.effect.blurTexture1 = renderTarget1
      this.effect.blurTexture2 = renderTarget1
      this.effect.outputTexture = resultTarget
      this.effect.draw()
    } finally {
      ctx.targets.release(renderTarget1)
      ctx.targets.release(renderTarget2)
    }

    this.effect.inputTexture = null
    this.effect.blurTexture1 = null
    this.effect.blurTexture2 = null
    this.effect.outputTexture = null
  }
}
