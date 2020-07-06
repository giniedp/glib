import { BlendState, BlendStateParams, IBlendState } from '../../states/BlendState'
import { DeviceGL } from '../DeviceGL'

export class BlendStateGL extends BlendState {

  public constructor(private device: DeviceGL) {
    super()
    this.resolve()
  }

  public commitChanges(changes: Partial<IBlendState>) {
    const gl = this.device.context
    const enabled = this.enable
    if (enabled === true) {
      gl.enable(gl.BLEND)
    }
    if (enabled === false) {
      gl.disable(gl.BLEND)
    }
    if (changes.colorBlendFunction !== undefined || changes.alphaBlendFunction !== undefined) {
      gl.blendEquationSeparate(this.colorBlendFunction, this.alphaBlendFunction)
    }
    if (
      changes.colorSrcBlend !== undefined ||
      changes.colorDstBlend !== undefined ||
      changes.alphaSrcBlend !== undefined ||
      changes.alphaDstBlend !== undefined) {
      gl.blendFuncSeparate(this.colorSrcBlend, this.colorDstBlend, this.alphaSrcBlend, this.alphaDstBlend)
    }
    if (
      changes.constantR !== undefined ||
      changes.constantG !== undefined ||
      changes.constantB !== undefined ||
      changes.constantA !== undefined) {
      gl.blendColor(this.constantR, this.constantG, this.constantB, this.constantA)
    }
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    BlendStateGL.resolve(this.device.context, this)
    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext): IBlendState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(gl: WebGLRenderingContext | WebGL2RenderingContext, out: T): T & IBlendState
  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext, out: BlendStateParams = {}): IBlendState {
    out.colorBlendFunction = gl.getParameter(gl.BLEND_EQUATION_RGB)
    out.alphaBlendFunction = gl.getParameter(gl.BLEND_EQUATION_ALPHA)
    out.colorSrcBlend = gl.getParameter(gl.BLEND_SRC_RGB)
    out.alphaSrcBlend = gl.getParameter(gl.BLEND_SRC_ALPHA)
    out.colorDstBlend = gl.getParameter(gl.BLEND_DST_RGB)
    out.alphaDstBlend = gl.getParameter(gl.BLEND_DST_ALPHA)
    const color = gl.getParameter(gl.BLEND_COLOR)
    // Linux Firefox returns null instead of an array if blend is disabled
    out.constantR = color ? color[0] : 0
    out.constantG = color ? color[1] : 0
    out.constantB = color ? color[2] : 0
    out.constantA = color ? color[3] : 0
    out.enable = gl.getParameter(gl.BLEND)
    return out as IBlendState
  }
}
