import { CullMode } from '../../enums'
import { IStencilState, StencilState } from '../../states/StencilState'
import { DeviceGL } from '../DeviceGL'

export class StencilStateGL extends StencilState {

  public constructor(private device: DeviceGL) {
    super()
    this.resolve()
  }

  public commitChanges(changes: Partial<IStencilState>) {
    let gl = this.device.context

    let enable = changes.enable
    if (enable === true) {
      gl.enable(gl.STENCIL_TEST)
    } else if (enable === false) {
      gl.disable(gl.STENCIL_TEST)
    }

    if (changes.stencilFunction !== null || changes.stencilReference !== null || changes.stencilMask !== null) {
      gl.stencilFuncSeparate(CullMode.Front, this.stencilFunction, this.stencilReference, this.stencilMask)
    }

    if (changes.stencilFail !== null || changes.stencilDepthFail !== null || changes.stencilDepthPass !== null) {
      gl.stencilOpSeparate(CullMode.Front, this.stencilFail, this.stencilDepthFail, this.stencilDepthPass)
    }

    if (changes.stencilBackFunction !== null || changes.stencilBackReference !== null || changes.stencilBackMask !== null) {
      gl.stencilFuncSeparate(CullMode.Back, this.stencilBackFunction, this.stencilBackReference, this.stencilBackMask)
    }

    if (changes.stencilBackFail !== null || changes.stencilBackDepthFail !== null || changes.stencilBackDepthPass !== null) {
      gl.stencilOpSeparate(CullMode.Back, this.stencilBackFail, this.stencilBackDepthFail, this.stencilBackDepthPass)
    }

  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    StencilStateGL.resolve(this.device.context, this)
    this.clearChanges()
    return this
  }

  public static resolve(gl: WebGLRenderingContext, out: any= {}): IStencilState {
    out.enable = gl.getParameter(gl.STENCIL_TEST)

    out.stencilFunction = gl.getParameter(gl.STENCIL_FUNC)
    out.stencilReference = gl.getParameter(gl.STENCIL_REF)
    out.stencilMask = gl.getParameter(gl.STENCIL_VALUE_MASK)

    out.stencilFail = gl.getParameter(gl.STENCIL_FAIL)
    out.stencilDepthFail = gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL)
    out.stencilDepthPass = gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS)

    out.stencilBackFunction = gl.getParameter(gl.STENCIL_BACK_FUNC)
    out.stencilBackReference = gl.getParameter(gl.STENCIL_BACK_REF)
    out.stencilBackMask = gl.getParameter(gl.STENCIL_BACK_VALUE_MASK)

    out.stencilBackFail = gl.getParameter(gl.STENCIL_BACK_FAIL)
    out.stencilBackDepthFail = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_FAIL)
    out.stencilBackDepthPass = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_PASS)
    return out
  }

}
