import { dataTypeToWebGL } from '../../enums'
import { Buffer, ShaderProgram, ShaderProgramOptions, ShaderUniform } from '../../resources'

import { DeviceGL } from '../DeviceGL'
import { Glsl, GlslMemberInfo, GlslProgramInspection } from '../glsl'
import { isWebGL2, SharedResource } from '../utils'
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
export class ShaderProgramGL extends ShaderProgram implements SharedResource<string, WebGLProgram> {
  /**
   * The graphics device
   */
  public device: DeviceGL

  /**
   * The vertex shader
   */
  public vertexShader: ShaderGL

  /**
   * The fragment shader
   */
  public fragmentShader: ShaderGL

  /**
   * The web gl program handle
   */
  public resource: WebGLProgram

  /**
   *
   */
  public resourceKey: string

  /**
   *
   */
  public referenceCount: number = 1

  /**
   * A map of shader attributes
   */
  public inputs: Map<string, GlslMemberInfo & { location: number }> = new Map()

  /**
   * Resolved attribute layout
   *
   * @remarks
   * Used to determine the order of attributes in the vertex buffer and create a vertex array object.
   */
  public attributeLayout: string

  /**
   * A map of all shader uniforms
   */
  public uniforms: Map<string, ShaderUniform> = new Map()

  /**
   * Whether the program is successfully linked
   */
  public linked: boolean

  /**
   * The info log that is generated after linking the program
   */
  public info: string

  /**
   * A promise that resolves when the program has finished compiling
   *
   * @remarks
   * The program is considered ready when the compilation is finished. Yet the program may not be linked successfully.
   * The promise value indicates if the program is linked successfully.
   */
  public whenReady: Promise<boolean>

  /**
   * Indicates that the program is finished compiling
   *
   * @remarks
   * The program is considered ready when the compilation is finished. Yet the program may not be linked successfully.
   * Check the {@link linked} property to determine if the program is ready to use for rendering.
   */
  public get isReady(): boolean {
    return !this.isCompiling
  }

  /**
   * Collection of all attached shaders. Usually contains a single vertex and a single fragment shader
   */
  protected attached: ShaderGL[] = []
  protected isCompiling: boolean
  protected inspection: GlslProgramInspection
  private canParallelCompile: boolean

  constructor(device: DeviceGL, options: ShaderProgramOptions = {}) {
    super()
    this.device = device
    this.canParallelCompile = !!device.capabilities.extension('KHR_parallel_shader_compile')
    this.vertexShader = this.convertShaderSource('VertexShader', options.vertexShader) as ShaderGL
    this.fragmentShader = this.convertShaderSource('FragmentShader', options.fragmentShader) as ShaderGL
    this.create()
    this.link()
  }

  /**
   * Creates or recreates a `WebGLProgram` resources if needed
   */
  public create(): this {
    if (!this.resource || !this.device.context.isProgram(this.resource)) {
      this.resource = this.device.context.createProgram()
    }
    return this
  }

  /**
   * Releases the previously created `WebGLProgram` resource
   */
  public dispose(): this {
    this.referenceCount--
    if (this.referenceCount > 0) {
      return this
    }
    this.referenceCount = 0
    this.device.onProgramDisposed(this)
    if (this.device.context.isProgram(this.resource)) {
      this.device.context.deleteProgram(this.resource)
      this.resource = null
    }
    this.uniforms.forEach((u) => u.dispose())
    return this
  }

  /**
   * Sets this program as the current program on the graphics device
   */
  public bind(): this {
    this.device.program = this
    return this
  }

  /**
   * Attaches all shaders
   */
  private attach(): this {
    this.attached.length = 0
    this.isCompiling = true
    this.linked = false
    if (this.vertexShader) {
      this.device.context.attachShader(this.resource, this.vertexShader.resource)
      this.attached.push(this.vertexShader)
    }
    if (this.fragmentShader) {
      this.device.context.attachShader(this.resource, this.fragmentShader.resource)
      this.attached.push(this.fragmentShader)
    }
    this.whenReady = this.device.scheduler.add<boolean>((context) => {
      if (this.hasFinishedCompiling()) {
        this.onFinishedCompiling()
        this.isCompiling = false
        context.finish(this.linked)
      }
    })
    return this
  }

  /**
   * Detaches all shaders
   */
  private detach(): this {
    for (let shader of this.attached) {
      this.device.context.detachShader(this.resource, shader.resource)
    }
    this.attached.length = 0
    this.isCompiling = false
    return this
  }

  /**
   *
   */
  public link(): this {
    this.detach()
    this.attach()
    this.device.context.linkProgram(this.resource)
    return this
  }

