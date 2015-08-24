module Glib.Render {

  export class ForwardRendering implements Step {

    setup(manager:Manager) {

    }

    render(manager:Manager) {
      var rt = manager.beginScreenEffect();

      manager.device.setRenderTarget(rt);

      for (var item of manager.binder.renderables) {
        this.renderItem(item, manager.binder);
      }

      manager.device.setRenderTarget(null);

      manager.endScreenEffect(rt);
    }

    cleanup(manager:Manager) {

    }

    renderItem(item, context:Binder) {
      var mat:Graphics.Material = item.material;
      var mesh:Graphics.ModelMesh = item.mesh;
      var tech:Graphics.MaterialTechnique = mat.technique;

      for (var pass of tech.passes) {
        pass.commit();
        context
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
