import { BlendState, CullState, DepthState, ShaderTechnique, StencilState } from '@gglib/graphics'
import { RenderManager } from './RenderManager'
import { DrawableData, RenderStep } from './Types'
import { UniformBinder } from './UniformBinder'

/**
 * Constructor options for {@link BasicRenderStep}
 *
 * @public
 */
export interface BasicRenderStepOptions {
  clearColor?: number
}

/**
 * A basic implementation of a forward renderer
 *
 * @public
 */
export class BasicRenderStep implements RenderStep {
  public get ready() {
    return true
  }

  public clearColor: number = 0xFF000000

  public constructor(options: BasicRenderStepOptions = {}) {
    if (options.clearColor != null) {
      this.clearColor = options.clearColor
    }
  }

  public render(manager: RenderManager) {
    const binder = manager.binder
    const scene = manager.scene
    const cam = scene.camera
    if (!scene.items.length || !cam) {
      return
    }

    binder.updateCamera(cam.world, cam.view, cam.projection)
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

  public renderItem(item: DrawableData, binder: UniformBinder) {
    const effect = item.material.effect
    const drawable = item.drawable
    const technique: ShaderTechnique = effect.technique
    for (const pass of technique.passes) {
      pass.commit(item.material.parameters)
      binder
        .updateTransform(item.transform)
        .applyTransform(pass.program)
        .applyView(pass.program)
        .applyTime(pass.program)
        .applyLights(pass.program)
      drawable.draw(pass.program)
    }
  }
}
