import { dataTypeToSize, type DataType } from './enums'

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

export interface VertexAttribute extends VertexFormat {
  byteOffset: number
}

export interface ElementFormat {
  elementType: DataType
  elementCount: number
}

export interface VertexFormat extends ElementFormat {
  normalized?: boolean
  /**
   * The format being used on the CPU side for the buffer
   */
  cpu?: ElementFormat
}

export function elementGpuFormat(f: VertexFormat): ElementFormat {
  return f // the format *is* the GPU description
}

export function elementCpuFormat(f: VertexFormat): ElementFormat {
  return f.cpu ?? f
}

export function elementByteSize(f: ElementFormat): number {
  return dataTypeToSize(f.elementType) * f.elementCount
}

export function packedVertexFormat(gpu: VertexFormat, cpu: ElementFormat): VertexFormat {
  if (elementByteSize(gpu) !== elementByteSize(cpu)) {
    throw new Error(`cpu (${elementByteSize(cpu)}B) and gpu (${elementByteSize(gpu)}B) size mismatch`)
  }
  return { ...gpu, cpu }
}

export const VertexFormat = {
  Vec2: Object.freeze({ elementType: 'float32', elementCount: 2 }),
  Vec3: Object.freeze({ elementType: 'float32', elementCount: 3 }),
  Vec4: Object.freeze({ elementType: 'float32', elementCount: 4 }),
  Color: Object.freeze({
    elementType: 'uint8',
    elementCount: 4,
    normalized: true,
    cpu: Object.freeze({ elementType: 'uint32', elementCount: 1 }),
  }),
} satisfies Record<string, VertexFormat>

export const VertexPreset = {
  /**
   * 3 x float32
   */
  position: { elementType: 'float32', elementCount: 3 },
  /**
   * 4 x uint8, normalized and packed
   */
  color: packedVertexFormat(
    {
      elementType: 'uint8',
      elementCount: 4,
      normalized: true,
    },
    {
      elementType: 'uint32',
      elementCount: 1,
    },
  ),
  /**
   * 3 x float32
   */
  normal: { elementType: 'float32', elementCount: 3 },
  /**
   * 3 x float32
   */
  tangent: { elementType: 'float32', elementCount: 3 },
  /**
   * 3 x float32
   */
  bitangent: { elementType: 'float32', elementCount: 3 },
  /**
   * 2 x float32
   */
  texture: { elementType: 'float32', elementCount: 2 },
  /**
   * 4 x uint8
   */
  blendindices: { elementType: 'uint8', elementCount: 4 },
  /**
   * 4 x uint8, normalized
   */
  blendweight: { elementType: 'uint8', elementCount: 4, normalized: true },
} satisfies Record<string, VertexFormat>

export function vertexLayout(names: VertexSemantic[]): VertexLayout {
  let result: VertexLayout = {}
  let offset = 0

  for (let name of names) {
    name = name.toLowerCase() as VertexSemantic
    const attribute = vertexAttribute(name, { byteOffset: offset })
    if (attribute) {
      result[name] = attribute
      offset += dataTypeToSize(attribute.elementType) * attribute.elementCount
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
 * Counts the number of elements in a single vertex after the given attribute.
 */
export function countElementsAfter(layout: VertexLayout, semantic: string): number {
  let count = 0
  const target = layout[semantic]
  for (const key in layout) {
    if (layout[key].byteOffset > target.byteOffset) {
      count += layout[key].elementCount
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
export function countBytes(layout: VertexLayout): number {
  let count = 0
  for (const key in layout) {
    count += dataTypeToSize(layout[key].elementType) * layout[key].elementCount
  }
  return count
}
