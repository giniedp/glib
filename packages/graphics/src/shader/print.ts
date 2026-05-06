import type { Token, TypedToken } from './Token'

export function printToken(token: Token | TypedToken<string>) {
  switch (token.type) {
    case 'directive': {
      return `#${token.value}\n`
    }
    case 'comment': {
      return `/* ${token.value} */`
    }
    default: {
      return token.value
    }
  }
}

export function printTokens(tokens: Array<Token | TypedToken<string>>, indent = '  ') {
  let depth = 0
  const result: string[] = []
  let needSpace = false
  function addSpace() {
    const value = result[result.length - 1]
    if (!value || value === ' ') {
      return
    }
    const char = value[value.length - 1]
    if (char === '\n' || char === ' ') {
      return
    }
    result.push(' ')
  }
  function addNewLine() {
    result.push('\n', indent.repeat(depth))
  }
  for (const token of tokens as Array<Token>) {
    switch (token.type) {
      case 'directive': {
        result.push('#', token.value)
        addNewLine()
        continue
      }
      case 'comment': {
        addNewLine()
        for (const line of token.value.split('\n')) {
          result.push('// ', line)
          addNewLine()
        }
        continue
      }
      case 'symbol': {
        needSpace = false
        if (token.value === ';') {
          result.push(token.value)
          addNewLine()
          continue
        }
        if (token.value === ',') {
          result.push(token.value)
          addSpace()
          continue
        }
        if (token.value === '{') {
          addNewLine()
          result.push(token.value)
          depth++
          addNewLine()
          continue
        }
        if (token.value === '}') {
          depth--
          addNewLine()
          result.push(token.value)
          addNewLine()
          continue
        }
        result.push(token.value)
        continue
      }
      case 'boolean':
      case 'float':
      case 'integer': {
        needSpace = false
        result.push(token.value)
        continue
      }
      case 'identifier':
      case 'keyword':
      case 'unknown': {
        if (needSpace) {
          addSpace()
        }
        result.push(token.value)
        needSpace = true
        continue
      }
      default: {
        result.push((token as TypedToken<string>).value)
      }
    }
  }
  return result.join('').trim()
}
