import { TextReader } from './TextReader'
import type { Token, CommentToken, FloatToken, IntegerToken } from './Token'

export interface TokenizeOptions {
  symbols: string
  keywords: Set<string>
  comment: (r: TextReader) => CommentToken
  number: (r: TextReader) => FloatToken | IntegerToken
}

export function tokenize(code: string, options: TokenizeOptions): Token[] {
  if (!code) {
    return []
  }
  code = code
    .replace(/(\r\n)/gi, '\n')
    .replace(/(\n\r)/gi, '\n')
    .replace(/(\\\n)/gi, '')
  const symbols = options.symbols
  const keywords = options.keywords
  const r = new TextReader(code, {
    symbols,
  })

  const tokens: Token[] = []
  let lastPos = -1
  while (r.canRead) {
    if (lastPos === r.position) {
      throw new Error(`unable to read at\n${r.createErrorText()}`)
    }
    lastPos = r.position

    if (r.isWhitespace) {
      r.skipWhitespace()
      continue
    }

    // preprocessor
    if (r.char === '#') {
      r.skip(1)
      tokens.push({
        type: 'directive',
        value: r.readLine(),
      })
      continue
    }

    // comments
    if (options.comment) {
      switch (r.peek(2)) {
        case '//':
        case '/*': {
          tokens.push(options.comment(r))
          break
        }
      }
    }

    // numbers
    if (options.number) {
      if (r.char === '.') {
        r.skip(1)
        if (r.isNumeric) {
          r.unread(1)
          tokens.push(options.number(r))
          continue
        }
        r.unread(1)
      }
      if (r.isNumeric) {
        tokens.push(options.number(r))
        continue
      }
    }

    // symbols
    if (r.isSymbol) {
      tokens.push({
        type: 'symbol',
        value: r.read(1),
      })
      continue
    }

    //
    const token = r.readToken()
    if (!token) {
      continue
    }
    if (keywords.has(token)) {
      tokens.push({
        type: 'keyword',
        value: token,
      })
    } else {
      tokens.push({
        type: 'identifier',
        value: token,
      })
    }
  }
  return tokens
}

export function readCommentToken(r: TextReader): { type: 'comment'; value: string } {
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

export function readNumberToken(r: TextReader): FloatToken | IntegerToken {
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
