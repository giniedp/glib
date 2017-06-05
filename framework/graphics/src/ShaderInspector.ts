import { extend, getLines, trim } from '@glib/core'

const charNewLine = '\n'
const regComment = /\s*\/\/(.*)\n?\s*$/
const regUniform = /^\s*uniform\s+(.+)\s+(.+)\s*;/
const regAttribute = /^\s*attribute\s+(.+)\s+(.+)\s*;/
const regVarying = /^\s*varying\s+(.+)\s+(.+)\s*;/
const regConst = /^\s*const\s+(.+)\s+(.+)\s*=\s*(.+)\s*;/
const regTrim = /^\s*|\s*$/

const  isSamplerType = /sampler2D|sampler3D|samplerCube/
const regAnnotation = /^(\s*)@(\w+)\s*(.*)(\s*)/

export class ShaderInspector {

  public static inspectProgram(vertexShader: string, fragmentShader: string): any {
    let result = {
      defines: {},
      attributes: {},
      uniforms: {},
      varying: {},
    }
    if (vertexShader) {
      let inspection = this.inspectShader(vertexShader)
      extend(result.attributes, inspection.attributes)
      extend(result.uniforms, inspection.uniforms)
      extend(result.varying, inspection.varying)
    }
    if (fragmentShader) {
      let inspection = this.inspectShader(fragmentShader)
      extend(result.attributes, inspection.attributes)
      extend(result.uniforms, inspection.uniforms)
      extend(result.varying, inspection.varying)
    }

    return result
  }

  public static inspectShader(source: string): any {
    let result = {
      defines: {},
      attributes: {},
      uniforms: {},
      varying: {},
      structs: {},
      lines: [] as any[],
    }

    this.preprocess(source, result)
    this.inspectQualifiers(result.lines, result)
    this.inspectStructs(result.lines.join('\n'), result.structs)
    this.fixStructUniforms(result.uniforms, result.structs, result.defines)
    this.fixTextureRegisters(result.uniforms)
    return result
  }

  public static fixTextureRegisters(uniforms: any) {
    // map of used registers
    let used = []
    // uniforms without a valid register annotation
    let delayed = []

    for (const key in uniforms) {
      if (uniforms.hasOwnProperty(key)) {
        const uniform = uniforms[key]
        if (!uniform || !isSamplerType.test(uniform.type)) { continue }

        const register = Number(uniform.register)
        if (isNaN(register)) {
          // invalid or missiong register property
          delayed.push(uniform)
        } else {
          // valid register, mark as used
          used[register] = true
        }
      }
    }

    for (let uniform of delayed) {
      for (let register in used) {
        if (used[register]) { continue }
        uniform.register = register
        used[register] = true
        break
      }
      if (!used[uniform.register]) {
        uniform.register = used.length
        used[uniform.register] = true
      }
    }
  }

  public static inspectQualifiers(source: string|string[], result: any= {}): any {
    result.constants = result.constants || {}
    result.attributes = result.attributes || {}
    result.uniforms = result.uniforms || {}
    result.varying = result.varying || {}

    let lines = Array.isArray(source) ? source : getLines(source)
    let comments = []
    for (let line of lines) {
      line = trim(line)
      if (line.length === 0) {
        comments.length = 0
        continue
      }

      let match = line.match(regComment)
      if (match) {
        comments.push(match[1])
        continue
      }

      match = line.match(regUniform)
      if (match) {
        let annotations = this.parseAnnotations(comments)
        annotations.type = match[1]
        annotations.name = match[2]
        result.uniforms[annotations.binding || annotations.name] = annotations
        comments = []
        continue
      }

      match = line.match(regAttribute)
      if (match) {
        let annotations = this.parseAnnotations(comments)
        annotations.type = match[1]
        annotations.name = match[2]
        result.attributes[annotations.binding || annotations.name] = annotations
        comments = []
        continue
      }

      match = line.match(regVarying)
      if (match) {
        let annotations = this.parseAnnotations(comments)
        annotations.type = match[1]
        annotations.name = match[2]
        result.varying[annotations.binding || annotations.name] = annotations
        comments = []
        continue
      }

      match = line.match(regConst)
      if (match) {
        let annotations = this.parseAnnotations('')
        annotations.type = match[1]
        annotations.name = match[2]
        annotations.value = match[3]
        result.constants[annotations.name] = annotations
        comments = []
      }
    }
    return result
  }

  public static inspectStructs(source: string, result: any= {}): any {
    let index = 0
    let left
    let right
    let name
    let block
    while (true) {
      index = source.indexOf('struct', index)
      left = source.indexOf('{', index)
      right = source.indexOf('};', index)

      if (index < 0 || left < 0 || right < 0) {
        return result
      }

      name = source.substr(index, left - index).match(/struct\s+(.+)\s*/)[1]
      block = source.substr(left + 1, right - left - 1)
      result[trim(name)] = this.inspectMembers(block)
      index = right
    }
  }

