module Glib.Components {

  import Color = Glib.Graphics.Color;
  import Device = Glib.Graphics.Device;

  import ForwardRendering = Glib.Render.ForwardRendering;
  import RenderBinder = Glib.Render.Binder;
  import RenderStep = Glib.Render.Step;

  export interface CullVisitor {
    start(entity:Entity, context:RenderBinder)
    add(mesh:Graphics.ModelMesh, material:Graphics.Material, world:Vlib.Mat4, params?:any);
  }

  export class Renderer implements Component {
    node:Entity;
    name:string = "Renderer";
    service:boolean = true;
    enabled:boolean = true;
    visible:boolean = true;

    time:Time;
    device:Device;
    context:RenderBinder;
    cullVisitor:CullVisitor = new SimpleCullVisitor();
    screens:any[] = [];
    private _rtOptions:any = {};

    constructor() {
      this.screens = [{
        enabled: true,
        camera: null,
        steps: [new ForwardRendering()]
      }];
    }

    setup() {
      this.time = this.node.root.getService("Time");
      this.device = this.node.root.getService("Device");
      this.context = new RenderBinder(this.device);
    }

    update() {
      this.context.setTime(this.time.totalMsInGame, this.time.elapsedMsInGame);
    }

    draw() {
      for(var screen of this.screens) {
        this.renderScreen(screen);
      }
    }

    renderScreen(screen) {
      if (!screen || !screen.enabled || !screen.camera) {
        return;
      }
      var camera:Camera = screen.camera;
      this.context.lights.length = 0;
      this.context.renderables.length = 0;
      this.context.setCamera(camera.transform.worldMat, camera.viewMat, camera.projMat);
      this.cullVisitor.start(this.node.root, this.context);

      var rtOpts = this._rtOptions;
      rtOpts.width = screen.width;
      rtOpts.height = screen.height;
      rtOpts.depth = true;

      //var buffer = this.context.acquireRenderTarget(rtOpts);

      var step:RenderStep = null, steps = screen.steps;
      for (step of steps) {
        step.setup(this.context);
      }
      for (step of steps) {
        step.render(this.context);
      }
      for (step of steps) {
        step.cleanup(this.context);
      }
    }
  }

  export class SimpleCullVisitor implements CullVisitor, EntityVisitor {
    context:RenderBinder;

    start(node:Entity, context:RenderBinder) {
      this.context = context;
      node.acceptVisitor(this);
    }

    visit(entity:Entity) {
      var comp:Renderable = entity.s['Renderable'];
      if (comp) {
        comp.collect(this);
      }
      comp = entity.s['Light'];
      if (comp) {
        this.addLight(comp);
      }
    }

    add(mesh:Graphics.ModelMesh, material:Graphics.Material, world:Vlib.Mat4, params?:any) {
      this.context.renderables.push({
        world: world,
        mesh: mesh,
        material: material,
        params: params
      });
    }

    addLight(light) {
      this.context.lights.push(light.packedData);
    }
  }
}
