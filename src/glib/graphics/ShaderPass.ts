module Glib.Graphics {

  /**
   * The shader pass constructor options
   */
  export interface ShaderPassOptions {
    /**
     * The name of the shader pass
     */
    name?: string
    /**
     * Arbitrary meta data or info about the shader pass
     */
    meta?: Object
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
   * 
   */
  export class ShaderPass {
    /**
     * The graphics device
     */
    device:Device
    /**
     * The rendering context
     */
    gl:WebGLRenderingContext
    /**
     * The name of the shader pass
     */
    name:string
    /**
     * Arbitrary meta data or info about the shader pass
     */
    meta:Object
    /**
     * The shader program
     */
    program:ShaderProgram
    /**
     * The cull state required for this pass
     */
    cullState:CullStateOptions
    /**
     * The blend state required for this pass
     */
    blendState:BlendStateOptions
    /**
     * The depth state required for this pass
     */
    depthState:DepthStateOptions
    /**
     * The offset state required for this pass
     */
    offsetState:OffsetStateOptions
    /**
     * The stencil state required for this pass
     */
    stencilState:StencilStateOptions

    constructor(device:Device, options:ShaderPassOptions) {
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
    commit(parameters?:any):ShaderPass {
      this.program.use()
      var device = this.device
      if (this.stencilState) device.stencilState = this.stencilState
      if (this.offsetState) device.offsetState = this.offsetState
      if (this.blendState) device.blendState = this.blendState
      if (this.depthState) device.depthState = this.depthState
      if (this.cullState) device.cullState = this.cullState
      if (parameters) this.program.commit(parameters)
      return this
    }

    clone():ShaderPass {
      let opts:ShaderPassOptions = {
        name: this.name,
        meta: utils.copy(true, this.meta),
        program: this.program.clone()
      }
      if (this.stencilState) opts.stencilState = utils.copy(true, this.stencilState)
      if (this.offsetState) opts.offsetState = utils.copy(true, this.offsetState)
      if (this.blendState) opts.blendState = utils.copy(true, this.blendState)
      if (this.depthState) opts.depthState = utils.copy(true, this.depthState)
      if (this.cullState) opts.cullState = utils.copy(true, this.cullState)
      return new ShaderPass(this.device, opts)
    }
  }
}