  private hasFinishedCompiling(): boolean {
    let isCompiling = true
    if (this.canParallelCompile) {
      const gl = this.device.context
      const ext = this.device.capabilities.extension('KHR_parallel_shader_compile')
      isCompiling = !gl.getProgramParameter(this.resource, ext.COMPLETION_STATUS_KHR)
    } else {
      isCompiling = false
    }
    return !isCompiling
  }

  private onFinishedCompiling() {
    const gl = this.device.context
    this.linked = gl.getProgramParameter(this.resource, gl.LINK_STATUS)
    this.info = gl.getProgramInfoLog(this.resource)

    if (!this.linked) {
      console.warn('Program link failed', this.info)
      this.vertexShader?.status()
      this.fragmentShader?.status()
    } else {
      this.inspectProgram()
      this.assignRegisters()
      this.assignDefaults()
    }
  }

  private inspectProgram() {
    try {
      this.inspection = Glsl.inspectProgram(this.vertexShader.source, this.fragmentShader.source)
    } catch (e) {
      console.error('GLSL inspection failed', e)
    }
    this.inspectInputs()
    this.inspectUniforms()
  }

  private inspectInputs() {
    const meta = this.inspection?.inputs
    const gl = this.device.context
    const attributeCount = gl.getProgramParameter(this.resource, gl.ACTIVE_ATTRIBUTES)
    this.inputs.clear()

    for (let i = 0; i < attributeCount; ++i) {
      const info = gl.getActiveAttrib(this.resource, i)
      const location = gl.getAttribLocation(this.resource, info.name)

      this.inputs.set(info.name, {
        ...(meta?.[info.name] || {}),
        name: info.name,
        location: location,
        type: toTypeName(gl, info.type),
        size: info.size,
      })
    }
    this.attributeLayout = Array.from(this.inputs.keys()).join(',')
  }

  private inspectUniforms() {
    const gl = this.device.context
    const uniformCount = gl.getProgramParameter(this.resource, gl.ACTIVE_UNIFORMS)
    let blockIndices: Record<number, number> = {}
    let offsets: Record<number, number> = {}
    if (isWebGL2(gl)) {
      blockIndices = gl.getActiveUniforms(this.resource, Array.from(Array(uniformCount).keys()), gl.UNIFORM_BLOCK_INDEX)
      offsets = gl.getActiveUniforms(this.resource, Array.from(Array(uniformCount).keys()), gl.UNIFORM_OFFSET)
    }
    this.uniforms.clear()
    for (let i = 0; i < uniformCount; ++i) {
      // TODO:
      const block = blockIndices[i]
      const offset = offsets[i]
      const info = gl.getActiveUniform(this.resource, i)
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
          this.uniforms.set(
            name,
            new ShaderUniformGL(this, {
              ...(this.resolveUniformMetadata(name) || {}),
              name: name,
              type: toTypeName(gl, info.type),
              size: null,
            }),
          )
        }
      }
    }
  }

  private assignRegisters() {
    const usedRegisters: number[] = new Array(this.device.textureUnits.length).fill(null)
    for (const [_, uniform] of this.uniforms) {
      if (uniform.set !== uniform.setTexture || uniform.register == null) {
        usedRegisters[uniform.register] = uniform.register
      }
    }
    for (const [_, uniform] of this.uniforms) {
      if (uniform.set !== uniform.setTexture || uniform.register != null) {
        continue
      }
      for (let i = 0; i < usedRegisters.length; i++) {
        if (usedRegisters[i] != null) {
          continue
        }
        uniform.register = i
        usedRegisters[i] = i
        break
      }
    }
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

  public bindAttribPointerAndLocation(vBuffer: Buffer[]) {
    if (!this.isReady) {
      throw new Error('Program is not ready')
    }

    outer: for (const [name, attribute] of this.inputs) {
      for (const buffer of vBuffer) {
        const channel = buffer.layout[attribute.binding || name]
        if (channel) {
          buffer.bind()
          this.device.context.vertexAttribPointer(
            attribute.location,
            channel.elements,
            dataTypeToWebGL(channel.type),
            !!attribute.normalize || !!channel.normalize,
            buffer.stride,
            channel.offset,
          )
          this.device.context.enableVertexAttribArray(attribute.location)
          continue outer
        }
      }
      // tslint:disable-next-line
      throw new Error(
        [
          'VertexBuffer is not compatible with Program',
          `Required attributes: ${Array.from(this.inputs.keys())}`,
          `Available attributes: ${vBuffer.map((it) => Object.keys(it.layout))}`,
          `Missing attribute: ${name}`,
        ].join('\n'),
      )
    }
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
