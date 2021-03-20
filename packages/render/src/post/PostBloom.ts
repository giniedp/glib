import { PostBloomOptions, PostBloomEffect } from '@gglib/fx-post'
import { Device } from '@gglib/graphics'

import { RenderManager } from '../RenderManager'
import { RenderStep } from '../Types'

/**
 * Implements simple bloom post processing
 *
 * @public
 */
export class PostStepBloom implements RenderStep {
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

  constructor(device: Device, options: PostBloomOptions & { enabled?: boolean } = {}) {
    this.effect = new PostBloomEffect(device, options)
    this.enabled = options?.enabled ?? this.enabled
  }

  public render(manager: RenderManager) {
    if (!this.ready || !this.enabled) {
      return
    }

    const baseTarget = manager.beginStep()
    const rt1 = manager.acquireTarget(baseTarget)
    const rt2 = manager.acquireTarget(baseTarget)

    this.effect.input = baseTarget
    this.effect.intermediate1 = rt1
    this.effect.intermediate2 = rt2
    this.effect.output = rt2
    this.effect.draw()
    manager.releaseTarget(rt1)
    manager.endStep(rt2)

    this.effect.input = null
    this.effect.intermediate1 = null
    this.effect.intermediate2 = null
    this.effect.output = null
  }
}
