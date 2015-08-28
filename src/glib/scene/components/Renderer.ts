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
    device: Device;
    assets: Assets;
    manager: Glib.Render.Manager;
    cullVisitor:CullVisitor = new SimpleCullVisitor();

    constructor() {

    }

    setup() {
      this.time = this.node.root.getService("Time");
      this.device = this.node.root.getService("Device");
      this.assets = this.node.root.getService("Assets");
      this.manager = new Glib.Render.Manager(this.device);
      this.manager.createView({
        enabled: true,
        steps: [new Render.ForwardRendering()]
      });
      
      /*
      this.assets.load("Effect", "/assets/shader/postprocess/bloom.yml").then((effect) => {
        var material = new Glib.Graphics.Material(this.device, effect)
        var postEffect = new Render.PostEffect.Bloom(material);
        var view = this.manager.views[0];
        view.steps.push(postEffect);
      });
      */

      /*
      this.assets.load("Effect", "/assets/shader/postprocess/shockwave.yml").then((effect) => {
        var program = this.device.createProgram(effect.techniques[0].passes[0]);
        var postEffect = new Render.PostEffect.ShockWave(program);
        var view = this.manager.views[0];
        view.steps.push(postEffect);
      });
      */
    }

    update() {
      this.manager.binder.setTime(this.time.totalMsInGame, this.time.elapsedMsInGame);
    }

    draw() {
      for(var view of this.manager.views) {
        this._renderView(view);
      }
      this.manager.presentViews();
    }

    private _renderView(view: Render.View) {
      if (!view || !view.camera || view.enabled === false) {
        return;
      }
      var camera = view.camera;
      var binder = this.manager.binder;
      binder.lights.length = 0;
      binder.renderables.length = 0;
      binder.setCamera(camera.world, camera.view, camera.projection);
      this.cullVisitor.start(this.node.root, binder);
      this.manager.renderView(view);
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
