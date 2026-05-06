import { TextReader, tokenize, type CommentToken, type FloatToken, type IntegerToken } from '../../shader'
import { GlslKeywords } from './glsl-keywords'

export function tokenizeGlsl(source: string) {
  return tokenize(source, {
    symbols: '.+-/*%<>[](){}^|&~=!:;,?',
    keywords: GlslKeywords.all,
    comment: readComment,
    number: readNumber,
  })
}

function readComment(r: TextReader): CommentToken {
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

function readNumber(r: TextReader): FloatToken | IntegerToken {
  let result = ''
  let isFloat = false
  if (r.peek(2) === '0x' || r.peek(2) === '0X') {
    result = r.read(2) + r.readWhile('0123456789abcdefABCDEF')
  } else {
    result = r.readWhile('0123456789')
    if (r.char === '.') {
      isFloat = true
      result += r.read(1) + r.readWhile('0123456789')
    }
    if (r.char === 'e' || r.char === 'E') {
      isFloat = true
      result += r.read(1)
      result += r.accept('-') || r.accept('+') || ''
      result += r.readWhile('0123456789')
    }
  }
  if (!isFloat && (r.accept('u') || r.accept('U'))) {
    result += 'u'
  } else if (r.accept('f') || r.accept('F')) {
    result += 'f'
  }
  if (isFloat) {
    return {
      type: 'float',
      value: result,
    }
  }
  return {
    type: 'integer',
    value: result,
  }
}
