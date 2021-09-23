import { Log } from '@gglib/utils'
import { ShaderType, valueOfDataType } from '../../enums'
import { Buffer, ShaderProgram, ShaderProgramOptions, ShaderUniform } from '../../resources'

import { DeviceGL } from '../DeviceGL'
import { Glsl, GlslMemberInfo, GlslProgramInspection } from '../glsl'
import { isWebGL2 } from '../utils'
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
  public readonly inputs: Map<string, GlslMemberInfo & { location: number }> = new Map()

  /**
   * A map of all shader uniforms
   */
  public readonly uniforms: Map<string, ShaderUniform> = new Map()

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
  protected inspection: GlslProgramInspection

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

  /**
   * Creates or recreates a `WebGLProgram` resources if needed
   */
  public create(): this {
    if (!this.handle || !this.device.context.isProgram(this.handle)) {
      (this as { handle: WebGLShader}).handle = this.device.context.createProgram()
    }
    return this
  }

  /**
   * Releases the previously created `WebGLProgram` resource
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

  private introspect() {
    try {
      this.inspection = Glsl.inspectProgram(this.vertexShader.source, this.fragmentShader.source)
    } catch (e) {
      console.error('GLSL inspection failed', e)
    }
    this.introspectInputs()
    this.introspecUniforms()
  }

  private introspectInputs() {
    const meta = this.inspection?.inputs
    const gl = this.device.context
    const attributeCount = gl.getProgramParameter(this.handle, gl.ACTIVE_ATTRIBUTES);
    this.inputs.clear()

    for (let i = 0; i < attributeCount; ++i) {
      const info = gl.getActiveAttrib(this.handle, i);
      const location = gl.getAttribLocation(this.handle, info.name)

      this.inputs.set(info.name, {
        ...(meta?.[info.name] || {}),
        name: info.name,
        location: location,
        type: toTypeName(gl, info.type),
        size: info.size
      })
    }
  }

  private introspecUniforms() {
    const gl = this.device.context
    const uniformCount = gl.getProgramParameter(this.handle, gl.ACTIVE_UNIFORMS);
    let blockIndices: Record<number, number> = {};
    let offsets: Record<number, number> = {};
    if (isWebGL2(gl)) {
      blockIndices = gl.getActiveUniforms(this.handle, Array.from(Array(uniformCount).keys()) , gl.UNIFORM_BLOCK_INDEX)
      offsets = gl.getActiveUniforms(this.handle, Array.from(Array(uniformCount).keys()) , gl.UNIFORM_OFFSET)
    }
    this.uniforms.clear()
    for (let i = 0; i < uniformCount; ++i) {
      // TODO:
      const block = blockIndices[i]
      const offset = offsets[i]
      const info = gl.getActiveUniform(this.handle, i);
      const uniform = new ShaderUniformGL(this, {
        ...(this.resolveUniformMetadata(info.name) || {}),
        name: info.name,
        type: toTypeName(gl, info.type),
        size: null,
      })
      this.uniforms.set(uniform.name, uniform)
      if (info.size > 1) {
        for (let i = 1; i < info.size; i++) {
          const name = info.name.replace(/\[0\]$/, `[${i}]`)
          this.uniforms.set(name, new ShaderUniformGL(this, {
            ...(this.resolveUniformMetadata(name) || {}),
            name: name,
            type: toTypeName(gl, info.type),
            size: null,
          }))
        }
      }
    }
  }

  private assignRegisters() {
    const registers: number[] = new Array(this.device.textureUnits.length).fill(null)
    this.uniforms.forEach((it) => {
      if (it.set !== it.setTexture || it.register == null) {
        return
      }
      registers[it.register] = it.register
    })
    this.uniforms.forEach((it) => {
      if (it.set !== it.setTexture || it.register != null) {
        return
      }
      for (let i = 0; i < registers.length; i++) {
        if (registers[i] == null) {
          it.register = i
          registers[i] = i
          return
        }
      }
    })
  }

  private assignDefaults() {
    this.bind()
    for (const u of Array.from(this.uniforms.values())) {
      if (u.defaultValue != null) {
        u.set(u.defaultValue)
      }
    }
  }

  private resolveUniformMetadata(name: string): GlslMemberInfo {
    return this.inspection?.uniforms?.[name]
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
    } else {
      this.introspect()
      this.assignRegisters()
      this.assignDefaults()
    }
    Log.info(this)
    Log.groupEnd()
    return this
  }

  public bindAttribPointerAndLocation(vBuffer: Buffer | Buffer[]) {
    if (Array.isArray(vBuffer)) {
      this.inputs.forEach((attribute, name) => {
        for (const buffer of vBuffer) {
          const channel = buffer.layout[attribute.binding || name]
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
        const channel = vBuffer.layout[attribute.binding || name]
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

const typeMap = new Map<number, string>()
function createTypeMap(gl: WebGL2RenderingContext) {
  typeMap.set(gl.FLOAT, 'float')
  typeMap.set(gl.FLOAT_VEC2, 'vec2')
  typeMap.set(gl.FLOAT_VEC3, 'vec3')
  typeMap.set(gl.FLOAT_VEC4, 'vec4')
  typeMap.set(gl.INT, 'int')
  typeMap.set(gl.INT_VEC2, 'ivec2')
  typeMap.set(gl.INT_VEC3, 'ivec3')
  typeMap.set(gl.INT_VEC4, 'ivec3')
  typeMap.set(gl.BOOL, 'bool')
  typeMap.set(gl.BOOL_VEC2, 'bvec2')
  typeMap.set(gl.BOOL_VEC3, 'bvec3')
  typeMap.set(gl.BOOL_VEC4, 'bvec4')
  typeMap.set(gl.FLOAT_MAT2, 'mat2')
  typeMap.set(gl.FLOAT_MAT3, 'mat3')
  typeMap.set(gl.FLOAT_MAT4, 'mat4')
  typeMap.set(gl.SAMPLER_2D, 'sampler2D')
  typeMap.set(gl.SAMPLER_CUBE, 'samplerCube')

  typeMap.set(gl.UNSIGNED_INT, 'uint')
  typeMap.set(gl.UNSIGNED_INT_VEC2, 'uvec2')
  typeMap.set(gl.UNSIGNED_INT_VEC3, 'uvec3')
  typeMap.set(gl.UNSIGNED_INT_VEC4, 'uvec4')
  typeMap.set(gl.FLOAT_MAT2x3, 'mat2x3')
  typeMap.set(gl.FLOAT_MAT2x4, 'mat2x4')
  typeMap.set(gl.FLOAT_MAT3x2, 'mat3x2')
  typeMap.set(gl.FLOAT_MAT3x4, 'mat3x4')
  typeMap.set(gl.FLOAT_MAT4x2, 'mat4x2')
  typeMap.set(gl.FLOAT_MAT4x3, 'mat4x3')
  typeMap.set(gl.SAMPLER_3D, 'sampler3D')
  typeMap.set(gl.SAMPLER_2D_SHADOW, 'sampler2DShadow')
  typeMap.set(gl.SAMPLER_2D_ARRAY, 'sampler2DArray')
  typeMap.set(gl.SAMPLER_2D_ARRAY_SHADOW, 'sampler2DArrayShadow')
  typeMap.set(gl.SAMPLER_CUBE_SHADOW, 'samplerCubeShadow')
  typeMap.set(gl.INT_SAMPLER_2D, 'isampler2D')
  typeMap.set(gl.INT_SAMPLER_3D, 'isampler3D')
  typeMap.set(gl.INT_SAMPLER_CUBE, 'isamplerCube')
  typeMap.set(gl.INT_SAMPLER_2D_ARRAY, 'isampler2DArray')
  typeMap.set(gl.UNSIGNED_INT_SAMPLER_2D, 'usampler2D')
  typeMap.set(gl.UNSIGNED_INT_SAMPLER_3D, 'usampler3D')
  typeMap.set(gl.UNSIGNED_INT_SAMPLER_CUBE, 'usamplerCube')
  typeMap.set(gl.UNSIGNED_INT_SAMPLER_2D_ARRAY, 'usampler2DArray')
}
function toTypeName(gl: WebGLRenderingContext | WebGL2RenderingContext, type: GLint): string {
  if (typeMap.size === 0) {
    createTypeMap(gl as WebGL2RenderingContext)
  }
  return typeMap.get(type)
}
