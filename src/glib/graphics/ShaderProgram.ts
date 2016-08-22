module Glib.Graphics {

  import debug = Glib.utils.debug;
  import warn = Glib.utils.warn;
  import error = Glib.utils.error;

  export interface ShaderProgramOptions {
    /**
     * The vertex shader to be used in a program.
     * 
     */
    vertexShader?: string|ShaderOptions|Shader,
    /**
     * 
     */
    fragmentShader?: string|ShaderOptions|Shader,
    /**
     * 
     */
    handle?: WebGLProgram
  }

  /**
   * 
   */
  export class ShaderProgram {
    /**
     * A unique id
     */
    uid:string
    /**
     * The graphics device
     */
    device:Device
    /**
     * The rendering context
     */
    gl:WebGLRenderingContext
    /**
     * Collection of all attached shaders. Usually contains a single vertex and a single fragment shader 
     */
    private attached:Shader[] = []
    /**
     * The vertex shader
     */
    private vertexShader:Shader
    /**
     * The fragment shader
     */
    private fragmentShader:Shader

    /**
     * The web gl program handle
     */
    handle:WebGLProgram

    attributes:Object = {}
    attributeLocations:number[] = []
    uniforms:{ [name:string]: ShaderUniform } = {}

    /**
     * Whether the program is successfully linked
     */
    linked:boolean
    /**
     * The info log that is generated after linking the program 
     */
    info:string

    private _errLogs = {}

    constructor(device:Device, options:ShaderProgramOptions={}) {
      this.uid = utils.uuid()
      this.device = device
      this.gl = device.context
      this.handle = options.handle

      let shader:any = options.vertexShader
      if (shader) {
        if (typeof shader === 'string') {
          shader = { source: shader }
        }
        if (!shader.type) {
          shader.type = ShaderType.VertexShader
        }
        if (shader instanceof Shader) {
          this.vertexShader = shader
        } else {
          this.vertexShader = new Shader(this.device, shader)
        }
      }

      shader = options.fragmentShader
      if (shader) {
        if (typeof shader === 'string') {
          shader = { source: shader }
        }
        if (!shader.type) {
          shader.type = ShaderType.FragmentShader
        }
        if (shader instanceof Shader) {
          this.fragmentShader = shader
        } else {
          this.fragmentShader = new Shader(this.device, shader)
        }
      }
      
      if (!this.handle || !this.gl.isProgram(this.handle)) {
        this.handle = this.gl.createProgram()
      }
      this.link()

      let inspect = Shader.inspectProgram(this.vertexShader.source, this.fragmentShader.source)
      this.makeAttributes(inspect.attributes)
      this.makeUniforms(inspect.uniforms)
    }

    /**
     * Releases the program handle
     */
    destroy():ShaderProgram {
      if (this.gl.isProgram(this.handle)) {
        this.gl.deleteProgram(this.handle)
        this.handle = null
      }
      return this
    }

    /**
     * Sets this program as the current program on the graphics device
     */
    use():ShaderProgram {
      return this.device.program = this
    }

    clone():ShaderProgram {
      return new ShaderProgram(this.device, {
        vertexShader: this.vertexShader ? this.vertexShader.clone() : void 0,
        fragmentShader: this.fragmentShader ? this.fragmentShader.clone() : void 0
      })
    }

    /**
     * Attaches all shaders
     */
    private attach():ShaderProgram {
      this.attached.length = 0
      if (this.vertexShader) {
        this.gl.attachShader(this.handle, this.vertexShader.handle)
        this.attached.push(this.vertexShader)
      }
      if (this.fragmentShader) {
        this.gl.attachShader(this.handle, this.fragmentShader.handle)
        this.attached.push(this.fragmentShader)
      }
      return this
    }

    /**
     * Detaches all shaders
     */
    private detach():ShaderProgram {
      for (let shader of this.attached) {
        this.gl.detachShader(this.handle, shader.handle)
      }
      this.attached.length = 0
      return this
    }

    /**
     * 
     */
    private makeAttributes(attributes:any):ShaderProgram {
      this.use()
      this.attributes = {}
      this.attributeLocations.length = 0
      if (!attributes) return this
      for (let key in attributes) { // jshint ignore:line
        let attribute = attributes[key]
        attribute.location = this.gl.getAttribLocation(this.handle, attribute.name || key)
        if (attribute.location >= 0) {
          this.attributes[key] = attribute
          this.attributeLocations.push(attribute.location)
        }
      }
      return this
    }

    /**
     * 
     */
    private makeUniforms(uniforms:any):ShaderProgram {
      this.use()
      this.uniforms = {}
      if (!uniforms) return this
      for (let key in uniforms) {
        let uniform = new ShaderUniform(this, key, uniforms[key])
        if (uniform.location != null) {
          this.uniforms[key] = uniform
        }
      }
      return this
    }

    /**
     * 
     */
    link():ShaderProgram {
      this.detach()
      this.attach()

      this.gl.linkProgram(this.handle)
      this.linked = this.gl.getProgramParameter(this.handle, this.gl.LINK_STATUS)
      this.info = this.gl.getProgramInfoLog(this.handle)

      if (!this.linked) {
        error('ShaderProgram#link failed', this.info)
      }
      return this
    }

    /**
     * Sets multiple uniform values
     */
    commit(uniforms?:any):ShaderProgram {
      if (!uniforms) return this 
      for (let key in this.uniforms) {
        if (uniforms.hasOwnProperty(key)) {
          this.setUniform(key, uniforms[key])
        }
      }
      return this
    }

    /**
     * Sets a value on the named uniform
     */
    setUniform(name:string, value: any):ShaderProgram {
      if (value == null) return
      let uniform = this.uniforms[name]
      if (!uniform) {
        this.logMissingUniform(name)
      } else {
        this.use()
        uniform.set(value)
      }
      return this
    }

    private logMissingUniform(name) {
      if (!this._errLogs[name]) {
        Glib.utils.warn(`Uniform '${name}' not found`)
        this._errLogs[name] = true
      }
    }
  }
}
