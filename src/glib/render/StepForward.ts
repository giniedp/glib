module Glib.Render {

  export class StepForward implements Render.Step {

    render(manager:Render.Manager) {
      let binder = manager.binder
      let view = manager.view
      if (!view.items.length) return
      let cam = view.camera
      if (!cam) return
      binder.updateCamera(cam.world, cam.view, cam.projection)
      binder.updateLights(view.lights)

      let rt = manager.beginStep()
      if (rt) manager.device.setRenderTarget(rt)

      manager.device.clear(0xFFFFFFFF, 1, 1)
      manager.device.blendState = Graphics.BlendState.Default
      manager.device.depthState = Graphics.DepthState.Default
      manager.device.cullState = Graphics.CullState.CullCounterClockWise
      for (let item of manager.view.items) {
        this.renderItem(item, manager.binder)
      }
      
      manager.device.setRenderTarget(null)
      manager.endStep(rt)
    }

    renderItem(item: Render.ItemData, binder: Render.Binder) {
      let mat:Graphics.ShaderEffect = item.effect
      let mesh:Graphics.ModelMesh = item.mesh
      let tech:Graphics.ShaderTechnique = mat.technique
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
}
