import { Log, uuid } from '@gglib/core'
import { Device } from './Device'
import { ShaderType } from './enums'
import { Shader, ShaderOptions } from './Shader'
import { ShaderInspector } from './ShaderInspector'
import { ShaderUniform } from './ShaderUniform'

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
  public uid: string
  /**
   * The graphics device
   */
  public device: Device
  /**
   * The rendering context
   */
  public gl: WebGLRenderingContext
  /**
   * Collection of all attached shaders. Usually contains a single vertex and a single fragment shader
   */
  private attached: Shader[] = []
  /**
   * The vertex shader
   */
  private vertexShader: Shader
  /**
   * The fragment shader
   */
  private fragmentShader: Shader

  /**
   * The web gl program handle
   */
  public handle: WebGLProgram

  public attributes: { [key: string]: any } = {}
  public attributeLocations: number[] = []
  public uniforms: { [name: string]: ShaderUniform } = {}

  /**
   * Whether the program is successfully linked
   */
  public linked: boolean
  /**
   * The info log that is generated after linking the program
   */
  public info: string

  private errLogs = {}

  constructor(device: Device, options: ShaderProgramOptions= {}) {
    this.uid = uuid()
    this.device = device
    this.gl = device.context
    this.handle = options.handle

    let shader: any = options.vertexShader
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

    let inspect = ShaderInspector.inspectProgram(this.vertexShader.source, this.fragmentShader.source)
    this.makeAttributes(inspect.attributes)
    this.makeUniforms(inspect.uniforms)
  }

  /**
   * Releases the program handle
   */
  public destroy(): ShaderProgram {
    if (this.gl.isProgram(this.handle)) {
      this.gl.deleteProgram(this.handle)
      this.handle = null
    }
    return this
  }

  /**
   * Sets this program as the current program on the graphics device
   */
  public use(): ShaderProgram {
    return this.device.program = this
  }

  public clone(): ShaderProgram {
    return new ShaderProgram(this.device, {
      vertexShader: this.vertexShader ? this.vertexShader.clone() : void 0,
      fragmentShader: this.fragmentShader ? this.fragmentShader.clone() : void 0,
    })
  }

  /**
   * Attaches all shaders
   */
  private attach(): ShaderProgram {
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
  private detach(): ShaderProgram {
    for (let shader of this.attached) {
      this.gl.detachShader(this.handle, shader.handle)
    }
    this.attached.length = 0
    return this
  }

  /**
   *
   */
  private makeAttributes(attributes: any): ShaderProgram {
    this.use()
    this.attributes = {}
    this.attributeLocations.length = 0
    if (!attributes) { return this }
    for (let key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        let attribute = attributes[key]
        attribute.location = this.gl.getAttribLocation(this.handle, attribute.name || key)
        if (attribute.location >= 0) {
          this.attributes[key] = attribute
          this.attributeLocations.push(attribute.location)
        }
      }
    }
    return this
  }

  /**
   *
   */
  private makeUniforms(uniforms: any): ShaderProgram {
    this.use()
    this.uniforms = {}
    if (!uniforms) { return this }
    for (let key in uniforms) {
      if (uniforms.hasOwnProperty(key)) {
        let options = uniforms[key]
        if (!options.name && !options.binding) { continue }
        let uniform = new ShaderUniform(this, options)
        if (uniform.location != null) {
          this.uniforms[key] = uniform
          Log.i(`ShadderProgram ${this.uid.substr(0, 8)}... binds uniform '${uniform.meta.name}' to '${uniform.name}'`)
        }
      }
    }
    return this
  }

  /**
   *
   */
  public link(): ShaderProgram {
    this.detach()
    this.attach()

    this.gl.linkProgram(this.handle)
    this.linked = this.gl.getProgramParameter(this.handle, this.gl.LINK_STATUS)
    this.info = this.gl.getProgramInfoLog(this.handle)

    if (!this.linked) {
      Log.e('ShaderProgram#link failed', this.info)
    }
    return this
  }

  /**
   * Sets multiple uniform values
   */
  public commit(uniforms?: any): ShaderProgram {
    if (!uniforms) { return this }
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
  public setUniform(name: string, value: any): ShaderProgram {
    if (value == null) {return }
    let uniform = this.uniforms[name]
    if (!uniform) {
      this.logMissingUniform(name)
    } else {
      this.use()
      uniform.set(value)
    }
    return this
  }

  private logMissingUniform(name: string) {
    if (!this.errLogs[name]) {
      Log.w(`Uniform '${name}' not found`)
      this.errLogs[name] = true
    }
  }
}
