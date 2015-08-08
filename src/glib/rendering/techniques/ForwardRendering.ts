module Glib.Rendering {

  export class ForwardRendering implements Step {

    setup(context:Context) {

    }

    render(context:Context) {
      for (var item of context.renderables) {
        this.renderItem(item, context);
      }
    }

    cleanup(context:Context) {

    }

    renderItem(item, context:Context) {
      var mat:Graphics.Material = item.material;
      var mesh:Graphics.ModelMesh = item.mesh;
      var tech:Graphics.MaterialTechnique = mat.technique;

      for (var pass of tech.passes) {
        pass.commit();
        context.setTransform(item.world);
        context.applyTransform(pass.program);
        context.applyView(pass.program);
        context.applyTime(pass.program);
        context.applyLights(pass.program);
        mesh.draw(pass.program);
      }
    }
  }
}