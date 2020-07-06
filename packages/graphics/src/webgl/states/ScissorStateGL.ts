import { IScissorState, ScissorState, ScissorStateParams } from '../../states/ScissorState'
import { DeviceGL } from '../DeviceGL'

export class ScissorStateGL extends ScissorState {

  public constructor(private device: DeviceGL) {
    super()
    this.resolve()
  }

  public commitChanges(changes: Partial<IScissorState>) {
    const gl = this.device.context
    if (changes.enable === true) {
      gl.enable(gl.SCISSOR_TEST)
    }
    if (changes.enable === false) {
      gl.disable(gl.SCISSOR_TEST)
    }
    if (changes.x != null || changes.y != null || changes.width != null || changes.height != null) {
      gl.scissor(this.x, this.y, this.width, this.height)
    }
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    ScissorStateGL.resolve(this.device.context, this)
    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext): IScissorState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(gl: WebGLRenderingContext | WebGL2RenderingContext, out: T): T & IScissorState
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext, out: ScissorStateParams = {}): IScissorState {
    out.enable = gl.getParameter(gl.SCISSOR_TEST)
    const scissor = gl.getParameter(gl.SCISSOR_BOX)
    out.x = scissor[0]
    out.y = scissor[1]
    out.width = scissor[2]
    out.height = scissor[3]
    return out as IScissorState
  }
}
