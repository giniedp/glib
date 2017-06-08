import { extend, logger } from '@glib/core'

import { DataSize, DataType, DataTypeOption } from './enums'

export interface VertexAttribute {
  type: DataTypeOption
  offset: number
  elements: number
  normalize?: boolean
  packed?: boolean
}

export interface VertexPreset {
  type: DataTypeOption
  elements: number
  normalize?: boolean
  packed?: boolean
}

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
    if (typeof nameOrLayout === 'string') {
      return this.create(nameOrLayout)
    }
    let result: any = nameOrLayout
    return result
  }

  /**
   * Creates a vertex layout object from given names
   * @example
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
        logger.log('unknown element name ', name)
        continue
      }

      let element = extend<VertexAttribute>({} as any, VertexLayout.preset[name], { offset: offset })

      result[name] = element
      offset += DataSize[element.type] * element.elements
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
        count += DataSize[item.type] * item.elements
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
          count += DataSize[item.type] * item.elements
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
          count += DataSize[item.type] * item.elements
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

  public static convertArrayToArrayBuffer(data: number[], layoutOrType: string|VertexLayout): ArrayBuffer {
    let layout: VertexLayout
    if (DataType[layoutOrType as string]) {
      layout = {
        element: {
          offset: 0,
          type: DataType[layoutOrType as string],
          elements: 1,
        },
      }
    } else {
      layout = layoutOrType as VertexLayout
    }

    let elementCount = VertexLayout.countElements(layout)
    let vertexCount = data.length / VertexLayout.countElements(layout)
    if (vertexCount !== Math.floor(vertexCount)) {
      throw new Error('given data does not match the layout')
    }
    const littleEndian = true
    let vertexSize = VertexLayout.countBytes(layout)
    let dataSize = vertexCount * vertexSize
    let result = new ArrayBuffer(dataSize)
    let view = new DataView(result)
    let viewSetter = {}
    viewSetter[DataType.BYTE] = 'setInt8'
    viewSetter[DataType.UNSIGNED_BYTE] = 'setUint8'
    viewSetter[DataType.SHORT] = 'setInt16'
    viewSetter[DataType.UNSIGNED_SHORT] = 'setUint16'
    viewSetter[DataType.INT] = 'setInt32'
    viewSetter[DataType.UNSIGNED_INT] = 'setUint32'
    viewSetter[DataType.FLOAT] = 'setFloat32'

    let channels = []
    for (const key in layout) {
      if (layout.hasOwnProperty(key)) {
        const spec = layout[key]
        const channel = {
          offset: spec.offset,
          size: DataSize[spec.type] * spec.elements,
          elements: spec.elements,
          elementType: DataType[spec.type],
          elementSize: DataSize[spec.type],
          packed: !!spec.packed,
          setter: viewSetter[DataType[spec.type]],
        }
        channels.push(channel)
        if (channel.packed) {
          if (channel.size === 1) { channel.setter = viewSetter[DataType.UNSIGNED_BYTE] }
          if (channel.size === 2) { channel.setter = viewSetter[DataType.UNSIGNED_SHORT] }
          if (channel.size === 4) { channel.setter = viewSetter[DataType.UNSIGNED_INT] }
        }
      }
    }
    channels = channels.sort((a, b) => a.offset < b.offset ? -1 : 1)

    let dataIndex = 0
    for (let pos = 0; pos < dataSize; pos += vertexSize) {
      for (let channel of channels) {
        let offset = pos + channel.offset
        if (channel.packed) {
          view[channel.setter](offset, data[dataIndex++], littleEndian)
        } else {
          let counter = channel.elements
          for (let i = 0; i < channel.elements; i++) {
            view[channel.setter](offset, data[dataIndex++], littleEndian)
            offset += channel.elementSize
          }
        }
      }
    }

    return result
  }
}
