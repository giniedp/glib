import { getLines } from "@gglib/utils"
import { GlslDirective, GlslNode, GlslTokenKind, tokenize } from "./tokenize"

export function preprocess(tokens: GlslNode[]) {
  const defines = new Map<string, any>()
  const stack = [{ active: true, enabled: true }]
  function ok() {
    return stack[0].active && stack[0].enabled
  }
  return tokens.reduce((result, token) => {
    if (token.kind === GlslTokenKind.Directive) {
      const directive = (token as GlslNode<GlslDirective>).data.name
      const value = (token as GlslNode<GlslDirective>).data.value
      switch (directive) {
        case 'version':
        case 'extension':
        case 'pragma':
          //
          break
        case 'define':
          if (ok()) {
            const match = value.match(/\s*(\w+)\s*(.+)?\s*/)
            defines.set(match[1], match[2])
          }
          break
        case 'undef':
          if (ok()) {
            defines.delete(value)
          }
          break
        case 'ifdef': {
          stack.unshift({ active: stack[0].active, enabled: defines.has(value) })
          break
        }
        case 'ifndef': {
          stack.unshift({ active: stack[0].active, enabled: !defines.has(value) })
          break
        }
        case 'if':
          stack.unshift({ active: stack[0].active, enabled: evalueateExpression(value, defines) })
          break
        case 'else':
          stack[0].enabled = !stack[0].enabled
          break
        case 'elif': {
          stack[0].enabled = !stack[0].enabled && evalueateExpression(value, defines)
          break
        }
        case 'endif':
          stack.shift()
          break
        default:
          console.warn(`unknown directive '#${directive} ${value}'`)
      }
      return result
    }
    if (!ok()) {
      return result
    }

    if (defines.has(token.text)) {
      result.push(...tokenize(defines.get(token.text)))
    } else {
      result.push(token)
    }

    return result
  }, [] as GlslNode[])
}

function evalueateExpression(expression: string, defines: Map<string, any>): boolean {
  if (!expression) {
    return false
  }
  // evaluates all 'defined(NAME)' macros
  expression = expression.replace(/defined\s*\(?(.\w+)\)?/gi, (a: string, b: string) => {
    if (b === 'false' || b === 'true') {
      return b
    }
    return String(defines.get(b))
  })
  // evaluates all 'CONSTANT' macros
  expression = expression.replace(/(\w+)/gi, (a: string, b: string) => {
    if (b === 'false' || b === 'true') {
      return b
    }
    return defines.get(b)
  })
  // limit character set befor going into eval
  if (!/^[a-zA-Z0-9 ()|&!^]*$/gi.test(expression)) {
    return false
  }
  try {
    return new Function(`return !!${expression}`)()
  } catch (e) {
    return false
  }
}

function parseAnnotations(
  source: string,
  out: Record<string, any> = {},
): Record<string, any> {
  if (!source || !source.length) {
    return out
  }
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
