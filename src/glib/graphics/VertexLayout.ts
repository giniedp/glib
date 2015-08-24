module Glib.Graphics {

  var preset = {
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

  function convert(nameOrLayout:string|{[key:string]:any}):{[key:string]:any} {
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
  function create(...rest:string[]):{[key:string]:any} {
    var names = arguments;
    if (names.length === 1) {
      names = names[0].match(/[A-Z][a-z]+/g) || names;
    }

    var result:{[key:string]:any} = {};
    var i, name, element, offset = 0;

    for (i = 0; i < names.length; i += 1) {
      name = String(names[i]).toLowerCase();
      element = VertexLayout.preset[name];

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
  function countElements(layout:any):number {
    var count = 0;
    Object.keys(layout).forEach(function (key) {
      count += layout[key].elements;
    });
    return count;
  }

  /**
   * Counts the number of elements in a single vertex until the given attribute.
   */
  function countElementsBefore(layout:any, name:string):number {
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
  function countElementsAfter(layout:any, name:string):number {
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
  function countBytes(layout:any):number {
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
  function countBytesBefore(layout:any, name:string):number {
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
  function countBytesAfter(layout:any, name:string):number {
    var count = 0, target = layout[name], element;
    Object.keys(layout).forEach(function (key) {
      element = layout[key];
      if (element.offset > target.offset) {
        count += DataSize[element.type] * element.elements;
      }
    });
    return count;
  }

  export var VertexLayout = {
    preset: preset,
    create: create,
    convert: convert,
    countElements: countElements,
    countElementsBefore: countElementsBefore,
    countElementsAfter: countElementsAfter,
    countBytes: countBytes,
    countBytesBefore: countBytesBefore,
    countBytesAfter: countBytesAfter
  };
}
