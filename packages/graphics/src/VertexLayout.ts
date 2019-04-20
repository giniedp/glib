import { extend, Log } from '@gglib/core'

import { DataType, DataTypeName, DataTypeOption, dataTypeSize, valueOfDataType } from './enums'

/**
 * @public
 */
export interface VertexAttribute {
  /**
   * Offset in bytes from beginning of vertex to this attribute
   */
  offset: number
  /**
   * The data type of a single element in the vertex attribute
   */
  type: DataTypeOption
  /**
   * The number of `type` elements in this attribute
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
   *
   */
  packed?: boolean
}

/**
 * @public
 */
export interface VertexPreset {
  type: DataTypeOption
  elements: number
  normalize?: boolean
  packed?: boolean
}

/**
 * @public
 */
export class VertexLayout {
  [key: string]: VertexAttribute

  public static preset: { [key: string]: VertexPreset } = {
    position: {
      type: 'float',
      elements: 3,
    },
    color: {
      type: 'ubyte',
      elements: 4,
      normalize: true,
      packed: true,
    },
    color0: {
      type: 'ubyte',
      elements: 4,
      normalize: true,
      packed: true,
    },
    color1: {
      type: 'ubyte',
      elements: 4,
      normalize: true,
      packed: true,
    },
    color2: {
      type: 'ubyte',
      elements: 4,
      normalize: true,
      packed: true,
    },
    normal: {
      type: 'float',
      elements: 3,
    },
    tangent: {
      type: 'float',
      elements: 3,
    },
    bitangent: {
      type: 'float',
      elements: 3,
    },
    texture: {
      type: 'float',
      elements: 2,
    },
    texcoord0: {
      type: 'float',
      elements: 2,
    },
    texcoord1: {
      type: 'float',
      elements: 2,
    },
    texcoord2: {
      type: 'float',
      elements: 2,
    },
  }

  public static convert(nameOrLayout: string|VertexLayout): VertexLayout {
    return typeof nameOrLayout === 'string' ? VertexLayout.create(nameOrLayout) : nameOrLayout
  }

  /**
   * Creates a vertex layout object from given names
   *
   * ```
   *
   * VertexLayout.create('position', 'normal', 'texture');
   * VertexLayout.create('PositionNormalTexture');
   * // in both cases the following layout is returned:
   * // {
   * //    position: { offset: 0, type: 'float', elements: 3 }
   * //    normal: { offset: 12, type: 'float', elements: 2 }
   * //    texture: { offset: 24, type: 'float', elements: 2 }
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
      if (!VertexLayout.preset.hasOwnProperty(name)) {
        Log.l('[VertexLayout] unknown element name ', name)
        continue
      }

      let element = extend<VertexAttribute>({} as any, VertexLayout.preset[name], { offset: offset })

      result[name] = element
      offset += dataTypeSize(element.type) * element.elements
    }

    return result
  }

  /**
   * Counts the number of elements in a single vertex.
   * For example if a layout has defined a `position` and a `normal`
   * (both with three elements) this will return 6.
   * packed elements will count as one.
   */
  public static countElements(layout: VertexLayout): number {
    let count = 0
    for (const key in layout) {
      if (layout.hasOwnProperty(key)) {
        const item = layout[key]
        count += item.packed ? 1 : item.elements
      }
    }
    return count
  }

  /**
   * Counts the number of elements in a single vertex until the given attribute.
   */
  public static countElementsBefore(layout: VertexLayout, name: string): number {
    let count = 0
    let target = layout[name]
    for (const key in layout) {
      if (layout.hasOwnProperty(key)) {
        const item = layout[key]
        if (item.offset < target.offset) {
          count += item.packed ? 1 : item.elements
        }
      }
    }
    return count
  }

  /**
   * Counts the number of elements in a single vertex after the given attribute.
   */
  public static countElementsAfter(layout: VertexLayout, name: string): number {
    let count = 0
    let target = layout[name]
    for (const key in layout) {
      if (layout.hasOwnProperty(key)) {
        const item = layout[key]
        if (item.offset > target.offset) {
          count += item.packed ? 1 : item.elements
        }
      }
    }
    return count
  }

  /**
   * Counts the number of bytes in a single vertex. For example if a layout has a `position` and a `normal` defined
   * both with three elements and each element is a float, this will return 24.
   */
  public static countBytes(layout: VertexLayout): number {
    let count = 0
    for (const key in layout) {
      if (layout.hasOwnProperty(key)) {
        const item = layout[key]
        count += dataTypeSize(item.type) * item.elements
      }
    }
    return count
  }

  /**
   * Counts the number of bytes in a single vertex until the given attribute.
   */
  public static countBytesBefore(layout: VertexLayout, name: string): number {
    let count = 0
    let target = layout[name]
    for (const key in layout) {
      if (layout.hasOwnProperty(key)) {
        const item = layout[key]
        if (item.offset < target.offset) {
          count += dataTypeSize(item.type) * item.elements
        }
      }
    }
    return count
  }

  /**
   * Counts the number of bytes in a single vertex after the given attribute.
   */
  public static countBytesAfter(layout: VertexLayout, name: string): number {
    let count = 0
    let target = layout[name]
    for (const key in layout) {
      if (layout.hasOwnProperty(key)) {
        const item = layout[key]
        if (item.offset > target.offset) {
          count += dataTypeSize(item.type) * item.elements
        }
      }
    }
    return count
  }

  public static uniqueTypes(layout: VertexLayout): Array<string|number> {
    const types: Array<string|number> = []
    for (const key in layout) {
      if (layout.hasOwnProperty(key)) {
        const item = layout[key]
        if (item.type && types.indexOf(item.type) < 0) {
          types.push(item.type)
        }
      }
    }
    return types
  }

  /**
   * Converts a number array to an ArrayBuffer by using the given layout information
   *
   * @param data - The data array
   * @param layoutOrType - The data layout information
   */
  public static convertArrayToArrayBuffer(data: number[], layoutOrType: string|VertexLayout): ArrayBuffer {
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

    const elementCount = VertexLayout.countElements(layout)
    const vertexCount = data.length / VertexLayout.countElements(layout)
    if (vertexCount !== Math.floor(vertexCount)) {
      throw new Error('given data does not match the layout')
    }
    const littleEndian = true
    const vertexSize = VertexLayout.countBytes(layout)
    const dataSize = vertexCount * vertexSize
    const result = new ArrayBuffer(dataSize)
    const view = new DataView(result)

    const viewSetter: {[k: number]: (o: number, v: number) => void} = {
      [DataType.byte]: (o, v) => view.setInt8(o, v),
      [DataType.ubyte]: (o, v) => view.setUint8(o, v),
      [DataType.short]: (o, v) => view.setInt16(o, v, littleEndian),
      [DataType.ushort]: (o, v) => view.setUint16(o, v, littleEndian),
      [DataType.int]: (o, v) => view.setInt32(o, v, littleEndian),
      [DataType.uint]: (o, v) => view.setUint32(o, v, littleEndian),
      [DataType.float]: (o, v) => view.setFloat32(o, v, littleEndian),
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
        if (channel.size === 1) { channel.setter = viewSetter[DataType.ubyte] }
        if (channel.size === 2) { channel.setter = viewSetter[DataType.ushort] }
        if (channel.size === 4) { channel.setter = viewSetter[DataType.uint] }
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

    return result
  }
}
