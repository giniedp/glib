import { BlendState, CullState, DepthState, ModelMesh, ShaderEffect, ShaderTechnique } from '@glib/graphics'
import { Binder } from './Binder'
import { Manager } from './Manager'
import { ItemData, Step } from './Types'

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

  public renderItem(item: ItemData, binder: Binder) {
    let mat: ShaderEffect = item.effect
    let mesh: ModelMesh = item.mesh
    let tech: ShaderTechnique = mat.technique
    for (let pass of tech.passes) {
      pass.commit(mat.parameters)
      binder
        .updateTransform(item.world)
        .bindTransform(pass.program)
        .bindView(pass.program)
        .bindTime(pass.program)
        .bindLights(pass.program)
      mesh.draw(pass.program)
    }
  }
}
