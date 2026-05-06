import { type Token } from './Token'

export function preprocess(tokens: Token[], tokenize: (source: string) => Token[]): Token[] {
  const state = preprocessor()

  const result: Token[] = []
  for (const token of tokens) {
    if (token.type === 'directive') {
      state.process(token.value)
      continue
    }
    if (!state.active()) {
      continue
    }
    if (state.has(token.value)) {
      result.push(...tokenize(state.get(token.value)))
    } else {
      result.push(token)
    }
  }
  return result
}

export type Preprocessor = ReturnType<typeof preprocessor>
export function preprocessor() {
  const defines = new Map<string, any>()
  const stack = [{ active: true, enabled: true }]

  function active() {
    return stack[0].active && stack[0].enabled
  }

  function handle(directiveExpression: string) {
    const [directive, ...rest] = directiveExpression.split(' ')
    const value = rest.join(' ')
    switch (directive) {
      case 'version':
      case 'extension':
      case 'pragma':
        //
        break
      case 'define':
        if (active()) {
          const match = value.match(/\s*(\w+)\s*(.+)?\s*/)
          defines.set(match[1], match[2] ?? '')
        }
        break
      case 'undef':
        if (active()) {
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
  }
  return {
    process: handle,
    active,
    has: (key: string) => defines.has(key),
    get: (key: string) => defines.get(key),
    list: () => Array.from(defines.entries()),
  }
}

function evalueateExpression(expression: string, defines: Map<string, any>): boolean {
  if (!expression) {
    return false
  }
  // evaluates all 'defined(NAME)' macros
  expression = expression.replace(/defined\s*\(?(.\w+)\)?/gi, (_: string, b: string) => {
    if (b === 'false' || b === 'true') {
      return b
    }
    return String(defines.has(b))
  })
  // evaluates all 'CONSTANT' macros
  expression = expression.replace(/(\w+)/gi, (_: string, b: string) => {
    if (b === 'false' || b === 'true') {
      return b
    }
    return defines.get(b)
  })
  // limit character set before going into eval
  if (!/^[a-zA-Z0-9 ()|&!^]*$/gi.test(expression)) {
    return false
  }
  try {
    return new Function(`return !!${expression}`)()
  } catch (e) {
    return false
  }
}
