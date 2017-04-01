module Glib.Graphics.ShaderInspector {

  const charNewLine = '\n'
  const regComment = /\s*\/\/(.*)\n?\s*$/
  const regUniform = /^\s*uniform\s+(.+)\s+(.+)\s*;/
  const regAttribute = /^\s*attribute\s+(.+)\s+(.+)\s*;/
  const regVarying = /^\s*varying\s+(.+)\s+(.+)\s*;/
  const regConst = /^\s*const\s+(.+)\s+(.+)\s*=\s*(.+)\s*;/
  const regTrim = /^\s*|\s*$/

  export function inspectProgram(vertexShader:string, fragmentShader:string):any {
    let result = {
      defines:{},
      attributes: {},
      uniforms: {},
      varying: {}
    }
    if (vertexShader) {
      let inspection = inspectShader(vertexShader)
      utils.extend(result.attributes, inspection.attributes)
      utils.extend(result.uniforms, inspection.uniforms)  
      utils.extend(result.varying, inspection.varying)  
    }
    if (fragmentShader) {
      let inspection = inspectShader(fragmentShader)
      utils.extend(result.attributes, inspection.attributes)
      utils.extend(result.uniforms, inspection.uniforms)  
      utils.extend(result.varying, inspection.varying)  
    }

    return result
  }

  export function inspectShader(source:string):any {
    let result = {
      defines:{},
      attributes: {},
      uniforms: {},
      varying: {},
      structs: {},
      lines: []
    }

    preprocess(source, result)
    inspectQualifiers(result.lines, result)
    inspectStructs(result.lines.join('\n'), result.structs)
    fixStructUniforms(result.uniforms, result.structs, result.defines)
    fixTextureRegisters(result.uniforms)
    return result
  }

  let isSamplerType = /sampler2D|sampler3D|samplerCube/
  export function fixTextureRegisters(uniforms:any) {
    // map of used registers
    let used = []
    // uniforms without a valid register annotation
    let delayed = []

    for (let key in uniforms) {
      let uniform = uniforms[key]
      if (!uniform || !isSamplerType.test(uniform.type)) continue

      let register = Number(uniform.register)
      if (isNaN(register)) {
        // invalid or missiong register property
        delayed.push(uniform)
      } else {
        // valid register, mark as used
        used[register] = true
      }
    }

    for (let uniform of delayed) {
      for (let register in used) {
        if (used[register]) continue
        uniform.register = register
        used[register] = true
        break;
      }
      if (!used[uniform.register]) {
        uniform.register = used.length
        used[uniform.register] = true
      }
    }
  }

  export function inspectQualifiers(source:string|string[], result:any={}):any {
    result.constants = result.constants || {}
    result.attributes = result.attributes || {}
    result.uniforms = result.uniforms || {}
    result.varying = result.varying || {}
    
    let lines = Array.isArray(source) ? source : utils.getLines(source)
    let comments = []
    for (let line of lines) {
      line = utils.trim(line)
      if (line.length === 0) {
        comments.length = 0
        continue
      }

      let match = line.match(regComment);
      if (match) {
        comments.push(match[1])
        continue
      }

      match = line.match(regUniform)
      if (match) {
        let annotations = parseAnnotations(comments)
        annotations.type = match[1]
        annotations.name = match[2]
        result.uniforms[annotations.binding || annotations.name] = annotations
        comments = []
        continue
      }

      match = line.match(regAttribute)
      if (match) {
        let annotations = parseAnnotations(comments)
        annotations.type = match[1]
        annotations.name = match[2]
        result.attributes[annotations.binding || annotations.name] = annotations
        comments = []
        continue
      }

      match = line.match(regVarying)
      if (match) {
        let annotations = parseAnnotations(comments)
        annotations.type = match[1]
        annotations.name = match[2]
        result.varying[annotations.binding || annotations.name] = annotations
        comments = []
        continue
      }

      match = line.match(regConst)
      if (match) {
        let annotations = parseAnnotations("")
        annotations.type = match[1]
        annotations.name = match[2]
        annotations.value = match[3]
        result.constants[annotations.name] = annotations
        comments = []
      }
    }
    return result
  }
  
  export function inspectStructs(source:string, result:any={}):any {
    let index = 0, left, right, name, block
    while (true) {
      index = source.indexOf('struct', index)
      left = source.indexOf('{', index)
      right = source.indexOf('};', index)

      if (index < 0 || left < 0 || right < 0) {
        return result
      }

      name = source.substr(index, left - index).match(/struct\s+(.+)\s*/)[1]
      block = source.substr(left + 1, right - left - 1)
      result[utils.trim(name)] = inspectMembers(block)
      index = right
    }
  }

  /**
   * 
   */
  export function preprocess(source:string|string[], out:any={}):any {
    out.defines = out.defines || {}
    out.lines = out.lines || []
    
    let defines = out.defines

    // lines to process
    let lines = Array.isArray(source) ? source : utils.getLines(source)
    // matches preprocessor directives e.g.: #define something
    let matcher = /\s*#\s*(\w+)\s*(.+)?\s*/
    // matches key and value after the #define directive: #define KEY VALUE 
    let defMatcher = /\s*(\w+)\s*(.+)?\s*/  
    // if/else stack
    let stack = [{ hot: true, skip: false }]
    let context = stack[0]

    let pushLine = function(line) {
      if (context.hot && !context.skip) {
        out.lines.push(line)
      }
    }

    for (let line of lines) {
      if (!line) {
        pushLine(line)
        continue
      } 
      let match = line.match(matcher)
      if (!match) {
        pushLine(line)
        continue
      }
      let directive = match[1]
      let value = match[2]
      
      if (directive === 'define') {
        pushLine(line)
        if (context.hot && !context.skip) {
          let match = value.match(defMatcher)
          defines[match[1]] = match[2]
        }
      }
      else if (directive === 'undef') {
        pushLine(line)
        if (context.hot && !context.skip) {
          let m = value.match(defMatcher)
          delete defines[m[1]]
        }
      }
      else if (directive === 'ifdef') {
        stack.push({ 
          hot: (value in defines), 
          skip: context.skip 
        })
        context = stack[stack.length - 1]
      }
      else if (directive === 'ifndef') {
        stack.push({ 
          hot: !(value in defines), 
          skip: context.skip 
        })
        context = stack[stack.length - 1]
      }
      else if (directive === 'if') {
        stack.push({ 
          hot:  evaluateIfExpression(value, defines), 
          skip: context.skip 
        })
        context = stack[stack.length - 1]
      }
      else if (directive === 'else') {
        context.skip = context.skip || context.hot
        context.hot = !context.hot
      }
      else if (directive === 'elif') {
        context.skip = context.skip || context.hot
        context.hot = evaluateIfExpression(value, defines)
      }
      else if (directive === 'endif') {
        stack.pop()
        context = stack[stack.length - 1]
      }
      else {
        pushLine(line)
      }
    }
    return defines
  }


  export function evaluateIfExpression(expression:string, defines:any): boolean {
    if (!expression) return false
    // evaluates and replaces 'defined(NAME)' macros
    expression = expression.replace(/defined\s*\(?(.\w+)\)?/gi, function(a:string, b:string) {
      if (b === 'false' || b === 'true') return b
      return String(b in defines)
    })
    expression = expression.replace(/(\w+)/gi, function(a:string, b:string) {
      if (b === 'false' || b === 'true') return b
      return defines[b]
    })
    try {
      // TODO: validate expression before using eval
      return eval(expression)
    } catch (e) {
      return false
    }
  }

  export function inspectMembers(block:string, out:any={}):any {
    block = block
      .split(/\s*\/\/.*\n/).join('') // remove comments
      .split(charNewLine).join('')   // remove remove new lines
      .split(regTrim).join('')       // trim

    let expressions = block.split(';')
    for (let e of expressions) {
      let match = e.match(/\s*(\w+)\s+(\w+)\s*$/)
      if (!match) continue
      out[match[2]] = {
        name: match[2],
        type: match[1]
      }
    }
    return out
  }

  // matches annotation directives e.g. '@key some value'
  const regAnnotation = /^(\s*)@(\w+)\s*(.*)(\s*)/
  /**
   * 
   */
  export function parseAnnotations(source:string|string[], out:any={}):any{
    // lines to process
    let lines = Array.isArray(source) ? source : utils.getLines(source)
    for (let line of lines) {
      let match = line.match(regAnnotation)
      if (!match) continue
      out[match[2]] = match[3]
    }
    return out
  }


  export function fixStructUniforms(uniforms:any, structs:any, defines:any):void {
    let item, struct, match, name, count, i
    let reg = /\s*(.*)\s*\[(.+)].*/

    Object.keys(uniforms).forEach(function (key) {
      item = uniforms[key]
      struct = structs[item.type]
      match = item.name.match(reg)
      
      if (!struct) {
        if (!match) return
        name = match[1]
        count = Number(defines[match[2]] || match[2])
        for (i = 0; i < count; i += 1) {
          let ubinding = `${(item.binding || name)}${i}`;
          let uName = `${(name)}[${i}]`
          uniforms[ubinding] = {
            name: uName,
            binfing: ubinding,
            type: item.type
          }
        }
        delete uniforms[key]
        return
      }
      
      match = item.name.match(reg)

      if (match) {
        delete uniforms[key]
        uniforms[match[1]] = utils.extend({}, item, {
          name: match[1],
          binding: item.binding
        })

        name = match[1]
        count = Number(defines[match[2]] || match[2])

        Object.keys(struct).forEach(function (field) {
          for (i = 0; i < count; i += 1) {
            let ubinding = `${(item.binding || name)}${i}${field}`;
            let uName = `${(name)}[${i}].${field}`
            uniforms[ubinding] = {
              name: uName,
              binding: ubinding,
              type: struct[field].type
            }
          }
        })
      } else {
        delete uniforms[key]
        uniforms[(item.binding || item.name)] = item

        Object.keys(struct).forEach(function (field) {
          let ubinding = `${(item.binding || name)}${field}`;
          let uName = `${(name)}.${field}`
          uniforms[ubinding] = {
            name: uName,
            binding: ubinding,
            type: struct[field].type
          }
        })
      }
    })
  }

}
