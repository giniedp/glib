import { BlendState, CullState, DepthState, ShaderTechnique } from '@gglib/graphics'
import { Binder } from './Binder'
import { Manager } from './Manager'
import { DrawableData, Step } from './Types'

/**
 * @public
 */
export class StepForward implements Step {

  public render(manager: Manager) {
    let binder = manager.binder
    let view = manager.view
    if (!view.items.length) {
      return
    }
    let cam = view.camera
    if (!cam) {
      return
    }
    binder.updateCamera(cam.world, cam.view, cam.projection)
    binder.updateLights(view.lights)

    let rt = manager.beginStep()
    if (rt) {
      manager.device.setRenderTarget(rt)
    }

    manager.device.clear(0xFFFFFFFF, 1, 1)
    manager.device.blendState = BlendState.Default
    manager.device.depthState = DepthState.Default
    manager.device.cullState = CullState.CullCounterClockWise
    for (let item of manager.view.items) {
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
      pass.commit(effect.parameters)
      binder
        .updateTransform(item.world)
        .bindTransform(pass.program)
        .bindView(pass.program)
        .bindTime(pass.program)
        .bindLights(pass.program)
      drawable.draw(pass.program)
    }
  }
}
