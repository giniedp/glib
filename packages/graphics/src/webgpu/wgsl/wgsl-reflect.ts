import type { DataType } from '../../enums'
import type { ProgramInputType } from '../../resources'

import { parseAnnotations, TokenReader } from '../../shader'

import type {
  WgslAttribute,
  WgslConstant,
  WgslFunctionParam,
  WgslFunctionReturnType,
  WgslProgram,
  WgslStruct,
  WgslStructMember,
  WgslTypeReference,
  WgslVariable,
} from './wgsl-ast'
import { getWgslTemplateParameter, isWgslInt, parseWgslInt, readWgslTypeReference } from './wgsl-parse'

export type WgslShaderStage = 'vertex' | 'fragment' | 'compute'
export class WgslProgramInfo {
  entryPoints: WgslEntryPointInfo[]
  resources: WgslResourceInfo[]
}

export class WgslEntryPointInfo {
  stage: WgslShaderStage
  name: string
  inputs: WgslInputInfo[]
  outputs: WgslOutputInfo[]
}

export interface WgslResourceFootprintInfo {
  /**
   * Offset in bytes from beginning of buffer
   */
  offset: number
  /**
   * Size in bytes
   */
  size: number
  /**
   * Memory alignment contraint
   */
  align: number
}

export interface WgslResourceTypeInfo {
  /**
   * The container type of the uniform e.g. `scalar`, `array`, `vec3`, `mat4
   */
  container: ProgramInputType
  /**
   * The container type of the leaf element if the uniform is an array
   */
  elementContainer: ProgramInputType
  elementStride: number

  /**
   * The number of elements if the uniform is an array, vector or matrix
   */
  elementCount: number
  /**
   * The type of the uniform or element if the uniform is an array, vector or matrix
   */
  elementType: DataType
}

export interface WgslTextureInfo {
  external: boolean
  multisample: boolean
  dimension: number
  storage: boolean
  array: boolean
  depth: boolean
  cube: boolean
}

export interface WgslSamplerInfo {
  comparison: boolean
}

export interface WgslResourceInfo extends WgslResourceTypeInfo, WgslResourceFootprintInfo {
  /**
   * The original name as it appears in the shader source code
   */
  name: string
  /**
   * An alias name by which this resource should be accessible in the javascript world
   *
   * @remarks
   * Semantics can be added via comments in the shader source code, for example:
   *
   * glsl
   * ```
   * // @ semantic lightDirection
   * uniform vec3 uLightDirection;
   * ```
   *
   * wgsl
   * ```
   * // @ semantic lightDirection
   * var<uniform> uLightDirection: vec3<f32>;
   * ```
   */
  alias: string
  /**
   * The binding group index of the uniform (wgsl only)
   */
  group: number
  /**
   * The binding index of the uniform
   */
  binding: number
  /**
   * The unique ID of the vertex attribute location
   */
  location: number
  /**
   * List of Structure members
   */
  members: WgslResourceInfo[]
  /**
   * Texture info
   */
  texture?: WgslTextureInfo
  sampler?: WgslSamplerInfo
  isUniform: boolean
  isStorage: boolean
  isReadWrite: boolean
}

export interface WgslInputInfo extends WgslResourceTypeInfo {
  /**
   * The original name as it appears in the shader source code
   */
  name: string
  /**
   * An alias name by which the uniform will be accessible in the javascript world
   */
  alias: string
  /**
   * The unique ID of the vertex attribute location
   */
  location: number
}

export interface WgslOutputInfo extends WgslResourceTypeInfo {
  /**
   * An alias name by which the uniform will be accessible in the javascript world
   */
  alias: string
  /**
   * The unique ID of the vertex attribute location
   */
  location: number
}

export function reflectWgsl(program: WgslProgram): WgslProgramInfo {
  const result: WgslProgramInfo = {
    entryPoints: [],
    resources: [],
  }
  for (const token of program) {
    switch (token.kind) {
      case 'var': {
        const resource = resolveResourceInfo(program, token)
        if (resource.binding >= 0) {
          result.resources.push(resource)
        }
        continue
      }
      case 'function': {
        const isVertex = !!token.attributes.find((it) => it.name === 'vertex')
        const isFragment = !!token.attributes.find((it) => it.name === 'fragment')
        const isCompute = !!token.attributes.find((it) => it.name === 'compute')
        if (isVertex || isFragment || isCompute) {
          result.entryPoints.push({
            name: token.name,
            stage: isVertex ? 'vertex' : isFragment ? 'fragment' : 'compute',
            inputs: resolveInputs(program, token.params),
            outputs: resolveOutputs(program, token.returns),
          })
        }
        continue
      }
    }
  }
  return result
}

