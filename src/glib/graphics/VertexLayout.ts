module Glib.Graphics {
  export interface IVertexAttribute {
    type: string|number
    offset: number
    elements: number
    normalize?: boolean
    packed?: boolean
  }
  export interface IVertexLayout {
    [key:string]:IVertexAttribute
  }

  export module VertexLayout {

    export let preset = {
      position: {
        type: 'float',
        elements: 3
      },
      color: {
        type: 'ubyte',
        elements: 4,
        normalize: true,
        packed: true
      },
      color0: {
        type: 'ubyte',
        elements: 4,
        normalize: true,
        packed: true
      },
      color1: {
        type: 'ubyte',
        elements: 4,
        normalize: true,
        packed: true
      },
      color2: {
        type: 'ubyte',
        elements: 4,
        normalize: true,
        packed: true
      },
      normal: {
        type: 'float',
        elements: 3
      },
      tangent: {
        type: 'float',
        elements: 3
      },
      bitangent: {
        type: 'float',
        elements: 3
      },
      texture: {
        type: 'float',
        elements: 2
      },
      texcoord0: {
        type: 'float',
        elements: 2
      },
      texcoord1: {
        type: 'float',
        elements: 2
      },
      texcoord2: {
        type: 'float',
        elements: 2
      }
    };

    export function convert(nameOrLayout:string|IVertexLayout):IVertexLayout {
      if (typeof nameOrLayout === 'string') {
        return create(nameOrLayout);
      }
      let result:any = nameOrLayout;
      return result;
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
    export function create(...rest:string[]):IVertexLayout {
      let names = arguments;
      if (names.length === 1) {
        names = names[0].match(/[A-Z][a-z]+/g) || names
      }

      let result:IVertexLayout = {}
      let i, name, element, offset = 0

      for (i = 0; i < names.length; i += 1) {
        name = String(names[i]).toLowerCase()
        element = preset[name]

        if (!element) {
          utils.log('unknown element name ', name)
          continue
        }

        element = utils.copy(element)
        element.offset = offset
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
    export function countElements(layout:IVertexLayout): number {
      let key, item, count = 0;
      for (key in layout) {
        item = layout[key]
        count += item.packed ? 1 : item.elements
      }
      return count
    }

    /**
     * Counts the number of elements in a single vertex until the given attribute.
     */
    export function countElementsBefore(layout:IVertexLayout, name:string): number {
      let key, item, count = 0, target = layout[name]
      for (key in layout) {
        item = layout[key]
        if (item.offset >= target.offset) continue
        count += item.packed ? 1 : item.elements
      }
      return count
    }

    /**
     * Counts the number of elements in a single vertex after the given attribute.
     */
    export function countElementsAfter(layout:IVertexLayout, name:string): number {
      let key, item, count = 0, target = layout[name]
      for (key in layout) {
        item = layout[key]
        if (item.offset <= target.offset) continue
        count += item.packed ? 1 : item.elements
      }
      return count
    }

    /**
     * Counts the number of bytes in a single vertex. For example if a layout has a `position` and a `normal` defined
     * both with three elements and each element is a float, this will return 24.
     */
    export function countBytes(layout:IVertexLayout): number {
      let key, item, count = 0
      for (key in layout) {
        item = layout[key]
        count += DataSize[item.type] * item.elements
      }
      return count
    }

    /**
     * Counts the number of bytes in a single vertex until the given attribute.
     */
    export function countBytesBefore(layout:IVertexLayout, name:string): number {
      let key, item, count = 0, target = layout[name]
      for (key in layout) {
        item = layout[key]
        if (item.offset >= target.offset) continue
        count += DataSize[item.type] * item.elements
      }
      return count
    }

    /**
     * Counts the number of bytes in a single vertex after the given attribute.
     */
    export function countBytesAfter(layout:IVertexLayout, name:string): number {
      let key, item, count = 0, target = layout[name]
      for (key in layout) {
        item = layout[key]
        if (item.offset <= target.offset) continue
        count += DataSize[item.type] * item.elements;
      }
      return count
    }

    export function uniqueTypes(layout: IVertexLayout):string[] {
      let key, item, types = []
      for (key in layout) {
        item = layout[key]
        if (item.type && types.indexOf(item.type) < 0) {
          types.push(item.type)
        }
      }
      return types
    }
    
    export function convertArrayToArrayBuffer(data: number[], layoutOrType: string|IVertexLayout): ArrayBuffer {
      let layout:IVertexLayout
      if (DataType[layoutOrType as string]) {
        layout = { 
          element: { 
            offset: 0, 
            type: DataType[layoutOrType as string], 
            elements: 1 
          } 
        } 
      } else {
        layout = layoutOrType as IVertexLayout
      }
      
      let elementCount = VertexLayout.countElements(layout);
      let vertexCount = data.length / VertexLayout.countElements(layout)
      if (vertexCount != (vertexCount|0)) {
        throw "given data does not match the layout";
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
      for (let key in layout) {
        let spec = layout[key]
        let channel = {
          offset: spec.offset,
          size: DataSize[spec.type] * spec.elements,
          elements: spec.elements,
          elementType: DataType[spec.type],
          elementSize: DataSize[spec.type],
          packed: !!spec.packed,
          setter: viewSetter[DataType[spec.type]]
        } 
        channels.push(channel)
        if (channel.packed) {
          if (channel.size == 1) channel.setter = viewSetter[DataType.UNSIGNED_BYTE]
          if (channel.size == 2) channel.setter = viewSetter[DataType.UNSIGNED_SHORT]
          if (channel.size == 4) channel.setter = viewSetter[DataType.UNSIGNED_INT]
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
            let counter = channel.elements;
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
} 

