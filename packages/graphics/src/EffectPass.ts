import { Device } from './Device'
import { ShaderProgram, ShaderProgramOptions, ShaderUniformValue } from './resources'
import {
  BlendState,
  BlendStateParams,
  CullState,
  CullStateParams,
  DepthState,
  DepthStateParams,
  IBlendState,
  ICullState,
  IDepthState,
  IOffsetState,
  IStencilState,
  OffsetState,
  OffsetStateParams,
  StencilState,
  StencilStateParams,
} from './states'

/**
 * Constructor options for {@link EffectPass}
 *
 * @public
 */
export interface EffectPassOptions {
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
  program: ShaderProgram | ShaderProgramOptions
  /**
   * The cull state to be used for this shader pass
   */
  cullState?: string | CullStateParams
  /**
   * The blend state to be used for this shader pass
   */
  blendState?: string | BlendStateParams
  /**
   * The depth state to be used for this shader pass
   */
  depthState?: string | DepthStateParams
  /**
   * The offset state to be used for this shader pass
   */
  offsetState?: string | OffsetStateParams
  /**
   * The stencil state to be used for this shader pass
   */
  stencilState?: string | StencilStateParams
}

/**
 * Defines {@link Device} states which should be used with a specific {@link ShaderProgram}
 *
 * @public
 *
 */
export class EffectPass {
  /**
   * A symbol identifying the `EffectPassOptions` type.
   */
  public static OptionsSymbol = Symbol('EffectPassOptions')

  /**
   * The graphics device
   */
  public device: Device

  /**
   * The name of the shader pass
   */
  public name: string

  /**
   * Arbitrary meta data or info about the shader pass
   */
  public meta: { [key: string]: any }

  /**
   * The shader program to be activated on `commit`
   */
  public program: ShaderProgram

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

  protected cullStateMemo: Partial<ICullState>
  protected blendStateMemo: Partial<IBlendState>
  protected depthStateMemo: Partial<IDepthState>
  protected offsetStateMemo: Partial<IOffsetState>
  protected stencilStateMemo: Partial<IStencilState>

  constructor(device: Device, options: EffectPassOptions) {
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    if (options.cullState) {
      this.cullState = CullState.convert(options.cullState)
    }
    if (options.blendState) {
      this.blendState = BlendState.convert(options.blendState)
    }
    if (options.depthState) {
      this.depthState = DepthState.convert(options.depthState)
    }
    if (options.offsetState) {
      this.offsetState = OffsetState.convert(options.offsetState)
    }
    if (options.stencilState) {
      this.stencilState = StencilState.convert(options.stencilState)
    }
    const program = options.program
    if (program instanceof ShaderProgram) {
      this.program = program
    } else {
      this.program = this.device.createProgram(program)
    }
  }

  /**
   * Prepares the graphics device state for this shader pass and sets the given uniform parameters
   */
  public commit(parameters?: { [key: string]: ShaderUniformValue }): this {
    this.program.bind()
    const device = this.device
    if (this.stencilState) {
      this.stencilStateMemo ||= {}
      device.getStencilState(this.stencilStateMemo)
      device.stencilState = this.stencilState
    }
    if (this.offsetState) {
      this.offsetStateMemo ||= {}
      device.getOffsetState(this.offsetStateMemo)
      device.offsetState = this.offsetState
    }
    if (this.blendState) {
      this.blendStateMemo ||= {}
      device.getBlendState(this.blendStateMemo)
      device.blendState = this.blendState
    }
    if (this.depthState) {
      this.depthStateMemo ||= {}
      device.getDepthState(this.depthStateMemo)
      device.depthState = this.depthState
    }
    if (this.cullState) {
      this.cullStateMemo ||= {}
      device.getCullState(this.cullStateMemo)
      device.cullState = this.cullState
    }
    if (parameters) {
      this.program.setUniforms(parameters)
    }
    return this
  }

  /**
   * Restores the graphics device state to the state before this shader pass was committed
   */
  public restore(): this {
    if (this.stencilState) {
      this.device.stencilState = this.stencilStateMemo
    }
    if (this.offsetState) {
      this.device.offsetState = this.offsetStateMemo
    }
    if (this.blendState) {
      this.device.blendState = this.blendStateMemo
    }
    if (this.depthState) {
      this.device.depthState = this.depthStateMemo
    }
    if (this.cullState) {
      this.device.cullState = this.cullStateMemo
    }
    return this
  }

  /**
   * Creates a clone of this shader pass
   *
   * @remarks
   * This will also clone the underlying program
   */
  public clone(): EffectPass {
    const opts: EffectPassOptions = {
      name: this.name,
      meta: { ...(this.meta || {}) },
      program: this.program.clone(),
    }
    if (this.stencilState) {
      opts.stencilState = { ...this.stencilState }
    }
    if (this.offsetState) {
      opts.offsetState = { ...this.offsetState }
    }
    if (this.blendState) {
      opts.blendState = { ...this.blendState }
    }
    if (this.depthState) {
      opts.depthState = { ...this.depthState }
    }
    if (this.cullState) {
      opts.cullState = { ...this.cullState }
    }
    return new EffectPass(this.device, opts)
  }

  public isReady() {
    return this.program.isReady
  }

  public dispose() {
    this.program?.dispose()
    this.program = null
    this.device = null
  }
}
