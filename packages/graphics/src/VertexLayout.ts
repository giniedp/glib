import { dataTypeToSize, type DataType } from './enums'

export type AttributeSemantic =
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

export const VertexLayoutPresets: Record<AttributeSemantic, VertexAttribute> = {
  position: {
    elementType: 'float32',
    elementCount: 3,
  },
  color: {
    elementType: 'uint8',
    elementCount: 4,
    normalized: true,
    packed: true,
  },
  normal: {
    elementType: 'float32',
    elementCount: 3,
  },
  tangent: {
    elementType: 'float32',
    elementCount: 3,
  },
  bitangent: {
    elementType: 'float32',
    elementCount: 3,
  },
  texture: {
    elementType: 'float32',
    elementCount: 2,
  },
  blendindices: {
    elementType: 'uint8',
    elementCount: 4,
  },
  blendweight: {
    elementType: 'uint8',
    elementCount: 4,
    normalized: true,
  },
}

export function createVertexLayout(names: AttributeSemantic[]): VertexLayout {
  let result: VertexLayout = {}
  let offset = 0

  for (let name of names) {
    name = name.toLowerCase() as AttributeSemantic
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
  const preset = VertexLayoutPresets[semantic]
  if (!preset) {
    return null
  }
  if (overrides) {
    return {
      ...VertexLayoutPresets[semantic],
      ...overrides,
    }
  }
  return {
    ...VertexLayoutPresets[semantic],
  }
}

export interface VertexAttribute {
  byteOffset?: number
  elementType: DataType
  elementCount: number
  normalized?: boolean
  packed?: boolean // hint for geometry builder
}

/**
 * Counts the number of elements in a single vertex.
 *
 * @remarks
 * For example if a layout has defined a `position` and a `normal`
 * (both with three elements) this will return 6.
 */
export function countElements(layout: VertexLayout): number {
  let count = 0
  for (const key in layout) {
    count += layout[key].elementCount
  }
  return count
}

/**
 * Counts the number of elements in a single vertex until the given attribute.
 */
export function countElementsBefore(layout: VertexLayout, semantic: string): number {
  let count = 0
  const target = layout[semantic]
  for (const key in layout) {
    if (layout[key].byteOffset < target.byteOffset) {
      count += layout[key].elementCount
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

/**
 * Counts the number of bytes in a single vertex until the given attribute.
 */
export function countBytesBefore(layout: VertexLayout, semantic: string): number {
  let count = 0
  const target = layout[semantic]
  for (const key in layout) {
    if (layout[key].byteOffset < target.byteOffset) {
      count += dataTypeToSize(layout[key].elementType) * layout[key].elementCount
    }
  }
  return count
}

/**
 * Counts the number of bytes in a single vertex after the given attribute.
 */
export function countBytesAfter(layout: VertexLayout, semantic: string): number {
  let count = 0
  let target = layout[semantic]
  for (const key in layout) {
    if (layout[key].byteOffset > target.byteOffset) {
      count += dataTypeToSize(layout[key].elementType) * layout[key].elementCount
    }
  }
  return count
}

export function convertArrayToBufferView(
  data: number[],
  layoutOrType: DataType | VertexLayout,
): ArrayBufferView<ArrayBuffer> {
  let layout: VertexLayout
  if (typeof layoutOrType === 'string') {
    layout = {
      element: {
        byteOffset: 0,
        elementType: layoutOrType,
        elementCount: 1,
      },
    }
  } else {
    layout = layoutOrType as VertexLayout
  }

  // const elementCount = VertexLayout.countElements(layout)
  const vertexCount = data.length / countElements(layout)
  if (vertexCount !== Math.floor(vertexCount)) {
    throw new Error('given data does not match the layout')
  }
  const littleEndian = true
  const vertexSize = countBytes(layout)
  const dataSize = vertexCount * vertexSize
  const result = new ArrayBuffer(dataSize)
  const view = new DataView(result)

  const viewSetter: Record<DataType, (o: number, v: number) => void> = {
    int8: (o, v) => view.setInt8(o, v),
    uint8: (o, v) => view.setUint8(o, v),
    int16: (o, v) => view.setInt16(o, v, littleEndian),
    uint16: (o, v) => view.setUint16(o, v, littleEndian),
    int32: (o, v) => view.setInt32(o, v, littleEndian),
    uint32: (o, v) => view.setUint32(o, v, littleEndian),
    float32: (o, v) => view.setFloat32(o, v, littleEndian),
    float16: (o, v) => view.setUint16(o, v, littleEndian),
  }

  const channels = Object.keys(layout)
    .map((key) => layout[key])
    .sort((a, b) => (a.byteOffset < b.byteOffset ? -1 : 1))
    .map((spec) => {
      const channel = {
        offset: spec.byteOffset,
        size: dataTypeToSize(spec.elementType) * spec.elementCount,
        elements: spec.elementCount,
        elementType: spec.elementType,
        elementSize: dataTypeToSize(spec.elementType),
        setter: viewSetter[spec.elementType],
      }
      return channel
    })

  let dataIndex = 0
  for (let pos = 0; pos < dataSize; pos += vertexSize) {
    for (let channel of channels) {
      let offset = pos + channel.offset
      for (let i = 0; i < channel.elements; i++) {
        channel.setter(offset, data[dataIndex++])
        offset += channel.elementSize
      }
    }
  }

  return view
}
