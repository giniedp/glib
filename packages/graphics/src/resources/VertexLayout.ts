import {
  DataElementFormat,
  dataElementSize,
  dataTypeToSize,
  GpuDataType,
  VertexType,
  vertexTypeFormat,
  vertexTypeSize,
} from '../enums'
import { bufferField, bufferLayout } from './BufferLayout'

export type VertexSemantic =
  | 'position'
  | 'normal'
  | 'tangent'
  | 'bitangent'
  | 'color'
  | 'texture'
  | 'blendindices'
  | 'blendweight'

export interface VertexLayout {
  [key: string]: VertexAttribute
}

export interface VertexFormat {
  /**
   * The vertex type how it will be passed to GPU
   */
  type: VertexType
  /**
   * The type being used on the CPU side for writing the buffer
   */
  cpu?: VertexType
}

export interface VertexAttribute extends VertexFormat {
  byteOffset: number
}

export function elementGpuFormat(f: VertexFormat): DataElementFormat {
  return vertexTypeFormat(f.type)
}

export function elementCpuFormat(f: VertexFormat): DataElementFormat {
  return vertexTypeFormat(f.cpu || f.type)
}

export const VertexPreset = {
  /**
   * 3 x float32
   */
  position: { type: 'float32x3' },
  /**
   * 4 x uint8, normalized and packed
   */
  color: { type: 'unorm8x4', cpu: 'uint32' },
  /**
   * 3 x float32
   */
  normal: { type: 'float32x3' },
  /**
   * 3 x float32
   */
  tangent: { type: 'float32x3' },
  /**
   * 3 x float32
   */
  bitangent: { type: 'float32x3' },
  /**
   * 2 x float32
   */
  texture: { type: 'float32x2' },
  /**
   * 4 x uint8
   */
  blendindices: { type: 'uint8x4' },
  /**
   * 4 x uint8, normalized
   */
  blendweight: { type: 'unorm8x4' },
} satisfies Record<string, VertexFormat>

export function vertexLayout(attributes: Record<string, VertexType | VertexFormat>): VertexLayout
export function vertexLayout(names: VertexSemantic[]): VertexLayout
export function vertexLayout(spec: VertexSemantic[] | Record<string, VertexType | VertexFormat>): VertexLayout {
  if (!Array.isArray(spec)) {
    const result: VertexLayout = {}
    let offset = 0
    for (const [name, value] of Object.entries(spec)) {
      result[name] = {
        byteOffset: offset,
        type: null,
      }
      if (typeof value === 'string') {
        result[name].type = value
        offset += vertexTypeSize(value)
      } else {
        result[name].type = value.type
        result[name].cpu = value.cpu
        offset += vertexTypeSize(value.type)
      }
    }
    return result
  }

  const result: VertexLayout = {}
  let offset = 0

  for (let name of spec) {
    name = name.toLowerCase() as VertexSemantic
    const attribute = vertexAttribute(name, { byteOffset: offset })
    if (attribute) {
      result[name] = attribute
      offset += vertexTypeSize(attribute.type)
    } else {
      throw new Error(`unknown vertex attribute semantic '${name}'`)
    }
  }

  return result
}

/**
 * Gets a vertex attribute specification for given attribute semantic
 *
 * @remarks
 * Uses {@link VertexLayout.Common} to lookup a common specification for given semantic name.
 *
 * The semantic name is stripped down to [a-z] characters. So `texture`, `texture1`, `texture_2`
 * are all treated as same semantic: `texture`
 *
 * @param semantic - the semantic name
 * @param overrides - used to enrich or override the result
 */
export function vertexAttribute(semantic: string, overrides?: Partial<VertexAttribute>): VertexAttribute {
  semantic = semantic.match(/[a-z]+/)[0]
  const preset = VertexPreset[semantic]
  if (!preset) {
    return null
  }
  if (overrides) {
    return {
      ...VertexPreset[semantic],
      ...overrides,
    }
  }
  return {
    ...VertexPreset[semantic],
  }
}

/**
 * Counts the number of elements in a single vertex.
 *
 * @remarks
 * For example if a layout has defined a `position` and a `normal`
 * (both with three elements) this will return 6.
 */
export function countElements(layout: VertexLayout, side: 'gpu' | 'cpu' = 'cpu'): number {
  let count = 0
  for (const key in layout) {
    count += (side === 'cpu' ? elementCpuFormat(layout[key]) : elementGpuFormat(layout[key])).elementCount
  }
  return count
}

/**
 * Counts the number of elements in a single vertex until the given attribute.
 */
export function countElementsBefore(layout: VertexLayout, semantic: string, side: 'gpu' | 'cpu' = 'cpu'): number {
  let count = 0
  const target = layout[semantic]
  for (const key in layout) {
    if (layout[key].byteOffset < target.byteOffset) {
      count += (side === 'cpu' ? elementCpuFormat(layout[key]) : elementGpuFormat(layout[key])).elementCount
    }
  }
  return count
}

/**
 * Counts the number of bytes in a single vertex.
 *
 * @remarks
 * For example if a layout has a `position` and a `normal` defined
 * both with three elements and each element is a float, this will return 24.
 */
export function vertexLayoutSize(layout: VertexLayout): number {
  let size = 0

  for (const key in layout) {
    const attr = layout[key]
    size = Math.max(size, attr.byteOffset + vertexTypeSize(attr.type))
  }
  return size
}
