import type { Token, TypedToken } from './Token'

export function printToken(token: Token | TypedToken<string>) {
  switch (token.type) {
    case 'directive': {
      return `#${token.value}\n`
    }
    case 'comment': {
      return `/* ${token.value} */\n`
    }
    default: {
      return token.value
    }
  }
}

export interface TokenPrinter {
  getLast(): string | undefined
  push(...text: string[]): void
  print(): string
  each(tokens: Token[]): Iterable<Token>
}

function arrayPrinter(): TokenPrinter {
  const tokens: string[] = []
  return {
    getLast() {
      return tokens[tokens.length - 1]
    },
    push(...text: string[]) {
      tokens.push(...text)
    },
    print() {
      return tokens.join('')
    },
    *each(tokens: Token[]) {
      for (const token of tokens) {
        yield token
      }
    },
  }
}

export function printTokens(tokens: Array<Token | TypedToken<string>>, indent = '  ', printer?: TokenPrinter) {
  let depth = 0
  printer ||= arrayPrinter()
  let needSpace = false
  function addSpace() {
    const value = printer.getLast()
    if (!value || value === ' ') {
      return
    }
    const char = value[value.length - 1]
    if (char === '\n' || char === ' ') {
      return
    }
    printer.push(' ')
  }
  function addNewLine() {
    printer.push('\n', indent.repeat(depth))
  }
  for (const token of printer.each(tokens as Array<Token>)) {
    switch (token.type) {
      case 'directive': {
        printer.push('#', token.value)
        addNewLine()
        continue
      }
      case 'comment': {
        if (token.kind === 'end' && !token.value.includes('\n')) {
          printer.push('// ', token.value)
          addNewLine()
          continue
        }
        if (token.kind === 'block') {
          addNewLine()
          printer.push('/* ', token.value, ' */')
          addNewLine()
          continue
        }
        addNewLine()
        for (const line of token.value.split('\n')) {
          printer.push('// ', line)
          addNewLine()
        }
        continue
      }
      case 'symbol': {
        needSpace = false
        if (token.value === ';') {
          printer.push(token.value)
          addNewLine()
          continue
        }
        if (token.value === ',') {
          printer.push(token.value)
          addSpace()
          continue
        }
        if (token.value === '{') {
          addNewLine()
          printer.push(token.value)
          depth++
          addNewLine()
          continue
        }
        if (token.value === '}') {
          if (depth === 0) {
            throw new Error(`unexpected token "}" at\n${printer.print()}`)
          }
          depth--
          addNewLine()
          printer.push(token.value)
          addNewLine()
          continue
        }
        printer.push(token.value)
        continue
      }
      case 'boolean':
      case 'float':
      case 'integer': {
        needSpace = false
        printer.push(token.value)
        continue
      }
      case 'identifier':
      case 'keyword':
      case 'unknown': {
        if (needSpace) {
          addSpace()
        }
        printer.push(token.value)
        needSpace = true
        continue
      }
      default: {
        printer.push((token as TypedToken<string>).value)
      }
    }
  }
  return printer.print().trim()
}
