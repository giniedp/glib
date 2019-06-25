import { Log, uuid } from '@gglib/utils'
import { Device } from './Device'
import { ShaderType } from './enums'
import { Shader, ShaderOptions } from './Shader'
import { ShaderInspector, ShaderObjectMeta } from './ShaderInspector'
import { ShaderUniform, ShaderUniformParameter } from './ShaderUniform'

/**
 * Constructor options for {@link ShaderProgram}
 *
 * @public
 */
export interface ShaderProgramOptions {
  /**
   * The vertex shader to be used within the program
   *
   * @remarks
   * If it is a string it is assumed to be the source code for the vertex shader.
   * If it is an object it is assumed to be the shader options to be passed into the `Shader` constructor.
   */
  vertexShader?: string|ShaderOptions|Shader,
  /**
   * The fragment shader to be used within the program
   *
   * @remarks
   * If it is a string it is assumed to be the source code for the fragment shader.
   * If it is an object it is assumed to be the shader options to be passed into the `Shader` constructor.
   */
  fragmentShader?: string|ShaderOptions|Shader,
  /**
   * A {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram | WebGLProgram} object to be reused
   */
  handle?: WebGLProgram
}

/**
 * A wrapper class around {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram | WebGLProgram}
 *
 * @public
 * @remarks
 * Combines a vertex shader and a fragment shader into a shader program.
 *
 * On creation the shader source code is inspected for
 */
export class ShaderProgram {
  /**
   * A symbol identifying the `ShaderProgramOptions` type.
   */
  public static readonly OptionsSymbol = Symbol('ShaderProgramOptions')

  /**
   * A unique id
   */
  public readonly uid: string = uuid()
  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * Collection of all attached shaders. Usually contains a single vertex and a single fragment shader
   */
  private readonly attached: ReadonlyArray<Shader> = []
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
  public readonly uniforms: ReadonlyMap<string, ShaderUniform> = new Map<string, ShaderUniform>()

  /**
   * Whether the program is successfully linked
   */
  public linked: boolean
  /**
   * The info log that is generated after linking the program
   */
  public info: string

  private errLogs = {}
  private uniformKeys: string[] = []
  private attributeKeys: string[] = []

  constructor(device: Device, options: ShaderProgramOptions= {}) {
    this.device = device
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

    if (!this.handle || !this.device.context.isProgram(this.handle)) {
      this.handle = this.device.context.createProgram()
    }
    this.link()

    const inspection = ShaderInspector.inspectProgram(this.vertexShader.source, this.fragmentShader.source)
    this.assignAttributes(inspection.attributes)
    this.assignUniforms(inspection.uniforms)
  }

  /**
   * Releases the program handle
   */
  public destroy(): this {
    if (this.device.context.isProgram(this.handle)) {
      this.device.context.deleteProgram(this.handle)
      this.handle = null
    }
    return this
  }

  /**
   * Sets this program as the current program on the graphics device
   */
  public use(): this {
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
  private attach(): this {
    const attached = this.attached as Shader[]
    attached.length = 0
    if (this.vertexShader) {
      this.device.context.attachShader(this.handle, this.vertexShader.handle)
      attached.push(this.vertexShader)
    }
    if (this.fragmentShader) {
      this.device.context.attachShader(this.handle, this.fragmentShader.handle)
      attached.push(this.fragmentShader)
    }
    return this
  }

  /**
   * Detaches all shaders
   */
  private detach(): this {
    for (let shader of this.attached) {
      this.device.context.detachShader(this.handle, shader.handle)
    }
    const attached = this.attached as Shader[]
    attached.length = 0
    return this
  }

  /**
   *
   */
  private assignAttributes(attributes: { [key: string]: ShaderObjectMeta }): this {
    this.use()
    this.attributes.clear()
    this.attributeLocations.length = 0
    Object.keys(attributes).forEach((key) => {
      const location = this.device.context.getAttribLocation(this.handle, attributes[key].name || key)
      if (location >= 0) {
        this.attributes.set(key, {
          ...attributes[key],
          location: location,
        })
        this.attributeLocations.push(location)
      }
    })
    this.attributeKeys = Array.from(this.attributes.keys())
    return this
  }

  /**
   *
   */
  private assignUniforms(uniforms: { [key: string]: ShaderObjectMeta }): this {
    this.use()
    const u = this.uniforms as Map<string, ShaderUniform>
    u.clear()
    Object.keys(uniforms).forEach((key) => {
      const options = uniforms[key]
      if (!options.name && !options.binding) {
        return
      }
      const uniform = new ShaderUniform(this, options)
      if (uniform.location != null) {
        u.set(key, uniform)
        Log.i(`ShaderProgram ${this.uid.substr(0, 8)}... binds uniform '${uniform.meta.name}' to '${uniform.name}'`)
      }
    })
    this.uniformKeys = Array.from(u.keys())
    return this
  }

  /**
   *
   */
  public link(): this {
    this.detach()
    this.attach()

    this.device.context.linkProgram(this.handle)
    this.linked = this.device.context.getProgramParameter(this.handle, this.device.context.LINK_STATUS)
    this.info = this.device.context.getProgramInfoLog(this.handle)

    if (!this.linked) {
      Log.e('ShaderProgram#link failed', this.info)
    }
    return this
  }

  /**
   * Sets multiple uniform values.
   *
   * @remarks
   * Takes only known uniform names into account and ignores `null` values
   */
  public setUniforms(uniforms?: { [key: string]: ShaderUniformParameter }): this {
    if (!uniforms) { return this }
    this.use()
    for (const key of this.uniformKeys) {
      if (key in uniforms && uniforms[key] != null) {
        this.uniforms.get(key).set(uniforms[key])
      }
    }
    return this
  }

  /**
   * Sets a value on the named uniform
   *
   * @remarks
   * `null` values are ignored
   */
  public setUniform(name: string, value: ShaderUniformParameter): this {
    if (value == null) { return }
    const uniform = this.uniforms.get(name)
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
