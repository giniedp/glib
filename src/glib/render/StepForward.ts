module Glib.Render {

  export class StepForward implements Render.Step {

    render(manager:Render.Manager) {
      var binder = manager.binder
      var view = manager.view
      if (!view.items.length) return
      var cam = view.camera
      if (!cam) return
      binder.updateCamera(cam.world, cam.view, cam.projection)
      binder.updateLights(view.lights)

      var rt = manager.beginStep()
      if (rt) manager.device.setRenderTarget(rt)

      manager.device.clear(0xFFFFFFFF, 1, 1)
      manager.device.blendState = Graphics.BlendState.Default
      manager.device.depthState = Graphics.DepthState.Default
      manager.device.cullState = Graphics.CullState.CullCounterClockWise
      for (var item of manager.view.items) {
        this.renderItem(item, manager.binder)
      }
      
      manager.device.setRenderTarget(null)
      manager.endStep(rt)
    }

    renderItem(item: Render.ItemData, binder: Render.Binder) {
      var mat:Graphics.ShaderEffect = item.effect
      var mesh:Graphics.ModelMesh = item.mesh
      var tech:Graphics.ShaderTechnique = mat.technique
      for (var pass of tech.passes) {
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
