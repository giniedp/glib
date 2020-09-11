
import { DepthFormat, Device } from '@gglib/graphics'
import { RenderManager } from '../RenderManager'
import { RenderStep } from '../Types'
import { PostKawaseBloomOptions, PostKawaseBloomEffect } from '@gglib/fx-post'

/**
 * @public
 */
export class PostBloomKawase implements RenderStep {

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

  private targetOptions = {
    width: 2, height: 2, depthFormat: DepthFormat.None,
  }

  private effect: PostKawaseBloomEffect

  constructor(device: Device, options?: PostKawaseBloomOptions) {
    this.effect = new PostKawaseBloomEffect(device, options)
  }

  public render(manager: RenderManager) {
    if (!this.ready || !this.enabled) {
      return
    }

    let baseTarget = manager.beginStep()

    if (this.halfSize) {
      this.targetOptions.width = (baseTarget.width / 2) | 0
      this.targetOptions.height = (baseTarget.height / 2) | 0
    } else {
      this.targetOptions.width = baseTarget.width
      this.targetOptions.height = baseTarget.height
    }

    let resultTarget = manager.acquireTarget(baseTarget)
    let renderTarget1 = manager.acquireTarget(this.targetOptions)
    let renderTarget2 = manager.acquireTarget(this.targetOptions)

    this.effect.inputTexture = resultTarget
    this.effect.blurTexture1 = renderTarget1
    this.effect.blurTexture2 = renderTarget1
    this.effect.outputTexture = resultTarget
    this.effect.draw()

    manager.releaseTarget(renderTarget1)
    manager.releaseTarget(renderTarget2)
    manager.endStep(resultTarget)

    this.effect.inputTexture = null
    this.effect.blurTexture1 = null
    this.effect.blurTexture2 = null
    this.effect.outputTexture = null
  }
}
