import {
  GlslMember,
  reflectGlslComponent,
  reflectGlslShader,
  type GlslShaderInfo,
  type GlslTypeSampler,
  type GlslValueType,
} from '../glsl'
import { parseGlsl } from '../glsl/glsl-parse'
import type { WebglShaderModule } from './WebglShaderModule'

export interface WebglReflection {
  readonly inputs: ReadonlyArray<WeblReflectInput>
  readonly outputs: ReadonlyArray<WeblReflectOutput>
  readonly blocks: ReadonlyArray<WebglReflectBlock>
  readonly uniforms: ReadonlyArray<WebglReflectUniform>
}

export interface WeblReflectInput {
  readonly name: string
  readonly location: number
  readonly alias?: string
}

export interface WeblReflectOutput {
  readonly name: string
  readonly location: number
}

export interface WebglReflectUniform<T = GlslValueType | GlslTypeSampler> {
  readonly name: string
  readonly alias: string
  readonly type: T
  readonly arraySize: number
  readonly blockIndex: number
  readonly blockOffset: number
  readonly arrayStride: number
  readonly matrixStride: number
  readonly textureIndex: number
}

export interface WebglReflectBlock {
  readonly name: string
  readonly index: number
  readonly size: number
}

export function hasUniformBlock(info: WebglReflectUniform): info is WebglReflectUniform<GlslValueType> {
  return info.blockIndex >= 0
}

export function reflectProgram(program: WebglShaderModule): WebglReflection {
  const gl = program.device.context
  const resource = program.glHandle
  const vertexInfo = program.vertexShader.reflection
  const fragmentInfo = program.fragmentShader.reflection
  const uniforms = [...vertexInfo.uniforms, ...fragmentInfo.uniforms]
  return {
    inputs: reflectInputs(gl, resource, vertexInfo),
    outputs: reflectOutputs(gl, resource, fragmentInfo),
    blocks: reflectBlocks(gl, resource),
    uniforms: reflectUniforms(gl, resource, uniforms),
  }
}

function reflectInputs(gl: WebGL2RenderingContext, resource: WebGLProgram, shader: GlslShaderInfo): WeblReflectInput[] {
  const count: number = gl.getProgramParameter(resource, gl.ACTIVE_ATTRIBUTES)
  const result: WeblReflectInput[] = []
  for (let i = 0; i < count; ++i) {
    const info = gl.getActiveAttrib(resource, i)
    const location = gl.getAttribLocation(resource, info.name)
    const reflect = shader.inputs.find((it) => it.name === info.name)
    if (!reflect) {
      continue
    }
    result.push({
      name: info.name,
      location,
      alias: reflect.alias,
      // elementType: dataTypeFromWebGL(gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_TYPE)),
      // elementCount: gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_SIZE),
      // normalized: gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
    })
  }
  return result
}

function reflectOutputs(
  gl: WebGL2RenderingContext,
  resource: WebGLProgram,
  shader: GlslShaderInfo,
): WeblReflectOutput[] {
  const result: WeblReflectOutput[] = []
  for (const item of shader.outputs) {
    result.push({
      name: item.name,
      location: gl.getFragDataLocation(resource, item.name),
    })
  }
  return result
}

function reflectUniforms(
  gl: WebGL2RenderingContext,
  resource: WebGLProgram,
  uniforms: GlslMember[],
): WebglReflectUniform[] {
  const uniformCount = gl.getProgramParameter(resource, gl.ACTIVE_UNIFORMS)
  const blockIndices: number[] = gl.getActiveUniforms(
    resource,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_BLOCK_INDEX,
  )
  const blockOffsets: number[] = gl.getActiveUniforms(
    resource,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_OFFSET,
  )
  const arrayStrides: number[] = gl.getActiveUniforms(
    resource,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_ARRAY_STRIDE,
  )
  const matrixStrides: number[] = gl.getActiveUniforms(
    resource,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_MATRIX_STRIDE,
  )

  let textureUnitIndex = 1 // program.textureUnitBase
  const result: WebglReflectUniform[] = []
  for (let i = 0; i < uniformCount; ++i) {
    const info = gl.getActiveUniform(resource, i)
    const type = reflectGlslComponent(info.type)
    const isSampler = type.container === 'sampler'
    result.push({
      name: info.name,
      alias: resolveAliasName(info.name, uniforms),
      type: reflectGlslComponent(info.type),
      arraySize: info.size,
      blockIndex: blockIndices[i],
      blockOffset: blockOffsets[i],
      arrayStride: arrayStrides[i],
      matrixStride: matrixStrides[i],
      textureIndex: isSampler ? textureUnitIndex++ : -1,
    })
  }
  return result
}

function reflectBlocks(gl: WebGL2RenderingContext, resource: WebGLProgram): WebglReflectBlock[] {
  const uniformCount = gl.getProgramParameter(resource, gl.ACTIVE_UNIFORMS)
  const blockIndices: number[] = gl.getActiveUniforms(
    resource,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_BLOCK_INDEX,
  )
  return Array.from(new Set(blockIndices))
    .filter((index) => index >= 0)
    .map((index): WebglReflectBlock => {
      return {
        name: gl.getActiveUniformBlockName(resource, index),
        index,
        size: gl.getActiveUniformBlockParameter(resource, index, gl.UNIFORM_BLOCK_DATA_SIZE),
      }
    })
}

function resolveAliasName(name: string, glsl: GlslMember[]): string {
  const result: string[] = []
  for (const token of name.split(/[.[\]]/)) {
    if (token === '') {
      continue
    }
    if (token.match(/^\d+$/)) {
      const index = parseInt(token, 10)
      result.push(`[${index}]`)
      continue
    }

    let member = glsl.find((it) => it.name === token)
    if (!member) {
      console.warn(`Failed to resolve uniform ${name} in GLSL reflection`)
      return name
    }
    if (result.length && !result[result.length - 1].endsWith(']')) {
      result.push('.')
    }
    result.push(member.alias || member.name)

    if (member.container === 'struct' || member.container === 'interface') {
      glsl = member.member
      continue
    }
    if (member.container === 'array' && member.element.container === 'struct') {
      glsl = member.element.member
      continue
    }
    glsl = []
  }
  return result.join('')
}