function resolveInputs(program: WgslProgram, params: WgslFunctionParam[]) {
  const result: WgslInputInfo[] = []
  function collectLocations(info: WgslResourceInfo) {
    if (typeof info.location === 'number') {
      result.push({
        name: info.name,
        alias: info.alias,
        location: info.location,
        container: info.container,
        elementContainer: info.elementContainer,
        elementCount: info.elementCount,
        elementType: info.elementType,
        elementStride: info.elementStride,
      })
    }
    if (info.members) {
      for (const member of info.members) {
        collectLocations(member)
      }
    }
  }

  for (const param of params) {
    collectLocations(resolveResourceInfo(program, param))
  }
  return result
}

function resolveOutputs(program: WgslProgram, token: WgslFunctionReturnType) {
  const result: WgslOutputInfo[] = []
  if (!token) {
    return result
  }
  function collectLocations(info: WgslResourceInfo) {
    if (typeof info.location === 'number') {
      result.push({
        alias: info.alias,
        location: info.location,
        container: info.container,
        elementContainer: info.elementContainer,
        elementCount: info.elementCount,
        elementType: info.elementType,
        elementStride: info.elementStride,
      })
    }
    if (info.members) {
      for (const member of info.members) {
        collectLocations(member)
      }
    }
  }

  collectLocations(resolveResourceInfo(program, token))

  return result
}

function resolveAttribute(
  program: WgslProgram,
  name: 'location' | 'group' | 'binding' | 'size' | 'align',
  attributes: WgslAttribute[],
): number | null {
  const attribute = getAttribute(attributes, name)
  if (!attribute) {
    return null
  }
  const value = resolveConstIntExpression(program, attribute.params)
  if (value === null) {
    throw new Error(`Unable to resolve location expression: @${name}(${attribute.params})`)
  }
  return value
}

function resolveConstIntExpression(program: WgslProgram, expression: string): number | null {
  if (isWgslInt(expression)) {
    return parseWgslInt(expression)
  }
  const constant = getDeclaration(program, 'const', expression)
  return resolveConstInt(program, constant)
}

function resolveConstInt(program: WgslProgram, value: WgslConstant): number | null {
  if (!value) {
    return null
  }
  if (!value.initializer?.length) {
    return null
  }
  if (value.initializer.length === 1) {
    const token = value.initializer[0]
    if (token.type === 'integer') {
      return parseWgslInt(token.value)
    }
    if (token.type === 'identifier') {
      const refConst = getDeclaration(program, 'const', token.value)
      return resolveConstInt(program, refConst)
    }
    return null
  }
  return null
}

function getAttribute(list: WgslAttribute[], name: string) {
  if (!list) {
    return null
  }
  for (const it of list) {
    if (it.name === name) {
      return it
    }
  }
  return null
}

function getDeclaration<T extends WgslProgram[number], K extends T['kind'] = T['kind']>(
  program: WgslProgram,
  type: K,
  name: string,
): Extract<T, { kind: K }> {
  for (const item of program) {
    if (item.kind === type && item.name === name) {
      return item as any
    }
  }
  return null
}

const FOOTPRINTS = {
  f32: resourceInfo('scalar', 'float32', 1, 4, 4),
  f16: resourceInfo('scalar', 'float16', 1, 2, 2),
  i32: resourceInfo('scalar', 'int32', 1, 4, 4),
  u32: resourceInfo('scalar', 'uint32', 1, 4, 4),
  bool: resourceInfo('scalar', 'int32', 1, 4, 4),
  atomic: resourceInfo('scalar', 'int32', 1, 4, 4),
  vec2i: resourceInfo(`vec2`, 'int32', 2, 8, 8),
  vec3i: resourceInfo(`vec3`, 'int32', 3, 16, 12),
  vec4i: resourceInfo(`vec4`, 'int32', 4, 16, 16),
  vec2u: resourceInfo(`vec2`, 'uint32', 2, 8, 8),
  vec3u: resourceInfo(`vec3`, 'uint32', 3, 16, 12),
  vec4u: resourceInfo(`vec4`, 'uint32', 4, 16, 16),
  vec2f: resourceInfo(`vec2`, 'float32', 2, 8, 8),
  vec3f: resourceInfo(`vec3`, 'float32', 3, 16, 12),
  vec4f: resourceInfo(`vec4`, 'float32', 4, 16, 16),
  vec2h: resourceInfo(`vec2`, 'float16', 2, 4, 4),
  vec3h: resourceInfo(`vec3`, 'float16', 3, 8, 6),
  vec4h: resourceInfo(`vec4`, 'float16', 4, 8, 8),
}

