module Glib.Graphics {

  /**
   * The shader constructor options
   */
  export interface ShaderOptions {
    /**
     * The shader source code
     */
    source?: string,
    /**
     * The shader type e.g. VertexShader or Fragment shader
     */
    type?: string|number,
    /**
     * A WebGLShader object to be reused
     */
    handle?: WebGLShader
  }

  /**
   * 
   */
  export class Shader {
    /**
     * A unique id
     */
    uid:string
    /**
     * The graphics device
     */
    device:Device
    /**
     * The rendering context
     */
    gl:WebGLRenderingContext
    /**
     * The shader source code
     */
    source:string
    /**
     * The shader type (as a  WebGL constant)
     */
    type:number
    /**
     * The shader type (as readable name)
     */
    typeName:string
    /**
     * The web gl shader instance
     */
    handle:WebGLShader
    /**
     * Whether compilation was successfull
     */
    compiled:boolean
    /**
     * The info log that is created after compilation holding error information
     */
    info:string

    /**
     * 
     */
    constructor(device:Device, params:ShaderOptions={}) {
      this.uid = utils.uuid()
      this.device = device
      this.gl = device.context

      this.source = params.source
      this.type = ShaderType[params.type]
      this.typeName = ShaderTypeName[this.type]

      if (!this.typeName) {
        utils.log(this, 'unknown shader type given', params.type)
      }

      this.handle = params.handle
      if (!this.handle || !this.gl.isShader(this.handle)) {
        this.handle = this.gl.createShader(this.type)
      }

      if (this.source) {
        this.compile()
      }
    }

    /**
     * Releases the shader handle
     */
    destroy():Shader {
      if (this.gl.isShader(this.handle)) {
        this.gl.deleteShader(this.handle)
        this.handle = null
      }
      return this
    }

    /**
     * Compiles the current shader source code 
     */
    compile():Shader {
      if (!this.source) {
        utils.error('[Shader] Unable to compile shader, source is missing', this)
        return this
      }

      this.gl.shaderSource(this.handle, this.source)
      this.gl.compileShader(this.handle)
      this.compiled = this.gl.getShaderParameter(this.handle, this.gl.COMPILE_STATUS)
      this.info = this.gl.getShaderInfoLog(this.handle)

      if (!this.compiled) {
        utils.error('[Shader] compilation failed', this.info, this)
      }
      return this
    }

