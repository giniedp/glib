import type { DataType } from '../../enums'
import { GLConst as gl } from '../../enums'
import { parseAnnotations, type Token } from '../../shader'

import type {
  GlslInterfaceDeclaration,
  GlslProgram,
  GlslStructDeclaration,
  GlslStructMember,
  GlslTypeSpecifier,
  GlslVariableDeclaration,
} from './glsl-ast'
import { isGlslInt, parseGlslInt } from './glsl-parse'

export interface GlslShaderInfo {
  inputs: GlslMember[]
  outputs: GlslMember[]
  uniforms: GlslMember[]
}

export type GlslMember = GlslType & {
  name: string
  annotations: Record<string, string>
}

export type GlslType =
  | GlslTypeScalar
  | GlslTypeVector
  | GlslTypeMatrix
  | GlslTypeArray<GlslType>
  | GlslTypeStruct
  | GlslTypeInterfaceBlock
  | GlslTypeSampler

export type GlslValueType = GlslTypeScalar | GlslTypeVector | GlslTypeMatrix

export interface GlslTypeScalar {
  container: 'scalar'
  componentCount: 1
  componentType: DataType
}

export interface GlslTypeVector {
  container: `vec${2 | 3 | 4}`
  componentCount: number
  componentType: DataType
}

export interface GlslTypeMatrix {
  container: `mat${2 | 3 | 4}x${2 | 3 | 4}`
  componentCount: number
  componentType: DataType
}

export interface GlslTypeArray<T extends GlslType> {
  container: 'array'
  elementCount: number
  element: T
}

export interface GlslTypeStruct {
  container: 'struct'
  member: GlslMember[]
}

export interface GlslTypeInterfaceBlock {
  container: 'interface'
  member: GlslMember[]
}

export interface GlslTypeSampler {
  container: 'sampler'
  componentType: DataType
  cube: boolean
  array: boolean
  dimension: number
}

export function reflectGlslShader(tokens: GlslProgram): GlslShaderInfo {
  const inputs: GlslMember[] = []
  const outputs: GlslMember[] = []
  const uniforms: GlslMember[] = []
  for (const token of tokens) {
    switch (token.kind) {
      case 'variable': {
        const member = resolveMember(tokens, token)
        const isUniform = token.qualifier?.includes('uniform')
        const isInput = token.qualifier?.includes('in') || token.qualifier?.includes('attribute')
        const isOutput = token.qualifier?.includes('out') || token.qualifier?.includes('varying')
        if (isInput) {
          inputs.push(member)
        } else if (isOutput) {
          outputs.push(member)
        } else if (isUniform) {
          uniforms.push(member)
        }
        break
      }
      case 'interface': {
        uniforms.push({
          name: token.name,
          annotations: parseAnnotations(token.comments) || {},
          // alias: parseAnnotations(token.comments)?.alias || token.instanceName || null,
          container: `interface`,
          member: token.member.map((member) => resolveMember(tokens, member)),
        })
        break
      }
    }
  }
  return {
    inputs,
    outputs,
    uniforms,
  }
}

function resolveMember(program: GlslProgram, token: GlslVariableDeclaration | GlslStructMember): GlslMember {
  const component = resolveComponent(program, token.type)
  if (!component) {
    return null
  }
  return {
    name: token.name,
    annotations: parseAnnotations(token.comments) || {},
    ...component,
  }
}

function scalar(elementType: DataType): GlslTypeScalar {
  return {
    container: 'scalar',
    componentCount: 1,
    componentType: elementType,
  }
}

function vector(elementType: DataType, elementCount: 2 | 3 | 4): GlslTypeVector {
  return {
    container: `vec${elementCount}`,
    componentType: elementType,
    componentCount: elementCount,
  }
}

function matrix(elementType: DataType, a: 2 | 3 | 4, b: 2 | 3 | 4): GlslTypeMatrix {
  return {
    container: `mat${a}x${b}`,
    componentType: elementType,
    componentCount: a * b,
  }
}

function sampler(name: string): GlslTypeSampler {
  let type: DataType
  if (name.startsWith('sampler')) {
    type = 'float32'
  } else if (name.startsWith('isampler')) {
    type = 'int32'
  } else if (name.startsWith('usampler')) {
    type = 'uint32'
  } else {
    return null
  }
  const result: GlslTypeSampler = {
    container: 'sampler',
    componentType: type,
    cube: name.includes('Cube'),
    array: name.includes('Array'),
    dimension: null,
  }
  const match = name.match(/sampler(\d)D/gi)
  if (match) {
    result.dimension = Number(match[1])
  }
  return result
}

