import { DepthState, DepthStateParams, IDepthState } from '../../states/DepthState'
import { DeviceGL } from '../DeviceGL'

export class DepthStateGL extends DepthState {

  public constructor(private device: DeviceGL) {
    super()
    this.resolve()
  }

  public commitChanges(changes: Partial<IDepthState>) {
    const gl = this.device.context
    if (changes.depthFunction != null) {
      gl.depthFunc(changes.depthFunction)
    }
    if (changes.depthWriteEnable != null) {
      gl.depthMask(changes.depthWriteEnable)
    }
    if (changes.enable === true) {
      gl.enable(gl.DEPTH_TEST)
    }
    if (changes.enable === false) {
      gl.disable(gl.DEPTH_TEST)
    }
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    DepthStateGL.resolve(this.device.context, this)
    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext): IDepthState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(gl: WebGLRenderingContext | WebGL2RenderingContext, out: T): T & IDepthState
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext, out: DepthStateParams = {}): IDepthState {
    out.enable = gl.getParameter(gl.DEPTH_TEST)
    out.depthFunction = gl.getParameter(gl.DEPTH_FUNC)
    out.depthWriteEnable = gl.getParameter(gl.DEPTH_WRITEMASK)
    return out as IDepthState
  }

}
