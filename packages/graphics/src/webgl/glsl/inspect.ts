import { getLines } from '@gglib/utils'
import { GlslVariable } from './GlslParser'
import { Keywords } from './keywords'
import { GlslScanResult, scan } from './scan'

/**
 * @public
 */
export interface GlslMemberInfo {
  /**
   * Annotated metadata about the defined object
   */
  [key: string]: any
  /**
   * The user defined binding name of the defined object
   */
  binding?: string
  /**
   * The identifier of the defined object as it appears in the source code
   */
  name: string
  /**
   * The type of the defined object
   */
  type: string
  /**
   * The layout qualifier
   */
  layout?: any
}

/**
 * @public
 */
export interface GlslProgramInspection {
  /**
   * The vertex shader source
   */
  vertexShader: string
   /**
    * The fragment shader source
    */
  fragmentShader: string
  /**
   * All attribute statements
   */
  inputs: Record<string, GlslMemberInfo>
  /**
   * All uniform statements
   */
  uniforms: Record<string, GlslMemberInfo>
  /**
   * All struct statements
   */
  structs: Record<string, GlslMemberInfo>
  /**
   * All interface block statements
   */
  interfaces: Record<string, GlslMemberInfo>
}

/**
 * @public
 */
export interface GlslShaderInspection {
  /**
   * The inspected shader source
   */
  shader: string
  /**
   * The shader input variables
   */
  inputs: Record<string, GlslMemberInfo>
  /**
   * The shader uniform variables
   */
  uniforms: Record<string, GlslMemberInfo>
  /**
   * Structs defined in the shader
   */
  structs: Record<string, GlslMemberInfo>
  /**
   * Interface blocks defined in the shader
   */
  interfaces: Record<string, GlslMemberInfo>
}

export function inspectProgram(vertexShader: string, fragmentShader: string): GlslProgramInspection {
  const result: GlslProgramInspection = {
    inputs: {},
    uniforms: {},
    structs: {},
    interfaces: {},
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  }
  if (vertexShader) {
    const inspection = inspect(vertexShader, false)
    result.inputs = {
      ...result.inputs,
      ...inspection.inputs,
    }
    result.structs = {
      ...result.structs,
      ...inspection.structs,
    }
    result.interfaces = {
      ...result.interfaces,
      ...inspection.interfaces,
    }
    result.uniforms = {
      ...result.uniforms,
      ...inspection.uniforms,
    }
  }
  if (fragmentShader) {
    const inspection = inspect(fragmentShader, true)
    result.structs = {
      ...result.structs,
      ...inspection.structs,
    }
    result.interfaces = {
      ...result.interfaces,
      ...inspection.interfaces,
    }
    result.uniforms = {
      ...result.uniforms,
      ...inspection.uniforms,
    }
  }

  return result
}

export function inspect(source: string, skipInputs: boolean): GlslShaderInspection {
  const data = scan(source)

  const result: GlslShaderInspection = {
    shader: source,
    inputs: {},
    uniforms: {},
    structs: {},
    interfaces: {}
  }

  for (const key of Object.keys(data.variables)) {
    const v = data.variables[key]
    const isUniform = v.qualifier.uniform
    const isInput = v.qualifier.attribute || v.qualifier.in

    if ((skipInputs && isInput) || !(isInput || isUniform)) {
      continue
    }
    resolveAccessors(v, data, (info) => {
      if (isUniform) {
        result.uniforms[info.name] = info
      } else if (isInput) {
        result.inputs[info.name] = info
      }
    })
  }

  return result
}

function resolveAccessors(item: GlslVariable, data: GlslScanResult, cb: (info: GlslMemberInfo) => void) {
  const isStruct = item.type in data.structs
  const isInterface = item.type in data.interfaces
  const meta = parseAnnotations(item.comment)

  if (!isStruct && !isInterface) {

    spread(item, (index: number | null) => {
      const suffix = index == null ? '' : `[${index}]`
      const name = item.name + suffix
      const binding = (meta.binding || item.name) + suffix
      cb({
        layout: null,
        ...meta,
        name: name,
        binding: binding,
        type: item.type,
      })
    })
  } else if (isStruct) {
    const struct = data.structs[item.type]
    // const structMeta = parseAnnotations(struct.comment)

    spread(item, (index: number | null) => {
      const suffix = index == null ? '' : `[${index}]`
      const name = item.name + suffix
      const binding = (meta.binding || item.name) + suffix
      for (const field of struct.members) {
        resolveAccessors(field, data, (fieldItem) => {
          cb({
            layout: null,
            ...fieldItem,
            name: [name, fieldItem.name].join('.'),
            binding: [binding, fieldItem.binding].join('.'),
            type: fieldItem.type,
          })
        })
      }
    })
  } else if (isInterface) {
    const struct = data.interfaces[item.type]
    const structMeta = parseAnnotations(struct.comment)

    const name = struct.instance ? struct.name : ''
    const binding = struct.instance ? (structMeta.binding || struct.name) : ''
    for (const field of struct.members) {
      resolveAccessors(field, data, (fieldItem) => {
        cb({
          layout: null,
          ...fieldItem,
          name: name ? `${name}.${fieldItem.name}` : fieldItem.name,
          binding: binding ? `${binding}.${fieldItem.binding}` : fieldItem.binding,
          type: fieldItem.type,
        })
      })
    }
  }
}

function spread(item: GlslVariable, cb: (index: number) => void) {
  // if (Keywords.simpleTypes.has(item.type)) {
  //   cb(null)
  //   return
  // }
  if (!item.size) {
    cb(null)
  } else {
    for (let i = 0; i < item.size; i++) {
      cb(i)
    }
  }
}

function parseAnnotations(source: string | string[], out: Record<string, any> = {}): Record<string, any> {
  source = source || ''
  // lines to process
  const lines = Array.isArray(source) ? source : getLines(source)
  for (const line of lines) {
    const match = line.match(/^(\s*)@(\w+)\s*(.*)(\s*)/)
    if (!match) {
      continue
    }
    out[match[2]] = match[3]
  }
  return out
}
