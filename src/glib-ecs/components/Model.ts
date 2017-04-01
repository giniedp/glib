module Glib.Components {
  export class Model implements Component {
    public node: Entity
    public name: string = 'Renderable'
    public service: boolean = true
    public enabled: boolean = true

    public model: Graphics.Model
    public transform: Transform
    public world: Glib.Mat4 = Glib.Mat4.identity()

    constructor(params?: any) {
      if (params) {
        Glib.utils.extend(this, params)
      }
    }
    public setup() {
      this.transform = this.node.s.Transform
    }
    public update() {
      if (this.transform) {
        this.world.initFrom(this.transform.worldMat)
      }
    }
    public collect(result: CullVisitor) {
      if (!this.model) {
        return
      }
      for (const mesh of this.model.meshes) {
        result.add({
          mesh: mesh,
          effect: this.model.materials[mesh.materialId],
          world: this.world,
          data: null
        })
      }
    }
  }
}
