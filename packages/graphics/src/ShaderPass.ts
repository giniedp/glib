import { copy } from '@gglib/core'
import { Device } from './Device'
import { ShaderProgram, ShaderProgramOptions } from './ShaderProgram'
import {
  BlendState,
  BlendStateOptions,
  CullState,
  CullStateOptions,
  DepthState,
  DepthStateOptions,
  OffsetState,
  OffsetStateOptions,
  StencilState,
  StencilStateOptions,
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
  cullState?: string|CullStateOptions,
  /**
   * The blend state or a name reference
   */
  blendState?: string|BlendStateOptions,
  /**
   * The depth state or a name reference
   */
  depthState?: string|DepthStateOptions,
  /**
   * The offset state or a name reference
   */
  offsetState?: string|OffsetStateOptions,
  /**
   * The stencil state or a name reference
   */
  stencilState?: string|StencilStateOptions
}

/**
 * @public
 */
export class ShaderPass {
  /**
   * The graphics device
   */
  public device: Device
  /**
   * The rendering context
   */
  public gl: WebGLRenderingContext
  /**
   * The name of the shader pass
   */
  public name: string
  /**
   * Arbitrary meta data or info about the shader pass
   */
  public meta: { [key: string]: any }
  /**
   * The shader program
   */
  public program: ShaderProgram
  /**
   * The cull state required for this pass
   */
  public cullState: CullStateOptions
  /**
   * The blend state required for this pass
   */
  public blendState: BlendStateOptions
  /**
   * The depth state required for this pass
   */
  public depthState: DepthStateOptions
  /**
   * The offset state required for this pass
   */
  public offsetState: OffsetStateOptions
  /**
   * The stencil state required for this pass
   */
  public stencilState: StencilStateOptions

  constructor(device: Device, options: ShaderPassOptions) {
    this.device = device
    this.gl = device.context
    this.name = options.name
    this.meta = options.meta || {}
    this.cullState = CullState.convert(options.cullState)
    this.blendState = BlendState.convert(options.blendState)
    this.depthState = DepthState.convert(options.depthState)
    this.offsetState = OffsetState.convert(options.offsetState)
    this.stencilState = StencilState.convert(options.stencilState)
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
  public commit(parameters?: any): ShaderPass {
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
