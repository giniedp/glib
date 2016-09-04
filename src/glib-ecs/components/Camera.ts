module Glib.Components {

  import Mat4 = Glib.Mat4;

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

    near:number = 0.1;
    far:number = 1000;
    fov:number = Math.PI * 0.25;
    aspect:number = 4 / 3;

    view:Mat4 = Mat4.identity();
    projection:Mat4 = Mat4.identity();
    viewProjection:Mat4 = Mat4.identity();
    transform:Transform;
    private targetView: Render.View;

    constructor(params?:CameraProperties) {
      if (params) {
        Glib.utils.extend(this, params);
      }
    }

    setup(){
      this.transform = this.node.getService('Transform');
    }

    update() {
      if (this.targetView) {
        this.aspect = this.targetView.width / this.targetView.height;
      }
      this.view.initFrom(this.transform.inverseMat);
      this.projection.initPerspectiveFieldOfView(this.fov, this.aspect, this.near, this.far);
      Mat4.multiply(this.view, this.projection, this.viewProjection);
    }

    activate(viewIndex: number = 0) {
      var renderer: Components.Renderer = this.node.root.getService("Renderer");
      var view: Render.View = renderer.manager.views[viewIndex];
      
      if (!view) {
        // TODO: log
        return;
      }

      var oldCamera:any = view.camera;
      if (oldCamera instanceof Glib.Components.Camera) {
        oldCamera.deactivate();
      }
      this.targetView = view;
      this.targetView.camera = this;     
    }

    deactivate() {
      if (this.targetView) {
        this.targetView.camera = void 0;
        this.targetView = void 0;
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
