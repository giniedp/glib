import {
  printTokens,
  TextReader,
  tokenize,
  TokenReader,
  type CommentToken,
  type FloatToken,
  type IntegerToken,
  type Token,
  type TypedToken,
} from '../../shader'
import { WgslKeywords } from './wgsl-keywords'

export type WgslToken = Token | TemplateList
export type TemplateList = TypedToken<'templatelist'> & { tokens: WgslToken[] }
export function templateList$(tokens: WgslToken[]): TemplateList {
  return {
    type: 'templatelist',
    tokens,
    value: '<' + printTokens(tokens) + '>',
  }
}

export function tokenizeWgsl(source: string) {
  return tokenize(source, {
    symbols: '-,;:!?.()[]{}@*/&%^+<=>|~',
    keywords: WgslKeywords.all,
    number: readWgslNumber,
    comment: readWgslComment,
  })
}

export function detectTemplateLists(tokens: Token[]): WgslToken[] {
  const reader = new TokenReader(tokens)
  const result: WgslToken[] = []
  const stack: Array<{ pos: number; pending: WgslToken[]; depth: number }> = []
  let depth = 0

  function consume() {
    if (reader.token) {
      push(reader.token)
    }
    reader.next()
  }

  function push(...token: WgslToken[]) {
    if (stack.length) {
      stack[0].pending.push(...token)
    } else {
      result.push(...token)
    }
  }

  function startList() {
    stack.unshift({ pos: reader.position, pending: [], depth })
  }

  function endList() {
    if (!stack.length) {
      return false
    }
    if (!stack[0].pending.length) {
      return false
    }
    if (stack[0].depth !== depth) {
      return false
    }
    const element = stack.shift()
    const list = templateList$(element.pending)
    push(list)
    return true
  }

  function rollback(toDepth: number) {
    while (stack.length) {
      if (stack[0].depth < toDepth) {
        depth = stack[0].depth
        return
      }
      push({ type: 'symbol', value: '<' }, ...stack.shift().pending)
    }
    depth = toDepth
  }

  while (reader.canRead) {
    if (
      reader.is('boolean') ||
      reader.is('integer') ||
      reader.is('float') ||
      reader.is('comment') ||
      reader.is('unknown')
    ) {
      consume()
      continue
    }
    if (reader.is('identifier') || reader.is('keyword')) {
      consume()
      if (reader.is('symbol', '<')) {
        switch (reader.peekValue(1)) {
          // <<
          case '<': {
            consume()
            consume()
            continue
          }
          // <=
          case '=': {
            consume()
            consume()
            continue
          }
        }
        startList()
        reader.next()
        continue
      }
    }
    if (!reader.is('symbol')) {
      consume()
      continue
    }
    switch (reader.tokenValue) {
      case '>': {
        if (endList()) {
          reader.next()
          continue
        }
        consume()
        if (reader.is('symbol', '=')) {
          consume()
        }
        continue
      }
      case '(':
      case '[': {
        depth = depth + 1
        consume()
        continue
      }
      case ')':
      case ']': {
        depth = Math.max(0, depth - 1)
        consume()
        continue
      }
      case '!': {
        consume()
        if (reader.is('symbol', '=')) {
          consume()
        }
        continue
      }
      case '=': {
        consume()
        if (reader.is('symbol', '=')) {
          consume()
          continue
        }
        rollback(0)
        continue
      }
      case ';':
      case '{':
      case ':': {
        rollback(0)
        consume()
        continue
      }
      case '&': {
        consume()
        if (reader.is('symbol', '&')) {
          consume()
          rollback(depth)
        }
        continue
      }
      case '|': {
        consume()
        if (reader.is('symbol', '|')) {
          consume()
          rollback(depth)
        }
        continue
      }
    }
    consume()
  }

  if (stack.length) {
    rollback(0)
  }

  return result
}

function readWgslComment(r: TextReader): CommentToken {
  r.assert('/')
  switch (r.peek(2)) {
    case '//': {
      const lines: string[] = []
      while (r.peek(2) === '//') {
        r.skipChars('/ ')
        lines.push(r.readLine())
        r.skipWhitespace()
      }
      return {
        type: 'comment',
        value: lines.join('\n'),
      }
    }
    case '/*': {
      r.skip(2)
      const comment = r.readUntilText('*/')
      r.skip(2)
      return {
        type: 'comment',
        value: comment
          .split('\n')
          .map((it) => it.replace(/^(\s\*)+/, ''))
          .map((it) => it.trim())
          .join('\n'),
      }
    }
    default: {
      throw new Error(`Invalid comment format at\n${r.createErrorText()}`)
    }
  }
}

function readWgslNumber(r: TextReader): FloatToken | IntegerToken {
  let result = ''
  let isFloat = false
  let isHex = false

  if (r.peek(2) === '0x' || r.peek(2) === '0X') {
    isHex = true
    result = r.read(2)
  }
  result += r.readWhile(isHex ? '0123456789abcdefABCDEF' : '0123456789')

  if (r.char === '.') {
    isFloat = true
    result += r.read(1) + r.readWhile(isHex ? '0123456789abcdefABCDEF' : '0123456789')
  }

  if ((!isHex && (r.char === 'e' || r.char === 'E')) || (isHex && (r.char === 'p' || r.char === 'P'))) {
    isFloat = true
    result += r.read(1)
    result += r.accept('-') || r.accept('+') || ''
    result += r.readWhile('0123456789')
  }

  if (!isFloat && !isHex) {
    isFloat = r.char === 'f' || r.char === 'h'
  }

  if (isFloat) {
    result += r.accept('f') || r.accept('h') || ''
  } else {
    result += r.accept('i') || r.accept('u') || ''
  }

  return {
    type: isFloat ? 'float' : 'integer',
    value: result,
  }
}
