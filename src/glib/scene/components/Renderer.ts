module Glib.Components {

  import Color = Glib.Graphics.Color;
  import Device = Glib.Graphics.Device;
  import Context = Glib.Rendering.Context;
  import ForwardRendering = Glib.Rendering.ForwardRendering;
  import RenderStep = Glib.Rendering.Step;

  export interface CullVisitor {
    start(entity:Entity, context:Context)
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
    context:Context = new Context();
    cullVisitor:CullVisitor = new SimpleCullVisitor();
    screens:any[] = [];

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
    }

    update() {
      this.context.setTime(this.time.totalMsInGame, this.time.elapsedMsInGame);
    }

    draw() {
      this.device.clear(Color.CornflowerBlue, 0, 0);
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
    context:Context;

    start(node:Entity, context:Context) {
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