function resourceInfo(
  container: ProgramInputType,
  type: DataType,
  elements: number,
  align: number,
  size: number,
): WgslResourceTypeInfo & WgslResourceFootprintInfo {
  return {
    offset: 0,
    elementType: type,
    elementCount: elements,
    elementContainer: null,
    elementStride: null,
    container,
    align,
    size,
  }
}

function roundUp(align: number, size: number): number {
  return Math.ceil(size / align) * align
}

function sizeOfArray(type: WgslResourceFootprintInfo, count: number): number {
  return strideOf(type) * count
}

function strideOf(type: WgslResourceFootprintInfo): number {
  return roundUp(type.align, type.size)
}

function sizeOfMember(program: WgslProgram, member: WgslStructMember, memberType?: WgslResourceFootprintInfo) {
  memberType ||= resolveTypeInfo(program, member.type)
  return Math.max(resolveAttribute(program, 'size', member.attributes) || 0, memberType.size)
}

function alignOfMember(program: WgslProgram, member: WgslStructMember, memberType?: WgslResourceFootprintInfo) {
  memberType ||= resolveTypeInfo(program, member.type)
  return resolveAttribute(program, 'align', member.attributes) || memberType.align
}

function matrixInfo(
  cols: 2 | 3 | 4,
  rows: 2 | 3 | 4,
  type: DataType,
): WgslResourceTypeInfo & WgslResourceFootprintInfo {
  const elements = rows * cols
  let vecType: WgslResourceTypeInfo & WgslResourceFootprintInfo
  switch (type) {
    case 'int32':
      vecType = FOOTPRINTS[`vec${rows}i`]
      break
    case 'uint32':
      vecType = FOOTPRINTS[`vec${rows}u`]
      break
    case 'float32':
      vecType = FOOTPRINTS[`vec${rows}f`]
      break
    case 'float16':
      vecType = FOOTPRINTS[`vec${rows}h`]
      break
    default:
      throw new Error(`Unsupported matrix element type: ${type}`)
  }
  return {
    offset: 0,
    container: `mat${cols}x${rows}`,
    elementType: vecType.elementType,
    elementCount: elements,
    elementContainer: vecType.container,
    elementStride: roundUp(vecType.align, vecType.size),
    align: vecType.align,
    size: roundUp(vecType.align, vecType.size) * cols,
  }
}

function resolveResourceInfo(
  program: WgslProgram,
  token: WgslVariable | WgslStructMember | WgslFunctionReturnType,
): WgslResourceInfo {
  return {
    members: null,
    texture: null,
    sampler: null,
    isUniform: 'options' in token && token.options?.some((it) => it === 'uniform'),
    isStorage: 'options' in token && token.options?.some((it) => it === 'storage'),
    isReadWrite: 'options' in token && token.options?.some((it) => it === 'read_write'),
    name: 'name' in token ? token.name : null,
    alias: parseAnnotations(token.comments)?.alias || null,
    location: resolveAttribute(program, 'location', token.attributes),
    binding: resolveAttribute(program, 'binding', token.attributes),
    group: resolveAttribute(program, 'group', token.attributes),
    ...(resolveTypeInfo(program, token.type) || resourceInfo(null, null, null, null, null)),
  }
}