const TYPES = {
  bool: scalar('int32'),
  int: scalar('int32'),
  uint: scalar('uint32'),
  float: scalar('float32'),
  vec2: vector('float32', 2),
  vec3: vector('float32', 3),
  vec4: vector('float32', 4),
  bvec2: vector('int32', 2),
  bvec3: vector('int32', 3),
  bvec4: vector('int32', 4),
  ivec2: vector('int32', 2),
  ivec3: vector('int32', 3),
  ivec4: vector('int32', 4),
  uvec2: vector('uint32', 2),
  uvec3: vector('uint32', 3),
  uvec4: vector('uint32', 4),
  mat2: matrix('float32', 2, 2),
  mat2x2: matrix('float32', 2, 2),
  mat2x3: matrix('float32', 2, 3),
  mat2x4: matrix('float32', 2, 4),
  mat3: matrix('float32', 3, 3),
  mat3x2: matrix('float32', 3, 2),
  mat3x3: matrix('float32', 3, 3),
  mat3x4: matrix('float32', 3, 4),
  mat4: matrix('float32', 4, 4),
  mat4x2: matrix('float32', 4, 2),
  mat4x3: matrix('float32', 4, 3),
  mat4x4: matrix('float32', 4, 4),
}

function resolveComponent(program: GlslProgram, type: GlslTypeSpecifier): GlslType | null {
  if (!type) {
    return null
  }
  if (type.name in TYPES) {
    let component: GlslType = {
      ...TYPES[type.name as keyof typeof TYPES],
    }
    if (!type.arraySize?.length) {
      return component
    }

    for (const arraySize of [...type.arraySize].reverse()) {
      component = {
        container: 'array',
        element: component,
        elementCount: resolveConstIntExpression(arraySize),
      }
    }
    return component
  }
  if (type.name.startsWith('sampler') || type.name.startsWith('isampler') || type.name.startsWith('usampler')) {
    return sampler(type.name)
  }
  const structType = lookupStruct(program, type.name)
  if (structType) {
    return {
      container: 'struct',
      member: structType.member.map((member) => resolveMember(program, member)),
    }
  }
  const interfaceType = lookupInterface(program, type.name)
  if (interfaceType) {
    return {
      container: 'interface',
      member: interfaceType.member.map((member) => resolveMember(program, member)),
    }
  }
  return null
}

function resolveConstIntExpression(token: Token): number | null {
  const expression = token.value
  if (isGlslInt(expression)) {
    return parseGlslInt(expression)
  }
  return null
}

function lookupStruct(program: GlslProgram, typeName: string): GlslStructDeclaration | null {
  for (const token of program) {
    if (token.kind === 'struct' && token.name === typeName) {
      return token
    }
  }
  return null
}

function lookupInterface(program: GlslProgram, typeName: string): GlslInterfaceDeclaration | null {
  for (const token of program) {
    if (token.kind === 'interface' && token.name === typeName) {
      return token
    }
  }
  return null
}

const VALUE_COMPONENTS: Record<number, GlslValueType> = {
  [gl.FLOAT]: scalar('float32'),
  [gl.BOOL]: scalar('int32'),
  [gl.INT]: scalar('int32'),
  [gl.UNSIGNED_INT]: scalar('uint32'),

  [gl.FLOAT_VEC2]: vector('float32', 2),
  [gl.FLOAT_VEC3]: vector('float32', 3),
  [gl.FLOAT_VEC4]: vector('float32', 4),
  [gl.INT_VEC2]: vector('int32', 2),
  [gl.INT_VEC3]: vector('int32', 3),
  [gl.INT_VEC4]: vector('int32', 4),
  [gl.BOOL_VEC2]: vector('int32', 2),
  [gl.BOOL_VEC3]: vector('int32', 3),
  [gl.BOOL_VEC4]: vector('int32', 4),
  [gl.UNSIGNED_INT_VEC2]: vector('uint32', 2),
  [gl.UNSIGNED_INT_VEC3]: vector('uint32', 3),
  [gl.UNSIGNED_INT_VEC4]: vector('uint32', 4),

  [gl.FLOAT_MAT2]: matrix('float32', 2, 2),
  [gl.FLOAT_MAT3]: matrix('float32', 3, 3),
  [gl.FLOAT_MAT4]: matrix('float32', 4, 4),
  [gl.FLOAT_MAT2x3]: matrix('float32', 2, 3),
  [gl.FLOAT_MAT2x4]: matrix('float32', 2, 4),
  [gl.FLOAT_MAT3x2]: matrix('float32', 3, 2),
  [gl.FLOAT_MAT3x4]: matrix('float32', 3, 4),
  [gl.FLOAT_MAT4x2]: matrix('float32', 4, 2),
  [gl.FLOAT_MAT4x3]: matrix('float32', 4, 3),
}

