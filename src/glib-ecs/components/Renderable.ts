module Glib.Components {

  import ModelMesh = Glib.Graphics.ModelMesh
  import Material = Glib.Graphics.ShaderEffect

  export interface RenderableCollector {
    add(item: Render.ItemData)
  }

  export interface Renderable {
    collect(collector: RenderableCollector)
  }
}
