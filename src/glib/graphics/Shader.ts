module Glib.Graphics {

  export interface ShaderOptions {
    source?: string,
    type?: string|number,
    handle?: WebGLShader
  }

  export class Shader {
    device:Device;
    gl:any;
    source:string;
    info:string;
    type:number;
    typeName:string;
    handle:WebGLShader;
    compiled:boolean;

    constructor(device:Device, params?:ShaderOptions) {
      params = params || {};
      this.device = device;
      this.gl = device.context;

      this.source = params.source;
      this.type = ShaderType[params.type];
      this.typeName = ShaderTypeName[this.type];

      if (!this.typeName) {
        utils.log(this, 'unknown shader type given', params.type);
      }

      this.handle = params.handle;
      if (!this.handle || !this.gl.isShader(this.handle)) {
        this.handle = this.gl.createShader(this.type);
      }

      if (this.source) {
        this.compile();
      }
    }

    destroy():Shader {
      if (this.gl.isShader(this.handle)) {
        this.gl.deleteShader(this.handle);
        this.handle = null;
      }
      return this;
    }

    compile():Shader {
      if (!this.source) {
        utils.log(this, 'Unable to compile shader, source is missing');
        return this;
      }

      this.gl.shaderSource(this.handle, this.source);
      this.gl.compileShader(this.handle);
      this.compiled = this.gl.getShaderParameter(this.handle, this.gl.COMPILE_STATUS);
      this.info = this.gl.getShaderInfoLog(this.handle);

      if (!this.compiled) {
        utils.log(this, 'Shader compilation failed');
        utils.log(this.info);
      }
      return this;
    }


    /**
     * Inspects the given shader source code and generates a meta object. The
     * object contains information about the `attribute`, `uniform`, `varying`
     * and `const` statements and `struct` definitions within the shader.
     * Each statement may have annotations that are read from the comment above
     * that statement. For example
     * ```
     *
     * // @binding ambient
     * // @default [0.2, 0.2, 0.2]
     * uniform vec3 ambient;
     *
     * // @register 0
     * // @filter LinearWrap
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
     *       name: 'ambient',
     *       binding: 'ambient',
     *       default: '[0.2, 0.2, 0.2]'
     *     },
     *     diffuseTex: {
     *       type: 'sampler2D',
     *       name: 'diffuseTex',
     *       register: '0',
     *       filter: 'LinearWrap'
     *     }
     *   }
     * }
     * ```
     * @method inspectShader
     * @param {string} source
     */
    static inspectShader(source) {
      var result = Shader._inspectQualifiers(source);
      result.structs = Shader._inspectStructs(source);
      Shader._fixStructUniforms(result.uniforms, result.structs);
      return result;
    }

    static _inspectStructs(source:string):any {
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
        result[utils.trim(name)] = Shader._inspectMembers(block);
        index = right;
      }
    }

    static _inspectMembers(block:string):any {
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

    static _inspectQualifiers(source:string):any {
      var comments = [], match, annotations, i, line;
      var lines = utils.getLines(source);
      var result = {
        uniforms: {},
        varying: {},
        attributes: {},
        constants: {}
      };

      for (i = 0; i < lines.length; i += 1) {
        line = utils.trim(lines[i]);
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
          annotations = Shader._parseAnnotations(comments);
          annotations.type = match[1];
          annotations.name = match[2];
          result.uniforms[annotations.binding || annotations.name] = annotations;
          comments = [];
          continue;
        }

        match = line.match(regAttribute);
        if (match) {
          annotations = Shader._parseAnnotations(comments);
          annotations.type = match[1];
          annotations.name = match[2];
          result.attributes[annotations.binding || annotations.name] = annotations;
          comments = [];
          continue;
        }

        match = line.match(regVarying);
        if (match) {
          annotations = Shader._parseAnnotations(comments);
          annotations.type = match[1];
          annotations.name = match[2];
          result.varying[annotations.binding || annotations.name] = annotations;
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

    static _parseAnnotations(lines:string[]):any{
      var result = {};
      if (!lines) return result;
      for (var line of lines) {
        var match = line.match(redAnnotation);
        if (match) {
          var key = match[2];
          result[key] = match[3];
        }
      }
      return result;
    }

    static _fixStructUniforms(uniforms, structs):void {
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
  }

  var charNewLine = '\n';
  var regComment = /\s*\/\/(.*)\n?\s*$/;
  var regUniform = /^\s*uniform\s+(.+)\s+(.+)\s*;/;
  var regAttribute = /^\s*attribute\s+(.+)\s+(.+)\s*;/;
  var regVarying = /^\s*varying\s+(.+)\s+(.+)\s*;/;
  var regConst = /^\s*const\s+(.+)\s+(.+)\s*=\s*(.+)\s*;/;
  var regTrim = /^\s*|\s*$/;
  var redAnnotation = /^(\s*)@(\w+)\s*(.*)(\s*)/;

}
