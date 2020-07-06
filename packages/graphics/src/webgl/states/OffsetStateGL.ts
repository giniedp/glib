import { IOffsetState, OffsetState, OffsetStateParams } from '../../states/OffsetState'
import { DeviceGL } from '../DeviceGL'

export class OffsetStateGL extends OffsetState {

  public constructor(private device: DeviceGL) {
    super()
    this.resolve()
  }

  public commitChanges(changes: Partial<IOffsetState>) {
    const gl = this.device.context
    if (changes.enable === true) {
      gl.enable(gl.POLYGON_OFFSET_FILL)
    }
    if (changes.enable === false) {
      gl.disable(gl.POLYGON_OFFSET_FILL)
    }
    if (changes.offsetFactor !== null || changes.offsetUnits !== null) {
      gl.polygonOffset(this.offsetFactor, this.offsetUnits)
    }
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    OffsetStateGL.resolve(this.device.context, this)
    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext): IOffsetState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(gl: WebGLRenderingContext | WebGL2RenderingContext, out: T): T & IOffsetState
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext, out: OffsetStateParams = {}): IOffsetState {
    out.enable = gl.getParameter(gl.POLYGON_OFFSET_FILL)
    out.offsetFactor = gl.getParameter(gl.POLYGON_OFFSET_FACTOR)
    out.offsetUnits = gl.getParameter(gl.POLYGON_OFFSET_UNITS)
    return out as IOffsetState
  }
}
