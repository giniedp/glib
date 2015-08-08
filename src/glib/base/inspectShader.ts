module Glib.utils {

  var charNewLine = '\n';
  var regComment = /\s*\/\/(.*)\n?\s*$/;
  var regUniform = /^\s*uniform\s+(.+)\s+(.+)\s*;/;
  var regAttribute = /^\s*attribute\s+(.+)\s+(.+)\s*;/;
  var regVarying = /^\s*varying\s+(.+)\s+(.+)\s*;/;
  var regConst = /^\s*const\s+(.+)\s+(.+)\s*=\s*(.+)\s*;/;
  var regTrim = /^\s*|\s*$/;

  function inspectStructs(source):any {
    var index = 0, left, right, name, block, result = {};
    while (true) {
      index = source.indexOf('struct', index);
      left = source.indexOf('{', index);
      right = source.indexOf('};', index);

      if (index < 0 || left < 0 || right < 0) {
        return result;
      }

      name = source.substr(index, left - index).match(/struct\s+(.+)\s*/)[1];
      block = source.substr(left + 1, right - left - 1);
      result[trim(name)] = inspectMembers(block);
      index = right;
    }
  }

  function inspectMembers(block):any {
    block = block
      .split(/\s*\/\/.*\n/).join('') // remove comments
      .split(charNewLine).join('')   // remove remove new lines
      .split(regTrim).join('');      // trim

    var i, match, result = {}, members = block.split(';');
    for (i = 0; i < members.length; i += 1) {
      match = members[i].match(/\s*(\w+)\s+(\w+)\s*$/);
      if (match) {
        //console.debug(match);
        result[match[2]] = {
          name: match[2],
          type: match[1]
        };
      }
    }

    return result;
  }

  function inspectQualified(source):any {
    var comments = [], match, annotations, i, line;
    var lines = getLines(source);
    var result = {
      uniforms: {},
      varying: {},
      attributes: {},
      constants: {}
    };

    for (i = 0; i < lines.length; i += 1) {
      line = trim(lines[i]);
      if (line.length === 0) {
        comments.length = 0;
        continue;
      }

      match = line.match(regComment);
      if (match) {
        comments.push(match[1]);
        continue;
      }

      match = line.match(regUniform);
      if (match) {
        annotations = parseYaml(comments.join(charNewLine));
        annotations.type = match[1];
        annotations.name = match[2];
        result.uniforms[annotations.semantic || annotations.name] = annotations;
        comments = [];
        continue;
      }

      match = line.match(regAttribute);
      if (match) {
        annotations = parseYaml(comments.join(charNewLine));
        annotations.type = match[1];
        annotations.name = match[2];
        result.attributes[annotations.semantic || annotations.name] = annotations;
        comments = [];
        continue;
      }

      match = line.match(regVarying);
      if (match) {
        annotations = parseYaml(comments.join(charNewLine));
        annotations.type = match[1];
        annotations.name = match[2];
        result.varying[annotations.semantic || annotations.name] = annotations;
        comments = [];
        continue;
      }

      match = line.match(regConst);
      if (match) {
        annotations = {};
        annotations.type = match[1];
        annotations.name = match[2];
        annotations.value = match[3];
        result.constants[annotations.name] = annotations;
        comments = [];
      }
    }
    return result;
  }

  function fixUniforms(uniforms, structs):any {
    var item, struct, match, name, count, i;
    var reg = /(.*)\[(\d+)]/; // i.e. light[0]

    Object.keys(uniforms).forEach(function (key) {
      item = uniforms[key];
      struct = structs[item.type];
      if (!struct) {
        return;
      }

      delete uniforms[key];
      match = item.name.match(reg);

      if (match) {
        name = match[1];
        count = Number(match[2]);

        Object.keys(struct).forEach(function (prop) {
          for (i = 0; i < count; i += 1) {
            uniforms[name + "[" + i + "]." + prop] = {
              type: struct[prop].type
            };
          }
        });
      } else {
        Object.keys(struct).forEach(function (prop) {
          uniforms[item.name + "." + prop] = {
            type: struct[prop].type
          };
        });
      }
    });
  }

  /**
   * Inspects the given shader source code and generates a meta object. The
   * object contains information about the `attribute`, `uniform`, `varying`
   * and `const` statements and `struct` definitions within the shader.
   * Each statement may have annotations that are read from the comment above
   * that statement. For example
   * ```
   *
   * // semantic : ambient
   * // default  : [0.2, 0.2, 0.2]
   * uniform vec3 ambient;
   *
   * // register : 0
   * // filter   : LinearWrap
   * uniform sampler2D diffuseTex;
   * ```
   * These uniforms will have the following metadata
   *
   * ```
   *
   * {
   *   uniforms: {
   *     ambient: {
   *       type: 'vec3',
   *       semantic: 'ambient',
   *       default: '[0.2, 0.2, 0.2]'
   *     },
   *     diffuseTex: {
   *       type: 'sampler2D',
   *       register: '0',
   *       filter: 'LinearWrap'
   *     }
   *   }
   * }
   * ```
   * @method inspectShader
   * @param {string} source
   */
  export function inspectShader(source) {
    var result = inspectQualified(source);
    result.structs = inspectStructs(source);
    fixUniforms(result.uniforms, result.structs);
    return result;
  }
}
