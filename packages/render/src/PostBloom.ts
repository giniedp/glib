import { PostBloomEffect, PostBloomOptions } from '@gglib/effects'
import { Device, RenderTargetOptions } from '@gglib/graphics'
import { RenderContext } from './RenderContext'
import { RenderPass } from './Types'

/**
 * Implements simple bloom post processing
 *
 * @public
 */
export class PostStepBloom implements RenderPass {
  public get ready() {
    return this.effect.isReady
  }

  public enabled: boolean = true
  public readonly effect: PostBloomEffect

  public get glowCut() {
    return this.effect.glowCut
  }
  public set glowCut(value: number) {
    this.effect.glowCut = value
  }

  public get multiplier() {
    return this.effect.multiplier
  }
  public set multiplier(value: number) {
    this.effect.multiplier = value
  }

  public get gaussSigma() {
    return this.effect.gaussSigma
  }
  public set gaussSigma(value: number) {
    this.effect.gaussSigma = value
  }

  public get iterations() {
    return this.effect.iterations
  }
  public set iterations(value: number) {
    this.effect.iterations = value
  }

  private rtQuery: RenderTargetOptions = {}
  public constructor(device: Device, options: PostBloomOptions & { enabled?: boolean } = {}) {
    this.effect = new PostBloomEffect(device, options)
    this.enabled = options?.enabled ?? this.enabled
  }

  public render(ctx: RenderContext) {
    if (!this.ready || !this.enabled) {
      return
    }

    this.rtQuery.width = ctx.width
    this.rtQuery.height = ctx.height
    this.rtQuery.depthFormat = ctx.targetOptions.depthFormat
    this.rtQuery.surfaceFormat = ctx.targetOptions.surfaceFormat
    this.rtQuery.pixelType = ctx.targetOptions.pixelType

    const base = ctx.channels.color
    if (!base) {
      console.warn('No color channel available, skipping bloom')
      return
    }
    const rt1 = ctx.targets.require(this.rtQuery)
    const rt2 = ctx.targets.require(this.rtQuery)

    this.effect.input = base
    this.effect.intermediate1 = rt1
    this.effect.intermediate2 = rt2
    this.effect.output = rt2
    this.effect.draw()
    this.effect.input = null
    this.effect.intermediate1 = null
    this.effect.intermediate2 = null
    this.effect.output = null

    ctx.targets.release(rt1)
    ctx.swapChannel('color', rt2)
  }
}
