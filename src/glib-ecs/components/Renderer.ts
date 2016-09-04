module Glib.Components {

  export interface CullVisitor {
    start(entity:Entity, view:Render.View)
    add(item:Render.ItemData)
  }

  export class Renderer implements Component {
    node:Entity
    name:string = "Renderer"
    service:boolean = true
    enabled:boolean = true
    visible:boolean = true

    time:Time
    device: Graphics.Device
    assets: Assets
    manager: Glib.Render.Manager
    cullVisitor:CullVisitor = new SimpleCullVisitor()

    constructor() {

    }

    setup() {
      this.time = this.node.root.getService("Time")
      this.device = this.node.root.getService("Device")
      this.assets = this.node.root.getService("Assets")
      this.manager = new Render.Manager(this.device)
      this.manager.addView({
        enabled: true,
        steps: [new Render.StepForward()],
        items: [],
        lights: []
      })
    }

    update() {
      this.manager.binder.updateTime(this.time.totalMsInGame, this.time.elapsedMsInGame)
    }
    
    draw() {
      this.manager.device.resize()
      for(var view of this.manager.views) {
        this.renderView(view)
      }
      this.manager.presentViews()
    }

    private renderView(view: Render.View) {
      if (!view || !view.camera || view.enabled === false) {
        return
      }
      var camera = view.camera
      var binder = this.manager.binder
      view.items.length = 0
      view.lights.length = 0
      binder.updateCamera(camera.world, camera.view, camera.projection)
      this.cullVisitor.start(this.node.root, view)
      this.manager.renderView(view)
    }
  }

  export class SimpleCullVisitor implements CullVisitor, EntityVisitor {
    view:Render.View

    start(node:Entity, view:Render.View) {
      
      node.acceptVisitor(this)
    }

    visit(entity:Entity) {
      var comp:Renderable = entity.s['Renderable']
      if (comp) {
        comp.collect(this)
      }
      var light:Light = entity.s['Light']
      if (light) {
        this.addLight(light.packedData)
      }
    }

    add(item:Render.ItemData) {
      this.view.items.push(item)
    }

    addLight(light:Render.LightData) {
      this.view.lights.push(light)
    }
  }
}
