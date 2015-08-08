module Glib.Components {
  export class Model implements Component {
    node:Entity;
    name:string = 'Renderable';
    service:boolean = true;
    enabled:boolean = true;

    model: Graphics.Model;
    transform:Transform;
    world:Vlib.Mat4 = Vlib.Mat4.identity();

    constructor(params?:any) {
      if (params) {
        Glib.utils.extend(this, params);
      }
    }
    setup(){
      this.transform = this.node.s["Transform"]
    }
    update(){
      if (this.transform) {
        this.world.initFrom(this.transform.worldMat);
      }
    }
    collect(result:CullVisitor){
      if (!this.model) return;
      for (var mesh of this.model.meshes) {
        result.add(mesh, this.model.materials[mesh.materialId], this.world);
      }
    }
  }
}
