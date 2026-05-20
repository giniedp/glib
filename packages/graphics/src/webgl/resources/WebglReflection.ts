import { ShaderAnnotations } from '../../shader'
import {
  GlslMember,
  reflectGlslComponent,
  type GlslShaderInfo,
  type GlslTypeSampler,
  type GlslValueType,
} from '../glsl'
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
  readonly block: string
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
    blocks: reflectBlocks(gl, resource, uniforms),
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
      alias: reflect.annotations[ShaderAnnotations.Alias],
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
  program: WebGLProgram,
  uniforms: GlslMember[],
): WebglReflectUniform[] {
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  const blockIndices: number[] = gl.getActiveUniforms(
    program,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_BLOCK_INDEX,
  )
  const blockOffsets: number[] = gl.getActiveUniforms(
    program,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_OFFSET,
  )
  const arrayStrides: number[] = gl.getActiveUniforms(
    program,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_ARRAY_STRIDE,
  )
  const matrixStrides: number[] = gl.getActiveUniforms(
    program,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_MATRIX_STRIDE,
  )

  let textureUnitIndex = 1 // program.textureUnitBase
  const result: WebglReflectUniform[] = []
  for (let i = 0; i < uniformCount; ++i) {
    const info = gl.getActiveUniform(program, i)
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

function reflectBlocks(
  gl: WebGL2RenderingContext,
  resource: WebGLProgram,
  uniforms: GlslMember[],
): WebglReflectBlock[] {
  const uniformCount = gl.getProgramParameter(resource, gl.ACTIVE_UNIFORMS)
  const blockIndices: number[] = gl.getActiveUniforms(
    resource,
    Array.from(Array(uniformCount).keys()),
    gl.UNIFORM_BLOCK_INDEX,
  )
  return Array.from(new Set(blockIndices))
    .filter((index) => index >= 0)
    .map((index): WebglReflectBlock => {
      const blockName = gl.getActiveUniformBlockName(resource, index)
      const member = uniforms.find((it) => it.name === blockName)
      const aliasName = member?.annotations[ShaderAnnotations.Block]
      return {
        name: blockName,
        block: aliasName || blockName,
        index,
        size: gl.getActiveUniformBlockParameter(resource, index, gl.UNIFORM_BLOCK_DATA_SIZE),
      }
    })
}

function resolveAliasName(namePath: string, glsl: GlslMember[]): string {
  const result: string[] = []
  const tokens = namePath.split(/[.[\]]/)
  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i]
    if (token === '') {
      continue
    }

    if (token.match(/^\d+$/)) {
      const index = parseInt(token, 10)
      result.push(`[${index}]`)
      continue
    }

    const member = glsl.find((it) => it.name === token)
    if (!member) {
      console.warn(`Failed to resolve uniform ${namePath} (${token}) in GLSL reflection\n`)
      console.log(glsl.map((it) => it.name))
      return namePath
    }
    if (result.length && !result[result.length - 1].endsWith(']')) {
      result.push('.')
    }

    const alias = member.annotations[ShaderAnnotations.Alias]

    if (i === 0) {
      // @block annotation is only applied to root level members

      const block = member.annotations[ShaderAnnotations.Block]

      switch (member.container) {
        // samplers are guaranteed not nested
        // artificially placed int oa block with @block annotation
        case 'sampler': {
          if (block) {
            return `${block}.${alias || token}`
          }
          return alias || token
        }

        // root level structs and buffers only support @block annotation
        case 'interface':
        case 'struct': {
          result.push(block || member.name)
          break
        }

        //
        // @block foo
        // uniform vec4 u_color; -> foo.u_color
        //
        // @block foo
        // @alias color
        // uniform vec4 u_color; -> foo.color
        //
        default: {
          if (block) {
            result.push(`${block}.${alias || member.name}`)
          } else {
            result.push(alias || member.name)
          }
          break
        }
      }
    } else {
      result.push(alias || member.name)
    }

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
