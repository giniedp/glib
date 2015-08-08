module Glib.Components {

  import ModelMesh = Glib.Graphics.ModelMesh;
  import Material = Glib.Graphics.Material;

  export interface RenderableCollector {
    add(mesh: ModelMesh, material:Material, world:Vlib.Mat4, params?:any);
  }

  export interface Renderable {
    collect(collector:RenderableCollector)
  }
}