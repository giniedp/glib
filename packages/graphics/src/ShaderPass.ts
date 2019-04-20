import { copy } from '@gglib/core'
import { Device } from './Device'
import { ShaderProgram, ShaderProgramOptions } from './ShaderProgram'
import { ShaderUniformParameter } from './ShaderUniform'
import {
  BlendState,
  BlendStateParams,
  CullState,
  CullStateParams,
  DepthState,
  DepthStateParams,
  OffsetState,
  OffsetStateParams,
  StencilState,
  StencilStateParams,
} from './states'

/**
 * The shader pass constructor options
 *
 * @public
 */
export interface ShaderPassOptions {
  /**
   * The name of the shader pass
   */
  name?: string
  /**
   * Arbitrary meta data or info about the shader pass
   */
  meta?: { [key: string]: any }
  /**
   * The shader program or constructor options
   */
  program?: ShaderProgram|ShaderProgramOptions
  /**
   * The cull state or a name reference
   */
  cullState?: string|CullStateParams,
  /**
   * The blend state or a name reference
   */
  blendState?: string|BlendStateParams,
  /**
   * The depth state or a name reference
   */
  depthState?: string|DepthStateParams,
  /**
   * The offset state or a name reference
   */
  offsetState?: string|OffsetStateParams,
  /**
   * The stencil state or a name reference
   */
  stencilState?: string|StencilStateParams
}

/**
 * Ties a `ShaderProgram` together with GPU States.
 *
 * @public
 */
export class ShaderPass {
  /**
   * A symbol identifying the `ShaderPassOptions` type.
   */
  public static OptionsSymbol = Symbol('ShaderPassOptions')

  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * The rendering context
   */
  public readonly gl: WebGLRenderingContext
  /**
   * The name of the shader pass
   */
  public readonly name: string
  /**
   * Arbitrary meta data or info about the shader pass
   */
  public readonly meta: { [key: string]: any }
  /**
   * The shader program to be activated on `commit`
   */
  public readonly program: ShaderProgram
  /**
   * The cull state to be enabled on `commit`
   */
  public cullState: CullStateParams
  /**
   * The blend state to be enabled on `commit`
   */
  public blendState: BlendStateParams
  /**
   * The depth state to be enabled on `commit`
   */
  public depthState: DepthStateParams
  /**
   * The offset state to be enabled on `commit`
   */
  public offsetState: OffsetStateParams
  /**
   * The stencil state to be enabled on `commit`
   */
  public stencilState: StencilStateParams

  constructor(device: Device, options: ShaderPassOptions) {
    this.device = device
    this.gl = device.context
    this.name = options.name
    this.meta = options.meta || {}
    if (options.cullState) { this.cullState = CullState.convert(options.cullState) }
    if (options.blendState) { this.blendState = BlendState.convert(options.blendState) }
    if (options.depthState) { this.depthState = DepthState.convert(options.depthState) }
    if (options.offsetState) { this.offsetState = OffsetState.convert(options.offsetState) }
    if (options.stencilState) { this.stencilState = StencilState.convert(options.stencilState) }
    let program = options.program
    if (program instanceof ShaderProgram) {
      this.program = program
    } else {
      this.program = new ShaderProgram(device, program)
    }
  }

  /**
   * Activates any state that is enabled on this pass and commits given parameters to the programs
   */
  public commit(parameters?: { [key: string]: ShaderUniformParameter }): ShaderPass {
    this.program.use()
    let device = this.device
    if (this.stencilState) { device.stencilState = this.stencilState }
    if (this.offsetState) { device.offsetState = this.offsetState }
    if (this.blendState) { device.blendState = this.blendState }
    if (this.depthState) { device.depthState = this.depthState }
    if (this.cullState) { device.cullState = this.cullState }
    if (parameters) { this.program.commit(parameters) }
    return this
  }

  public clone(): ShaderPass {
    let opts: ShaderPassOptions = {
      name: this.name,
      meta: copy(true, this.meta),
      program: this.program.clone(),
    }
    if (this.stencilState) { opts.stencilState = copy(true, this.stencilState) }
    if (this.offsetState) { opts.offsetState = copy(true, this.offsetState) }
    if (this.blendState) { opts.blendState = copy(true, this.blendState) }
    if (this.depthState) { opts.depthState = copy(true, this.depthState) }
    if (this.cullState) { opts.cullState = copy(true, this.cullState) }
    return new ShaderPass(this.device, opts)
  }
}
