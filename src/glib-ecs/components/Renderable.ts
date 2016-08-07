module Glib.Components {

  import ModelMesh = Glib.Graphics.ModelMesh;
  import Material = Glib.Graphics.ShaderMaterial;

  export interface RenderableCollector {
    add(mesh: ModelMesh, material:Material, world:Glib.Mat4, params?:any);
  }

  export interface Renderable {
    collect(collector:RenderableCollector)
  }
}
