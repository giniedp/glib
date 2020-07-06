import { CullState, CullStateParams, ICullState } from '../../states/CullState'
import { DeviceGL } from '../DeviceGL'

export class CullStateGL extends CullState {

  public constructor(private device: DeviceGL) {
    super()
    this.resolve()
  }

  public commitChanges(changes: Partial<ICullState>) {
    const gl = this.device.context
    if (changes.enable === true) {
      gl.enable(gl.CULL_FACE)
    }
    if (changes.enable === false) {
      gl.disable(gl.CULL_FACE)
    }
    if (changes.cullMode !== null) {
      gl.cullFace(this.cullMode)
    }
    if (changes.frontFace !== null) {
      gl.frontFace(this.frontFace)
    }
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    CullStateGL.resolve(this.device.context, this)
    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext): ICullState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(gl: WebGLRenderingContext | WebGL2RenderingContext, out: T): T & ICullState
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext, out: CullStateParams= {}): ICullState {
    out.frontFace = gl.getParameter(gl.FRONT_FACE)
    out.enable = gl.getParameter(gl.CULL_FACE)
    out.cullMode = gl.getParameter(gl.CULL_FACE_MODE)
    return out as ICullState
  }
}
