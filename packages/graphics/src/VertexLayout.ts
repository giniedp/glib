import { Log, hasOwnProperty } from '@gglib/utils'

import { DataType, DataTypeName, DataTypeOption, dataTypeSize, valueOfDataType } from './enums'


/**
 * Describes an attribute of a vertex
 *
 * @public
 * @remarks
 * An attribute of a vertex may be for example a `position` a `normal` or a `color`.
 * A vertex may consist of multiple attributes. This data structure
 * describes where the data of an attribute starts and how it is laid out.
 */
export interface VertexAttribute {
  /**
   * Offset in bytes from beginning of vertex to this attribute
   */
  offset?: number
  /**
   * The data type of a single element in this attribute
   */
  type: DataTypeOption
  /**
   * The number of elements in this attribute. e.g. a vec3 has 3 elements
   */
  elements: number
  /**
   * Indicates that integer elements should be normalized
   *
   * @remarks
   * Signed values are normalized to [0, 1] range.
   * Unsigned values are normalized to [-1, 1] range.
   */
  normalize?: boolean
  /**
   * If true, all elements are packed into a single element
   */
  packed?: boolean
}

const f = Object.freeze

/**
 * Provides layouts of common attributes like `position`, `color`, `texture` etc.
 */
export const VertexLayoutCommons = {
  position: f<VertexAttribute>({
    type: 'float32',
    elements: 3,
  }),
  color: f<VertexAttribute>({
    type: 'uint8',
    elements: 4,
    normalize: true,
    packed: true,
  }),
  normal: f<VertexAttribute>({
    type: 'float32',
    elements: 3,
  }),
  tangent: f<VertexAttribute>({
    type: 'float32',
    elements: 3,
  }),
  bitangent: f<VertexAttribute>({
    type: 'float32',
    elements: 3,
  }),
  texture: f<VertexAttribute>({
    type: 'float32',
    elements: 2,
  }),
}

/**
 * Gets a vertex attribute specification for given attribute semantic
 *
 * @remarks
 * Uses {@link VertexLayoutCommons} to lookup a common specification for given semantic name.
 *
 * The semantic name is stripped down to [a-z] characters. So `texture`, `texture1`, `texture_2`
 * are all treated as same semantic: `texture`
 *
 * @param semantic - the semantic name
 * @param overrides - used to enrich or override the result
 */
export function commonVertexAttribute(semantic: string, overrides?: Partial<VertexAttribute>): VertexAttribute {
  semantic = semantic.match(/[a-z]+/)[0]
  const preset = VertexLayoutCommons[semantic]
  if (!preset) {
    return null
  }
  if (overrides) {
    return {
      ...VertexLayoutCommons[semantic],
      ...overrides,
    }
  }
  return {
    ...VertexLayoutCommons[semantic],
  }
}

/**
 * Provides vertex layout utility functions
 *
 * @public
 */
export class VertexLayout {
  [key: string]: VertexAttribute

  /**
   * Calls {@link VertexLayout.create} if parameter is a string, otherwise simply returns the input value
   */
  public static convert(nameOrLayout: string | VertexLayout): VertexLayout {
    return typeof nameOrLayout === 'string' ? VertexLayout.create(nameOrLayout) : nameOrLayout
  }

  /**
   * Creates a vertex layout object from given names
   *
   * @remarks
   * uses the {@link VertexLayout.preset} to lookup the attribute layout for each name
   *
   * ```ts
   * VertexLayout.create('position', 'normal', 'texture');
   * VertexLayout.create('PositionNormalTexture');
   * // in both cases the following layout is returned:
   * // {
   * //    position: { offset: 0, type: 'float32', elements: 3 }
   * //    normal: { offset: 12, type: 'float32', elements: 2 }
   * //    texture: { offset: 24, type: 'float32', elements: 2 }
   * // }
   * ```
   */
  public static create(...names: string[]): VertexLayout {
    if (names.length === 1) {
      names = names[0].match(/[A-Z][a-z]+/g) || names
    }

    let result: VertexLayout = {}
    let offset = 0

    for (let name of names) {
      name = String(name).toLowerCase()
      const attribute = commonVertexAttribute(name, { offset: offset })
      if (attribute) {
        result[name] = attribute
        offset += dataTypeSize(attribute.type) * attribute.elements
      } else {
        Log.warn('[VertexLayout] No preset found for semantic:', name)
      }
    }

    return result
  }

  /**
   * Counts the number of elements in a single vertex.
   *
   * @remarks
   * For example if a layout has defined a `position` and a `normal`
   * (both with three elements) this will return 6.
   * packed elements will count as one.
   */
  public static countElements(layout: VertexLayout): number {
    let count = 0
    VertexLayout.forEach(layout, (_, item) => {
      count += item.packed ? 1 : item.elements
    })
    return count
  }

  /**
   * Counts the number of elements in a single vertex until the given attribute.
   */
  public static countElementsBefore(layout: VertexLayout, semantic: string): number {
    let count = 0
    const target = layout[semantic]
    VertexLayout.forEach(layout, (_, item) => {
      if (item.offset < target.offset) {
        count += item.packed ? 1 : item.elements
      }
    })
    return count
  }

