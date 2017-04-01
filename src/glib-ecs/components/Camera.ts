module Glib.Components {

  import Mat4 = Glib.Mat4

  export interface CameraProperties {
    near?: number
    far?: number
    fov?: number
    aspect?: number
  }

  export class Camera implements Component {
    public node: Entity
    public name: string = 'Camera'
    public service: boolean = true
    public enabled: boolean = true

    public near: number = 0.1
    public far: number = 1000
    public fov: number = Math.PI * 0.25
    public aspect: number = 4 / 3

    public view: Mat4 = Mat4.identity()
    public projection: Mat4 = Mat4.identity()
    public viewProjection: Mat4 = Mat4.identity()
    public transform: Transform
    private targetView: Render.View

    constructor(params?: CameraProperties) {
      if (params) {
        Glib.utils.extend(this, params)
      }
    }

    public setup() {
      this.transform = this.node.getService('Transform')
    }

    public update() {
      if (this.targetView) {
        this.aspect = this.targetView.width / this.targetView.height
      }
      this.view.initFrom(this.transform.inverseMat)
      this.projection.initPerspectiveFieldOfView(this.fov, this.aspect, this.near, this.far)
      Mat4.multiply(this.view, this.projection, this.viewProjection)
    }

    public activate(viewIndex: number = 0) {
      const renderer: Components.Renderer = this.node.root.getService('Renderer')
      const view: Render.View = renderer.manager.views[viewIndex]

      if (!view) {
        // TODO: log
        return
      }

      const oldCamera: any = view.camera
      if (oldCamera instanceof Glib.Components.Camera) {
        oldCamera.deactivate()
      }
      this.targetView = view
      this.targetView.camera = this
    }

    public deactivate() {
      if (this.targetView) {
        this.targetView.camera = void 0
        this.targetView = void 0
      }
    }

    public debug(): string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`,
        `  near: ${this.near.toPrecision(5)}, far: ${this.far.toPrecision(5)}, fov: ${this.fov.toPrecision(5)}, aspect: ${this.aspect.toPrecision(5)}`
      ].join('\n')
    }
  }
}