function resolveTypeInfo(
  program: WgslProgram,
  type: WgslTypeReference,
): WgslResourceTypeInfo & WgslResourceFootprintInfo {
  if (FOOTPRINTS[type.name]) {
    return { ...FOOTPRINTS[type.name] }
  }

  if (type.name.startsWith('vec')) {
    const typeParam = getWgslTemplateParameter(type.template, 0)
    const typeInfo = resolveTypeInfo(program, readWgslTypeReference(new TokenReader(typeParam)))
    if (!typeInfo) {
      throw new Error(`Unable to resolve vector element type for type: ${type.name}`)
    }
    switch (typeInfo.elementType) {
      case 'int32':
        return { ...FOOTPRINTS[`${type.name}i`] }
      case 'uint32':
        return { ...FOOTPRINTS[`${type.name}u`] }
      case 'float32':
        return { ...FOOTPRINTS[`${type.name}f`] }
      case 'float16':
        return { ...FOOTPRINTS[`${type.name}h`] }
      default:
        throw new Error(`Unsupported vector element type: ${typeInfo.elementType} for type: ${type.name}`)
    }
  }

  if (type.name.startsWith('mat')) {
    const match = type.name.match(/mat(\d)x(\d)([fh])?/)
    const cols = parseInt(match[1], 10) as 2 | 3 | 4
    const rows = parseInt(match[2], 10) as 2 | 3 | 4
    let dataType: DataType
    switch (match[3]) {
      case 'h': {
        dataType = 'float16'
        break
      }
      case 'f': {
        dataType = 'float32'
        break
      }
      default: {
        const typeParam = getWgslTemplateParameter(type.template, 0)
        const typeInfo = resolveTypeInfo(program, readWgslTypeReference(new TokenReader(typeParam)))
        if (!typeInfo) {
          throw new Error(`Unable to resolve matrix element type for type: ${type.name}`)
        }
        dataType = typeInfo.elementType
        break
      }
    }
    return matrixInfo(cols, rows, dataType)
  }

  if (type.name === 'array') {
    const typeParam = getWgslTemplateParameter(type.template, 0)
    const typeInfo = resolveTypeInfo(program, readWgslTypeReference(new TokenReader(typeParam)))
    if (!typeInfo) {
      throw new Error(`Unable to resolve array element type for type: ${type.name}`)
    }

    const countParam = getWgslTemplateParameter(type.template, 1)
    if (!countParam[0]) {
      throw new Error(`Missing array element count parameter for type: ${type.name}`)
    }
    const count = resolveConstIntExpression(program, countParam[0].value)
    if (count == null) {
      throw new Error(`Unable to resolve array element count for type: ${type.name}`)
    }

    return {
      ...typeInfo,
      container: 'array',
      elementCount: typeInfo.elementCount * count,
      elementContainer: typeInfo.container === 'array' ? typeInfo.elementContainer : typeInfo.container,
      elementStride: strideOf(typeInfo),
      size: sizeOfArray(typeInfo, count),
    }
  }

  if (type.name.startsWith('texture')) {
    return textureInfo(program, type)
  }

  if (type.name.startsWith('sampler')) {
    return samplerInfo(program, type)
  }

  const aliasType = lookupAlias(program, type.name)
  if (aliasType) {
    return resolveTypeInfo(program, aliasType)
  }
  const structType = lookupStruct(program, type.name)
  if (structType) {
    return structInfo(program, structType)
  }
  return null
}

function textureInfo(
  program: WgslProgram,
  type: WgslTypeReference,
): WgslResourceTypeInfo & WgslResourceFootprintInfo & { texture: WgslTextureInfo } {
  const typeParam = getWgslTemplateParameter(type.template, 0)
  let typeInfo = resourceInfo(null, null, null, null, null)
  if (typeParam) {
    typeInfo = resolveTypeInfo(program, readWgslTypeReference(new TokenReader(typeParam)))
  }
  const texture: WgslTextureInfo = {
    array: type.name.includes('array'),
    cube: type.name.includes('cube'),
    depth: type.name.includes('depth'),
    external: type.name.includes('external'),
    multisample: type.name.includes('multisampled'),
    dimension: null,
    storage: type.name.includes('storage'),
  }
  const match = type.name.match(/_(\d)d/)
  if (match) {
    texture.dimension = Number(match[1])
  }
  if (texture.storage) {
    texture.dimension = 2
  }
  return {
    ...typeInfo,
    container: 'texture',
    texture,
  }
}

function samplerInfo(
  _: WgslProgram,
  type: WgslTypeReference,
): WgslResourceTypeInfo & WgslResourceFootprintInfo & { sampler: WgslSamplerInfo } {
  const typeInfo = resourceInfo(null, null, null, null, null)
  return {
    ...typeInfo,
    container: 'sampler',
    sampler: {
      comparison: type.name.includes('comparison'),
    },
  }
}

function structInfo(
  program: WgslProgram,
  struct: WgslStruct,
): WgslResourceTypeInfo & WgslResourceFootprintInfo & { members: WgslResourceInfo[] } {
  let align = 0
  let offset = 0
  const members: WgslResourceInfo[] = []
  for (const member of struct.member) {
    const memberInfo = resolveResourceInfo(program, member)

    memberInfo.size = sizeOfMember(program, member, memberInfo)
    memberInfo.align = alignOfMember(program, member, memberInfo)

    offset = roundUp(memberInfo.align, offset)
    memberInfo.offset = offset
    members.push(memberInfo)

    align = Math.max(align, memberInfo.align)
    offset += memberInfo.size
  }
  const size = roundUp(align, offset)
  return {
    offset: 0,
    align,
    size,
    container: 'array',
    elementType: 'uint8',
    elementCount: size,
    elementContainer: null,
    elementStride: null,
    members,
  }
}

function lookupAlias(program: WgslProgram, typeName: string): WgslTypeReference | null {
  for (const token of program) {
    if (token.kind === 'alias' && token.name === typeName) {
      return token.type
    }
  }
  return null
}

function lookupStruct(program: WgslProgram, typeName: string): WgslStruct | null {
  for (const token of program) {
    if (token.kind === 'struct' && token.name === typeName) {
      return token
    }
  }
  return null
}