    /**
     * Creates a clone of this shader
     */
    clone():Shader {
      return new Shader(this.device, { type: this.type, source: this.source })
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
    static inspectShader(source:string):any {
      let result = Shader.inspectQualifiers(source)
      result.structs = Shader.inspectStructs(source)
      Shader.fixStructUniforms(result.uniforms, result.structs)
      return result
    }

    static inspectProgram(vertexShader:string, fragmentShader:string):any {
      let result = {
        attributes: {},
        uniforms: {},
        varying: {}
      }
      if (vertexShader) {
        let inspection = Shader.inspectShader(vertexShader)
        utils.extend(result.attributes, inspection.attributes)
        utils.extend(result.uniforms, inspection.uniforms)  
        utils.extend(result.varying, inspection.varying)  
      }
      if (fragmentShader) {
        let inspection = Shader.inspectShader(fragmentShader)
        utils.extend(result.attributes, inspection.attributes)
        utils.extend(result.uniforms, inspection.uniforms)  
        utils.extend(result.varying, inspection.varying)  
      }
      // TODO: fix missing or invalid texture register annotations
      return result
    }

    private static inspectStructs(source:string):any {
      var index = 0, left, right, name, block, result = {}
      while (true) {
        index = source.indexOf('struct', index)
        left = source.indexOf('{', index)
        right = source.indexOf('};', index)

        if (index < 0 || left < 0 || right < 0) {
          return result
        }

        name = source.substr(index, left - index).match(/struct\s+(.+)\s*/)[1]
        block = source.substr(left + 1, right - left - 1)
        result[utils.trim(name)] = Shader.inspectMembers(block)
        index = right
      }
    }

    private static inspectMembers(block:string):any {
      block = block
        .split(/\s*\/\/.*\n/).join('') // remove comments
        .split(charNewLine).join('')   // remove remove new lines
        .split(regTrim).join('')       // trim

      var i, match, result = {}, members = block.split(';')
      for (i = 0; i < members.length; i += 1) {
        match = members[i].match(/\s*(\w+)\s+(\w+)\s*$/)
        if (match) {
          result[match[2]] = {
            name: match[2],
            type: match[1]
          }
        }
      }

      return result
    }

    private static inspectQualifiers(source:string):any {
      var comments = [], match, annotations, i, line
      var lines = utils.getLines(source)
      var result = {
        uniforms: {},
        varying: {},
        attributes: {},
        constants: {}
      }

      for (i = 0; i < lines.length; i += 1) {
        line = utils.trim(lines[i])
        if (line.length === 0) {
          comments.length = 0
          continue
        }

        match = line.match(regComment);
        if (match) {
          comments.push(match[1])
          continue
        }

        match = line.match(regUniform)
        if (match) {
          annotations = Shader.parseAnnotations(comments)
          annotations.type = match[1]
          annotations.name = match[2]
          result.uniforms[annotations.binding || annotations.name] = annotations
          comments = []
          continue
        }

        match = line.match(regAttribute)
        if (match) {
          annotations = Shader.parseAnnotations(comments)
          annotations.type = match[1]
          annotations.name = match[2]
          result.attributes[annotations.binding || annotations.name] = annotations
          comments = []
          continue
        }

        match = line.match(regVarying)
        if (match) {
          annotations = Shader.parseAnnotations(comments)
          annotations.type = match[1]
          annotations.name = match[2]
          result.varying[annotations.binding || annotations.name] = annotations
          comments = []
          continue
        }

        match = line.match(regConst)
        if (match) {
          annotations = {}
          annotations.type = match[1]
          annotations.name = match[2]
          annotations.value = match[3]
          result.constants[annotations.name] = annotations
          comments = []
        }
      }
      return result
    }

    private static parseAnnotations(lines:string[]):any{
      var result = {}
      if (!lines) return result
      for (var line of lines) {
        var match = line.match(redAnnotation)
        if (match) {
          var key = match[2]
          result[key] = match[3]
        }
      }
      return result
    }

    private static fixStructUniforms(uniforms, structs):void {
      var item, struct, match, name, count, i
      var reg = /(.*)\[(\d+)]/
      

      Object.keys(uniforms).forEach(function (key) {
        item = uniforms[key]
        struct = structs[item.type]
        match = item.name.match(reg)
        
        if (!struct) {
          if (!match) return
          name = match[1]
          count = Number(match[2])
          for (i = 0; i < count; i += 1) {
            uniforms[name + "[" + i + "]"] = {
              type: item.type
            }
          }
          delete uniforms[key]
          return
        }

        delete uniforms[key]
        match = item.name.match(reg)

        if (match) {
          name = match[1]
          count = Number(match[2])

          Object.keys(struct).forEach(function (prop) {
            for (i = 0; i < count; i += 1) {
              uniforms[name + "[" + i + "]." + prop] = {
                type: struct[prop].type
              }
            }
          })
        } else {
          Object.keys(struct).forEach(function (prop) {
            uniforms[item.name + "." + prop] = {
              type: struct[prop].type
            }
          })
        }
      })
    }
  }

  const charNewLine = '\n'
  const regComment = /\s*\/\/(.*)\n?\s*$/
  const regUniform = /^\s*uniform\s+(.+)\s+(.+)\s*;/
  const regAttribute = /^\s*attribute\s+(.+)\s+(.+)\s*;/
  const regVarying = /^\s*varying\s+(.+)\s+(.+)\s*;/
  const regConst = /^\s*const\s+(.+)\s+(.+)\s*=\s*(.+)\s*;/
  const regTrim = /^\s*|\s*$/
  const redAnnotation = /^(\s*)@(\w+)\s*(.*)(\s*)/

}
