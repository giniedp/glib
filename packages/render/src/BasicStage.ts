import { BlendState, CullState, DepthState, ShaderTechnique, StencilState } from '@gglib/graphics'
import { Binder } from './Binder'
import { Manager } from './Manager'
import { DrawableData, Stage } from './Types'

/**
 * Constructor options for {@link BasicStage}
 *
 * @public
 */
export interface BasicStageOptions {
  clearColor?: number
}

/**
 * @public
 */
export class BasicStage implements Stage {
  public get ready() {
    return true
  }

  public clearColor: number = 0xFF000000

  public constructor(options: BasicStageOptions = {}) {
    if (options.clearColor != null) {
      this.clearColor = options.clearColor
    }
  }

  public render(manager: Manager) {
    const binder = manager.binder
    const scene = manager.scene
    const cam = scene.camera
    if (!scene.items.length || !cam) {
      return
    }

    binder.setCamera(cam.world, cam.view, cam.projection)
    binder.updateLights(scene.lights)

    const rt = manager.beginStep()
    if (rt) {
      manager.device.setRenderTarget(rt)
    }

    manager.device.cullState = CullState.CullClockWise
    manager.device.depthState = DepthState.Default
    manager.device.blendState = BlendState.Default
    manager.device.stencilState = StencilState.Default
    manager.device.clear(this.clearColor, 1)

    for (const item of manager.scene.items) {
      this.renderItem(item, manager.binder)
    }

    manager.device.setRenderTarget(null)
    manager.endStep(rt)
  }

  public renderItem(item: DrawableData, binder: Binder) {
    const effect = item.material.effect
    const drawable = item.drawable
    const technique: ShaderTechnique = effect.technique
    for (const pass of technique.passes) {
      pass.commit(item.material.parameters)
      binder
        .setTransform(item.world)
        .applyTransform(pass.program)
        .applyView(pass.program)
        .applyTime(pass.program)
        .applyLights(pass.program)
      drawable.draw(pass.program)
    }
  }
}
