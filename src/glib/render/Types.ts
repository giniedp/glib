module Glib.Render {

  export interface ItemData {
    world: Mat4
    mesh:Graphics.ModelMesh
    effect:Graphics.ShaderEffect
    data:any
  }

  export interface LightData {
    color: IVec4
    position: IVec4
    direction: IVec4
    misc: IVec4
  }

  export interface CameraData {
    world?: Glib.Mat4;
    view: Glib.Mat4;
    projection: Glib.Mat4;
    viewProjection?: Glib.Mat4;
  }

  export interface Step {
    setup?:(manager:Manager)=>void
    render?:(manager:Manager)=>void
    cleanup?:(manager:Manager)=>void
  }

  export interface View {
    /**
     * Whether this view is enabled for rendering or not
     */
    enabled?: boolean
    /**
     * The layout definition in normalized coordinates
     */
    layout?: any
    /**
     * X position on screen
     */
    x?: number
    /**
     * Y position on screen
     */
    y?: number
    /**
     * Width on screen
     */
    width?: number
    /**
     * Height on screen
     */
    height?: number
    /**
     * The render target
     */
    target?: Graphics.Texture
    /**
     * The camera that is rendering this view
     */
    camera?: Render.CameraData
    /**
     * The items that are visible by this view
     */
    items: Render.ItemData[]
    /**
     * The lights that affect this view
     */
    lights: Render.LightData[]
    /**
     * The rendering steps
     */
    steps: Render.Step[]
  }

}