const SAMPLER_COMPONENTS: Record<number, GlslTypeSampler> = {
  [gl.SAMPLER_2D]: sampler('sampler2D'),
  [gl.SAMPLER_CUBE]: sampler('samplerCube'),
  [gl.SAMPLER_3D]: sampler('sampler3D'),
  [gl.SAMPLER_2D_SHADOW]: sampler('sampler2DShadow'),
  [gl.SAMPLER_2D_ARRAY]: sampler('sampler2DArray'),
  [gl.SAMPLER_2D_ARRAY_SHADOW]: sampler('sampler2DArrayShadow'),
  [gl.SAMPLER_CUBE_SHADOW]: sampler('samplerCubeShadow'),
  [gl.INT_SAMPLER_2D]: sampler('isampler2D'),
  [gl.INT_SAMPLER_3D]: sampler('isampler3D'),
  [gl.INT_SAMPLER_CUBE]: sampler('isamplerCube'),
  [gl.INT_SAMPLER_2D_ARRAY]: sampler('isampler2DArray'),
  [gl.UNSIGNED_INT_SAMPLER_2D]: sampler('usampler2D'),
  [gl.UNSIGNED_INT_SAMPLER_3D]: sampler('usampler3D'),
  [gl.UNSIGNED_INT_SAMPLER_CUBE]: sampler('usamplerCube'),
  [gl.UNSIGNED_INT_SAMPLER_2D_ARRAY]: sampler('usampler2DArray'),
}

export function reflectGlslValueComponent(glType: number): GlslValueType {
  if (glType in VALUE_COMPONENTS) {
    return VALUE_COMPONENTS[glType]
  }
  return null
}

export function reflectGlslComponent(glType: number): GlslValueType | GlslTypeSampler {
  if (glType in VALUE_COMPONENTS) {
    return VALUE_COMPONENTS[glType]
  }
  if (glType in SAMPLER_COMPONENTS) {
    return SAMPLER_COMPONENTS[glType]
  }
  return null
}

export function glslComponentCount(type: GlslValueType, arraySize: number) {
  let count: number
  switch (type.container) {
    case 'scalar': {
      count = 1
      break
    }
    case 'vec2':
    case 'vec3':
    case 'vec4':
    case 'mat2x2':
    case 'mat3x3':
    case 'mat4x4':
    case 'mat2x3':
    case 'mat2x4':
    case 'mat3x2':
    case 'mat3x4':
    case 'mat4x2':
    case 'mat4x3': {
      count = type.componentCount
      break
    }
  }
  if (arraySize > 0) {
    count = count * arraySize
  }
  return count
}

export type GlslUploadFunction = (location: WebGLUniformLocation, value: number[]) => void
export function glslUploadFunction(
  type: GlslValueType | GlslTypeSampler,
  gl: WebGL2RenderingContext,
): GlslUploadFunction {
  switch (type.container) {
    case 'sampler': {
      return (location: WebGLUniformLocation, value: number[]) => {
        gl.uniform1i(location, value[0])
      }
    }
    case 'scalar':
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform1fv(location, value)
          }
        case 'int32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform1iv(location, value)
          }
        case 'uint32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform1uiv(location, value)
          }
      }
      break
    case 'vec2': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform2fv(location, value)
          }
        case 'int32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform2iv(location, value)
          }
        case 'uint32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform2uiv(location, value)
          }
      }
      break
    }
    case 'vec3': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform3fv(location, value)
          }
        case 'int32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform3iv(location, value)
          }
        case 'uint32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform3uiv(location, value)
          }
      }
      break
    }
    case 'vec4': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform4fv(location, value)
          }
        case 'int32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform4iv(location, value)
          }
        case 'uint32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniform4uiv(location, value)
          }
      }
      break
    }
    case 'mat2x2': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix2fv(location, false, value)
          }
      }
      break
    }
    case 'mat3x3': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix3fv(location, false, value)
          }
      }
      break
    }
    case 'mat4x4': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix4fv(location, false, value)
          }
      }
      break
    }
    case 'mat2x3': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix2x3fv(location, false, value)
          }
      }
      break
    }
    case 'mat2x4': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix2x4fv(location, false, value)
          }
      }
      break
    }
    case 'mat3x2': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix3x2fv(location, false, value)
          }
      }
      break
    }
    case 'mat3x4': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix3x4fv(location, false, value)
          }
      }
      break
    }
    case 'mat4x2': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix4x2fv(location, false, value)
          }
      }
      break
    }
    case 'mat4x3': {
      switch (type.componentType) {
        case 'float32':
          return (location: WebGLUniformLocation, value: number[]) => {
            gl.uniformMatrix4x3fv(location, false, value)
          }
      }
      break
    }
  }
  return (_location: WebGLUniformLocation, _value: number[]) => {
    throw new Error('not supported')
  }
}
