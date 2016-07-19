module Glib.Graphics.VertexLayout {

  export var preset = {
    position: {
      type: 'float',
      elements: 3
    },
    color: {
      type: 'ubyte',
      elements: 4,
      normalize: true
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
    }
  };

  export function convert(nameOrLayout:string|{[key:string]:any}):{[key:string]:any} {
    if (typeof nameOrLayout === 'string') {
      return create(nameOrLayout);
    }
    var result:any = nameOrLayout;
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
  export function create(...rest:string[]):{[key:string]:any} {
    var names = arguments;
    if (names.length === 1) {
      names = names[0].match(/[A-Z][a-z]+/g) || names;
    }

    var result:{[key:string]:any} = {};
    var i, name, element, offset = 0;

    for (i = 0; i < names.length; i += 1) {
      name = String(names[i]).toLowerCase();
      element = preset[name];

      if (!element) {
        utils.log('unknown element name ', name);
        continue;
      }

      element = utils.copy(element);
      element.offset = offset;
      result[name] = element;
      offset += DataSize[element.type] * element.elements;
    }

    return result;
  }

  /**
   * Counts the number of elements in a single vertex.
   * For example if a layout has a `position` and a `normal` defined
   * (both with three elements) this will return 6.
   */
  export function countElements(layout:any, countPackedAsOne: boolean = false):number {
    let item, count = 0;
    Object.keys(layout).forEach(function (key) {
      item = layout[key]
      if (item.packed && countPackedAsOne) {
        count += 1;
      } else {
        count += item.elements;
      }
      
    });
    return count;
  }

  /**
   * Counts the number of elements in a single vertex until the given attribute.
   */
  export function countElementsBefore(layout:any, name:string):number {
    var count = 0, target = layout[name], element;
    Object.keys(layout).forEach(function (key) {
      element = layout[key];
      if (element.offset < target.offset) {
        count += element.elements;
      }
    });
    return count;
  }

  /**
   * Counts the number of elements in a single vertex after the given attribute.
   */
  export function countElementsAfter(layout:any, name:string):number {
    var count = 0, target = layout[name], element;
    Object.keys(layout).forEach(function (key) {
      element = layout[key];
      if (element.offset > target.offset) {
        count += element.elements;
      }
    });
    return count;
  }

  /**
   * Counts the number of bytes in a single vertex. For example if a layout has a `position` and a `normal` defined
   * both with three elements and each element is a float, this will return 24.
   */
  export function countBytes(layout:any):number {
    var count = 0, element;
    Object.keys(layout).forEach(function (key) {
      element = layout[key];
      count += DataSize[element.type] * element.elements;
    });
    return count;
  }

  /**
   * Counts the number of bytes in a single vertex until the given attribute.
   */
  export function countBytesBefore(layout:any, name:string):number {
    var count = 0, target = layout[name], element;
    Object.keys(layout).forEach(function (key) {
      element = layout[key];
      if (element.offset < target.offset) {
        count += DataSize[element.type] * element.elements;
      }
    });
    return count;
  }

  /**
   * Counts the number of bytes in a single vertex after the given attribute.
   */
  export function countBytesAfter(layout:any, name:string):number {
    var count = 0, target = layout[name], element;
    Object.keys(layout).forEach(function (key) {
      element = layout[key];
      if (element.offset > target.offset) {
        count += DataSize[element.type] * element.elements;
      }
    });
    return count;
  }

  export function uniqueTypes(layout: any):string[] {
    let types = []
    Object.keys(layout).forEach(function (key) {
      let element = layout[key];
      if (element.type && types.indexOf(element.type) < 0) {
        types.push(element.type)
      }
    })
    return types
  }
  
  export function convertArrayArrayBuffer(data:number[], layout: any): ArrayBuffer {
    if (DataType[layout]) {
      layout = { element: { offset: 0, type: DataType[layout], elements: 1 } } 
    }
    const countPackedAsOne = true
    const elementCount = data.length / VertexLayout.countElements(layout, countPackedAsOne)
    if (elementCount != (elementCount|0)) {
      throw "given data does not match the layout";
    }
    const littleEndian = true
    let elementSize = VertexLayout.countBytes(layout)
    let dataSize = elementCount * elementSize
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
    for (let pos = 0; pos < dataSize; pos += elementSize) {
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