  /**
   *
   */
  public static preprocess(source: string|string[], out: any= {}): any {
    out.defines = out.defines || {}
    out.lines = out.lines || []

    let defines = out.defines

    // lines to process
    let lines = Array.isArray(source) ? source : getLines(source)
    // matches preprocessor directives e.g.: #define something
    let matcher = /\s*#\s*(\w+)\s*(.+)?\s*/
    // matches key and value after the #define directive: #define KEY VALUE
    let defMatcher = /\s*(\w+)\s*(.+)?\s*/
    // if/else stack
    let stack = [{ hot: true, skip: false }]
    let context = stack[0]

    let pushLine = (line: string) => {
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
          let subMatch = value.match(defMatcher)
          defines[subMatch[1]] = subMatch[2]
        }
      } else if (directive === 'undef') {
        pushLine(line)
        if (context.hot && !context.skip) {
          let m = value.match(defMatcher)
          delete defines[m[1]]
        }
      } else if (directive === 'ifdef') {
        stack.push({
          hot: (value in defines),
          skip: context.skip,
        })
        context = stack[stack.length - 1]
      } else if (directive === 'ifndef') {
        stack.push({
          hot: !(value in defines),
          skip: context.skip,
        })
        context = stack[stack.length - 1]
      } else if (directive === 'if') {
        stack.push({
          hot:  this.evaluateIfExpression(value, defines),
          skip: context.skip,
        })
        context = stack[stack.length - 1]
      } else if (directive === 'else') {
        context.skip = context.skip || context.hot
        context.hot = !context.hot
      } else if (directive === 'elif') {
        context.skip = context.skip || context.hot
        context.hot = this.evaluateIfExpression(value, defines)
      } else if (directive === 'endif') {
        stack.pop()
        context = stack[stack.length - 1]
      } else {
        pushLine(line)
      }
    }
    return defines
  }

  public static evaluateIfExpression(expression: string, defines: any): boolean {
    if (!expression) { return false }
    // evaluates all 'defined(NAME)' macros
    expression = expression.replace(/defined\s*\(?(.\w+)\)?/gi, (a: string, b: string) => {
      if (b === 'false' || b === 'true') { return b }
      return String(b in defines)
    })
    // evaluates all 'CONSTANT' macros
    expression = expression.replace(/(\w+)/gi, (a: string, b: string) => {
      if (b === 'false' || b === 'true') { return b }
      return defines[b]
    })
    // limit character set befor going into eval
    if (!/^[a-zA-Z0-9 \(\)\|\&\!\^]*$/gi.test(expression)) {
      return false
    }
    try {
      return !!eval(expression) // tslint:disable-line
    } catch (e) {
      return false
    }
  }

  public static inspectMembers(block: string, out: any= {}): any {
    block = block
      .split(/\s*\/\/.*\n/).join('') // remove comments
      .split(charNewLine).join('')   // remove new lines
      .split(regTrim).join('')       // trim

    let expressions = block.split(';')
    for (let e of expressions) {
      let match = e.match(/\s*(\w+)\s+(\w+)\s*$/)
      if (!match) { continue }
      out[match[2]] = {
        name: match[2],
        type: match[1],
      }
    }
    return out
  }

  // matches annotation directives e.g. '@key some value'

  /**
   *
   */
  public static parseAnnotations(source: string|string[], out: any= {}): any {
    // lines to process
    let lines = Array.isArray(source) ? source : getLines(source)
    for (let line of lines) {
      let match = line.match(regAnnotation)
      if (!match) { continue }
      out[match[2]] = match[3]
    }
    return out
  }

  public static fixStructUniforms(uniforms: any, structs: any, defines: any): void {
    // let item, struct, match, name, count: number, i
    let reg = /\s*(.*)\s*\[(.+)].*/
    Object
      .keys(uniforms)
      .map((key) => {
        const item = uniforms[key]
        return {
          key: key,
          item: item,
          struct: structs[item.type],
          match: item.name.match(reg),
        }
      })
      .map((data) => {
        const key = data.key
        const item = data.item
        const struct = data.struct
        const match = data.match

        if (!struct) {
          if (!match) { return }
          let name: string = match[1]
          let count = Number(defines[match[2]] || match[2])
          for (let i = 0; i < count; i += 1) {
            let ubinding = `${(item.binding || name)}${i}`
            let uName = `${(name)}[${i}]`
            uniforms[ubinding] = {
              name: uName,
              binfing: ubinding,
              type: item.type,
            }
          }
          delete uniforms[key]
          return
        }

        data.match = item.name.match(reg)

        return data
      })
      .filter((it) => !!it)
      .forEach((data) => {
        const key = data.key
        const item = data.item
        const struct = data.struct
        const match = data.match

        if (match) {
          delete uniforms[key]
          uniforms[match[1]] = extend({}, item, {
            name: match[1],
            binding: item.binding,
          })

          let name = match[1]
          let count = Number(defines[match[2]] || match[2])

          Object.keys(struct).forEach((field) => {
            for (let i = 0; i < count; i += 1) {
              let ubinding = `${(item.binding || name)}${i}${field}`
              let uName = `${(name)}[${i}].${field}`
              uniforms[ubinding] = {
                name: uName,
                binding: ubinding,
                type: struct[field].type,
              }
            }
          })
        } else {
          delete uniforms[key]
          uniforms[(item.binding || item.name)] = item

          Object.keys(struct).forEach((field) => {
            const ubinding = `${(item.binding || name)}${field}`
            const uName = `${(name)}.${field}`
            uniforms[ubinding] = {
              name: uName,
              binding: ubinding,
              type: struct[field].type,
            }
          })
        }
      })
  }

}