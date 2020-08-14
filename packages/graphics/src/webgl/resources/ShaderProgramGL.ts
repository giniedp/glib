import { Log } from '@gglib/utils'
import { ShaderType, valueOfDataType } from '../../enums'
import { Buffer, ShaderProgram, ShaderProgramOptions, ShaderUniform } from '../../resources'
import { ShaderInspector, ShaderObjectInfo } from '../../ShaderInspector'
import { DeviceGL } from '../DeviceGL'
import { ShaderGL } from './ShaderGL'
import { ShaderUniformGL } from './ShaderUniformGL'

/**
 * A wrapper class around {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram | WebGLProgram}
 *
 * @public
 * @remarks
 * Combines a vertex shader and a fragment shader into a shader program.
 *
 * On creation the shader source code is inspected for
 */
export class ShaderProgramGL extends ShaderProgram {

  /**
   * The graphics device
   */
  public readonly device: DeviceGL
  /**
   * The vertex shader
   */
  public readonly vertexShader: ShaderGL
  /**
   * The fragment shader
   */
  public readonly fragmentShader: ShaderGL

  /**
   * The web gl program handle
   */
  public readonly handle: WebGLProgram

  /**
   * A map of shader attributes
   */
  public readonly inputs = new Map<string, ShaderObjectInfo & { location: number }>()
  /**
   * Collection of all detected attribute locations
   */
  public readonly inputLocations: number[] = []
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

  /**
   * Collection of all attached shaders. Usually contains a single vertex and a single fragment shader
   */
  protected readonly attached: ReadonlyArray<ShaderGL> = []

  constructor(device: DeviceGL, options: ShaderProgramOptions = {}) {
    super()
    this.device = device
    this.vertexShader = this.getShader(ShaderType.VertexShader, options.vertexShader) as ShaderGL
    this.fragmentShader = this.getShader(ShaderType.FragmentShader, options.fragmentShader) as ShaderGL
    this.create()
    this.link()
  }

  // protected uniformKeys: string[] = []
  // protected inputKeys: string[] = []

  public create() {
    if (!this.handle || !this.device.context.isProgram(this.handle)) {
      (this as { handle: WebGLShader}).handle = this.device.context.createProgram()
    }
    return this
  }

  /**
   * Releases the program handle
   */
  public destroy(): this {
    if (this.device.context.isProgram(this.handle)) {
      this.device.context.deleteProgram(this.handle);
      (this as { handle: WebGLShader}).handle = null
    }
    return this
  }

  /**
   * Sets this program as the current program on the graphics device
   */
  public bind(): this {
    return this.device.program = this
  }

  /**
   * Attaches all shaders
   */
  private attach(): this {
    const attached = this.attached as ShaderGL[]
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
    const attached = this.attached as ShaderGL[]
    attached.length = 0
    return this
  }

  /**
   *
   */
  private assignInputs(inputs: { [key: string]: ShaderObjectInfo }): this {
    this.bind()
    this.inputs.clear()
    this.inputLocations.length = 0
    Object.keys(inputs).forEach((key) => {
      const input = inputs[key]
      // TODO: use input.layout.location
      const location = this.device.context.getAttribLocation(this.handle, input.name || key)
      if (location >= 0) {
        this.inputs.set(key, {
          ...input,
          location: location,
        })
        this.inputLocations.push(location)
      }
    })
    return this
  }

  /**
   *
   */
  private assignUniforms(uniforms: { [key: string]: ShaderObjectInfo }): this {
    this.bind()
    const u = this.uniforms as Map<string, ShaderUniform>
    u.clear()
    Object.keys(uniforms).forEach((key) => {
      const options = uniforms[key]
      if (!options.name && !options.binding) {
        return
      }
      const uniform = new ShaderUniformGL(this, options)
      if (uniform.location != null) {
        u.set(key, uniform)
        Log.debug(`binds uniform '${uniform.meta.name}' to '${uniform.name}'`)
      }
    })
    return this
  }

  /**
   *
   */
  public link(): this {
    this.detach()
    this.attach()

    Log.groupCollapsed(`[ShaderProgram] ${this.uid} link()`)

    const gl = this.device.context
    gl.linkProgram(this.handle)
    this.linked = gl.getProgramParameter(this.handle, gl.LINK_STATUS)
    this.info = gl.getProgramInfoLog(this.handle)

    if (!this.linked) {
      Log.error('failed', this.info)
    }

    const inspection = ShaderInspector.inspectProgram(this.vertexShader.source, this.fragmentShader.source)
    this.assignInputs(inspection.inputs)
    this.assignUniforms(inspection.uniforms)

    Log.groupEnd()
    return this
  }

  public bindAttribPointerAndLocation(vBuffer: Buffer | Buffer[]) {
    if (Array.isArray(vBuffer)) {
      this.inputs.forEach((attribute, name) => {
        for (const buffer of vBuffer) {
          const channel = buffer.layout[name]
          if (channel) {
            buffer.bind()
            this.device.context.vertexAttribPointer(
              attribute.location,
              channel.elements,
              valueOfDataType(channel.type),
              !!attribute.normalize || !!channel.normalize,
              buffer.stride,
              channel.offset,
            )
            this.device.context.enableVertexAttribArray(attribute.location)
            return
          }
        }
        // tslint:disable-next-line
        throw new Error(
          `VertexBuffer is not compatible with Program. Required attributes are '${Array.from(
            this.inputs.keys(),
          )}' but '${name}' is missing in vertex buffer.`,
        )
      })
    } else {
      this.inputs.forEach((attribute, name) => {
        const channel = vBuffer.layout[name]
        if (channel) {
          vBuffer.bind()
          this.device.context.vertexAttribPointer(
            attribute.location,
            channel.elements,
            valueOfDataType(channel.type),
            !!attribute.normalize || !!channel.normalize,
            vBuffer.stride,
            channel.offset,
          )
          this.device.context.enableVertexAttribArray(attribute.location)
          return
        }

        // tslint:disable-next-line
        throw new Error(
          `VertexBuffer is not compatible with Program. Required attributes are '${Array.from(
            this.inputs.keys(),
          )}' but '${name}' is missing in vertex buffer.`,
        )
      })
    }
    // enable attributes so that the vertex shader is actually able to use them
    // this.$vertexAttribArrayState.commit(program.attributeLocations)
  }
}
