import { IViewPortState, ViewportState, ViewportStateParams } from '../../states/ViewportState'
import { DeviceGL } from '../DeviceGL'

export class ViewportStateGL extends ViewportState {

  public constructor(private device: DeviceGL) {
    super()
    this.resolve()
  }

  public commitChanges(changes: Partial<IViewPortState>) {
    const gl = this.device.context
    if (changes.x !== null || changes.y !== null ||
      changes.width !== null || changes.height !== null) {
      gl.viewport(this.x, this.y, this.width, this.height)
    }
    if (changes.zMin !== undefined || changes.zMax !== undefined) {
      gl.depthRange(this.zMin, this.zMax)
    }
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    ViewportStateGL.resolve(this.device.context, this)
    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext): IViewPortState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(gl: WebGLRenderingContext | WebGL2RenderingContext, out: T): T & IViewPortState
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext, out: ViewportStateParams = {}): IViewPortState {
    const range = gl.getParameter(gl.DEPTH_RANGE)
    out.zMin = range[0]
    out.zMax = range[1]
    const viewport = gl.getParameter(gl.VIEWPORT)
    out.x = viewport[0]
    out.y = viewport[1]
    out.width = viewport[2]
    out.height = viewport[3]
    return out as IViewPortState
  }
}
