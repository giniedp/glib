module Glib.Render {

  export class ForwardRendering implements Render.Step {

    setup(manager: Render.Manager) {

    }

    render(manager:Render.Manager) {
      var rt = manager.beginEffect();
      manager.device.setRenderTarget(rt);
      manager.device.clear(0xFFFFFFFF, 1, 1);
      manager.device.blendState = Graphics.BlendState.Default;
      manager.device.depthState = Graphics.DepthState.Default;
      manager.device.cullState = Graphics.CullState.CullCounterClockWise;
      if (manager.binder.renderables.length) {
        //debugger;
      }
      for (var item of manager.binder.renderables) {
        this.renderItem(item, manager.binder);
      }
      manager.device.setRenderTarget(null);
      manager.endEffect(rt);
    }

    cleanup(manager: Render.Manager) {

    }

    renderItem(item, binder: Render.Binder) {
      var mat:Graphics.Material = item.material;
      var mesh:Graphics.ModelMesh = item.mesh;
      var tech:Graphics.MaterialTechnique = mat.technique;

      for (var pass of tech.passes) {
        pass.commit();
        binder
          .setTransform(item.world)
          .bindTransform(pass.program)
          .bindView(pass.program)
          .bindTime(pass.program)
          .bindLights(pass.program);
        mesh.draw(pass.program);
      }
    }
  }
}