  /**
   * Counts the number of elements in a single vertex after the given attribute.
   */
  public static countElementsAfter(layout: VertexLayout, semantic: string): number {
    let count = 0
    const target = layout[semantic]
    VertexLayout.forEach(layout, (_, item) => {
      if (item.offset > target.offset) {
        count += item.packed ? 1 : item.elements
      }
    })
    return count
  }

  /**
   * Counts the number of bytes in a single vertex.
   *
   * @remarks
   * For example if a layout has a `position` and a `normal` defined
   * both with three elements and each element is a float, this will return 24.
   */
  public static countBytes(layout: VertexLayout): number {
    let count = 0
    VertexLayout.forEach(layout, (_, item) => {
      count += dataTypeSize(item.type) * item.elements
    })
    return count
  }

  /**
   * Counts the number of bytes in a single vertex until the given attribute.
   */
  public static countBytesBefore(layout: VertexLayout, semantic: string): number {
    let count = 0
    const target = layout[semantic]
    VertexLayout.forEach(layout, (_, item) => {
      if (item.offset < target.offset) {
        count += dataTypeSize(item.type) * item.elements
      }
    })
    return count
  }

  /**
   * Counts the number of bytes in a single vertex after the given attribute.
   */
  public static countBytesAfter(layout: VertexLayout, semantic: string): number {
    let count = 0
    let target = layout[semantic]
    VertexLayout.forEach(layout, (_, item) => {
      if (item.offset > target.offset) {
        count += dataTypeSize(item.type) * item.elements
      }
    })
    return count
  }

  /**
   * Iterates over all vertex attributes in a layout
   *
   * @param layout - the layout
   * @param fn - function to call for each attribute
   */
  public static forEach(layout: VertexLayout, fn: (semantic: string, attribute: VertexAttribute) => void): void {
    for (const key in layout) {
      if (hasOwnProperty(layout, key)) {
        fn(key, layout[key])
      }
    }
  }

  /**
   * Converts a number array to an ArrayBuffer by using the given layout information
   *
   * @param data - The data array
   * @param layoutOrType - The data layout information
   */
  public static convertArrayToBufferView(data: number[], layoutOrType: string | VertexLayout): ArrayBufferView {
    let layout: VertexLayout
    if (typeof layoutOrType === 'string') {
      layout = {
        element: {
          offset: 0,
          type: valueOfDataType(layoutOrType as DataTypeName),
          elements: 1,
        },
      }
    } else {
      layout = layoutOrType as VertexLayout
    }

    // const elementCount = VertexLayout.countElements(layout)
    const vertexCount = data.length / VertexLayout.countElements(layout)
    if (vertexCount !== Math.floor(vertexCount)) {
      throw new Error('given data does not match the layout')
    }
    const littleEndian = true
    const vertexSize = VertexLayout.countBytes(layout)
    const dataSize = vertexCount * vertexSize
    const result = new ArrayBuffer(dataSize)
    const view = new DataView(result)

    const viewSetter: { [k: number]: (o: number, v: number) => void } = {
      [DataType.int8]: (o, v) => view.setInt8(o, v),
      [DataType.uint8]: (o, v) => view.setUint8(o, v),
      [DataType.int16]: (o, v) => view.setInt16(o, v, littleEndian),
      [DataType.uint16]: (o, v) => view.setUint16(o, v, littleEndian),
      [DataType.int32]: (o, v) => view.setInt32(o, v, littleEndian),
      [DataType.uint32]: (o, v) => view.setUint32(o, v, littleEndian),
      [DataType.float32]: (o, v) => view.setFloat32(o, v, littleEndian),
    }

    const channels = Object.keys(layout)
      .map((key) => layout[key])
      .sort((a, b) => a.offset < b.offset ? -1 : 1)
      .map((spec) => {
        const channel = {
          offset: spec.offset,
          size: dataTypeSize(spec.type) * spec.elements,
          elements: spec.elements,
          elementType: valueOfDataType(spec.type),
          elementSize: dataTypeSize(spec.type),
          packed: !!spec.packed,
          setter: viewSetter[valueOfDataType(spec.type)],
        }
        if (channel.packed) {
          if (channel.size === 1) { channel.setter = viewSetter[DataType.uint8] }
          if (channel.size === 2) { channel.setter = viewSetter[DataType.uint16] }
          if (channel.size === 4) { channel.setter = viewSetter[DataType.uint32] }
        }
        return channel
      })

    let dataIndex = 0
    for (let pos = 0; pos < dataSize; pos += vertexSize) {
      for (let channel of channels) {
        let offset = pos + channel.offset
        if (channel.packed) {
          channel.setter(offset, data[dataIndex++])
        } else {
          for (let i = 0; i < channel.elements; i++) {
            channel.setter(offset, data[dataIndex++])
            offset += channel.elementSize
          }
        }
      }
    }

    return view
  }
}
