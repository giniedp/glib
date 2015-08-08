module Glib.Components {

  import Mat4 = Vlib.Mat4;

  export interface CameraProperties {
    near?:number;
    far?:number;
    fov?:number;
    aspect?:number;
  }

  export class Camera implements Component {
    node:Entity;
    name:string = 'Camera';
    service:boolean = true;
    enabled:boolean = true;

    near:number = 1;
    far:number = 1000;
    fov:number = Math.PI * 0.25;
    aspect:number = 4 / 3;

    viewMat:Mat4 = Mat4.identity();
    projMat:Mat4 = Mat4.identity();
    viewProjMat:Mat4 = Mat4.identity();
    transform:Transform;

    constructor(params?:CameraProperties) {
      if (params) {
        Glib.utils.extend(this, params);
      }
    }

    setup(){
      this.transform = this.node.getService('Transform');
    }

    update(){
      if (!this.viewMat.equals(this.transform.inverseMat)){
        this.viewMat.initFrom(this.transform.inverseMat);
        this.projMat.initPerspectiveFieldOfView(this.fov, this.aspect, this.near, this.far);
        Mat4.multiply(this.viewMat, this.projMat, this.viewProjMat);
      }
    }

    activate() {
      var renderer = this.node.root.getService("Renderer");
      var screen = renderer.screens[0];
      screen.camera = this;
      if (screen.width && screen.height) {
        this.aspect = screen.width / screen.height;
      } else {
        var canvas = renderer.device.canvas;
        this.aspect = canvas.width / canvas.height;
      }
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`,
        `  near: ${this.near.toPrecision(5)}, far: ${this.far.toPrecision(5)}, fov: ${this.fov.toPrecision(5)}, aspect: ${this.aspect.toPrecision(5)}`
      ].join("\n")
    }
  }
}
