import { Log, uuid } from '@gglib/core'
import { Device } from './Device'
import { ShaderType } from './enums'
import { Shader, ShaderOptions } from './Shader'
import { ShaderInspector, ShaderObjectMeta } from './ShaderInspector'
import { ShaderUniform, ShaderUniformParameter } from './ShaderUniform'

/**
 * @public
 */
export interface ShaderProgramOptions {
  /**
   * The vertex shader to be used within the program
   *
   * @remarks
   * If it is a string it is assumed to be the source code for the vertex shader.
   * If it is an object it is assumed to be the shader options to be passed into the `Shader` constructir.
   */
  vertexShader?: string|ShaderOptions|Shader,
  /**
   * The fragment shader to be used within the program
   *
   * @remarks
   * If it is a string it is assumed to be the source code for the fragment shader.
   * If it is an object it is assumed to be the shader options to be passed into the `Shader` constructir.
   */
  fragmentShader?: string|ShaderOptions|Shader,
  /**
   * An already existing WebGLProgram handle
   */
  handle?: WebGLProgram
}

/**
 * Combines a vertex shader and a fragment shader
 *
 * @public
 * @remarks
 * On creation this will inspect the source code of all shaders to detect all attributes, uniforms and annotations
 */
export class ShaderProgram {
  /**
   * A symbol identifying the `ShaderProgramOptions` type.
   */
  public static readonly OptionsSymbol = Symbol('ShaderProgramOptions')

  /**
   * A unique id
   */
  public readonly uid: string
  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * The rendering context
   */
  public readonly gl: WebGLRenderingContext
  /**
   * Collection of all attached shaders. Usually contains a single vertex and a single fragment shader
   */
  private readonly attached: Shader[] = []
  /**
   * The vertex shader
   */
  private readonly vertexShader: Shader
  /**
   * The fragment shader
   */
  private readonly fragmentShader: Shader

  /**
   * The web gl program handle
   */
  public handle: WebGLProgram

  /**
   * A map of shader attributes
   */
  public readonly attributes = new Map<string, ShaderObjectMeta & { location: number }>()
  /**
   * Collection of all detected attribute locations
   */
  public readonly attributeLocations: number[] = []
  /**
   * A map of all shader uniforms
   */
  public readonly uniforms = new Map<string, ShaderUniform>()

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

    const inspection = ShaderInspector.inspectProgram(this.vertexShader.source, this.fragmentShader.source)
    this.assignAttributes(inspection.attributes)
    this.assignUniforms(inspection.uniforms)
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
  private assignAttributes(attributes: { [key: string]: ShaderObjectMeta }): ShaderProgram {
    this.use()
    this.attributes.clear()
    this.attributeLocations.length = 0
    Object.keys(attributes).forEach((key) => {
      const location = this.gl.getAttribLocation(this.handle, attributes[key].name || key)
      if (location >= 0) {
        this.attributes.set(key, {
          ...attributes[key],
          location: location,
        })
        this.attributeLocations.push(location)
      }
    })
    return this
  }

  /**
   *
   */
  private assignUniforms(uniforms: { [key: string]: ShaderObjectMeta }): ShaderProgram {
    this.use()
    this.uniforms.clear()
    Object.keys(uniforms).forEach((key) => {
      const options = uniforms[key]
      if (!options.name && !options.binding) {
        return
      }
      let uniform = new ShaderUniform(this, options)
      if (uniform.location != null) {
        this.uniforms.set(key, uniform)
        Log.i(`ShaderProgram ${this.uid.substr(0, 8)}... binds uniform '${uniform.meta.name}' to '${uniform.name}'`)
      }
    })
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
  public commit(uniforms?: { [key: string]: ShaderUniformParameter }): ShaderProgram {
    if (!uniforms) { return this }
    this.uniforms.forEach((_, key) => {
      if (key in uniforms) {
        this.setUniform(key, uniforms[key])
      }
    })
    return this
  }

  /**
   * Sets a value on the named uniform
   */
  public setUniform(name: string, value: ShaderUniformParameter): ShaderProgram {
    if (value == null) {return }
    let uniform = this.uniforms.get(name)
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
      Log.w(`Uniform '${name}' not found`, this)
      this.errLogs[name] = true
    }
  }
}
