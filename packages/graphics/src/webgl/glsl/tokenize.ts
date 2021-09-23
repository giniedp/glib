import { TextReader } from '@gglib/utils'
import { Keywords } from './keywords'

export const enum GlslTokenKind {
  /**
   * Indicates a preprocessing directive
   */
  Directive,
  /**
   * Indicates a comment
   */
  Comment,
  /**
   * Indicates a symbol character, one of: `.+-/*%<>^|&~=!:?`
   */
  Symbol,
  /**
   * Indicates an identifier token: [a-zA-Z_][a-zA-Z_0-9]*
   */
  Identifier,
  /**
   * Indicates an integer constant
   */
  Integer,
  /**
   * Indicates a floating point constant
   */
  Float,
  /**
   * Indicates a glsl keyword
   */
  Keyword,
  /**
   * Indicates a semicolon character
   */
  Semicolon,
  /**
   * Indicates a comma character
   */
  Comma,
  /**
   *
   */
  BracketOpen,
  BracketClose,
  /**
   *
   */
  ParenOpen,
  ParenClose,
  /**
   *
   */
  BraceOpen,
  BraceClose,
  /**
   * Indicates a text pattern that does not match any known token kind
   */
  Text,
}

export interface GlslNode<T = unknown> {
  kind: GlslTokenKind
  text: string
  data?: T
}

export interface GlslDirective {
  name: string
  value: string
}

export function tokenize(source: string) {
  const r = new TextReader(
    source
      .replace(/(\r\n)/gi, '\n')
      .replace(/(\n\r)/gi, '\n')
      .replace(/(\\\n)/gi, ''),
    {
      symbols: '.+-/*%<>[](){}^|&~=!:;,?',
    },
  )

  const tokens: GlslNode[] = []
  let lastPos = -1
  while (r.canRead) {
    if (lastPos === r.position) {
      throw new Error(`unable to read at\n${r.createErrorText()}`)
    }
    lastPos = r.position
    switch (r.char) {
      case '#': {
        r.skip(1)
        tokens.push({
          kind: GlslTokenKind.Directive,
          text: r.peekLine(),
          data: {
            name: r.readText(),
            value: r.readLine(),
          } as GlslDirective,
        })
        break
      }
      case '/': {
        switch (r.peek(2)) {
          case '//':
          case '/*': {
            tokens.push({
              kind: GlslTokenKind.Comment,
              text: readComment(r),
            })
            break
          }
          default: {
            tokens.push({
              kind: GlslTokenKind.Symbol,
              text: r.read(1),
            })
          }
        }
        break
      }
      case ';': {
        tokens.push({
          kind: GlslTokenKind.Semicolon,
          text: r.read(1),
        })
        break
      }
      case ',': {
        tokens.push({
          kind: GlslTokenKind.Comma,
          text: r.read(1),
        })
        break
      }
      case '[':
        tokens.push({
          kind: GlslTokenKind.BracketOpen,
          text: r.read(1),
        })
        break
      case ']': {
        tokens.push({
          kind: GlslTokenKind.BracketClose,
          text: r.read(1),
        })
        break
      }
      case '(':
        tokens.push({
          kind: GlslTokenKind.ParenOpen,
          text: r.read(1),
        })
        break
      case ')': {
        tokens.push({
          kind: GlslTokenKind.ParenClose,
          text: r.read(1),
        })
        break
      }
      case '{':
        tokens.push({
          kind: GlslTokenKind.BraceOpen,
          text: r.read(1),
        })
        break
      case '}': {
        tokens.push({
          kind: GlslTokenKind.BraceClose,
          text: r.read(1),
        })
        break
      }
      default: {
        if (r.isWhitespace) {
          r.skipWhitespace()
          continue
        }
        if (r.isAlpha || r.char == '_') {
          const token = r.readToken()
          if (Keywords.all.has(token)) {
            tokens.push({
              kind: GlslTokenKind.Keyword,
              text: token,
            })
          } else {
            tokens.push({
              kind: GlslTokenKind.Identifier,
              text: token,
            })
          }
          continue
        }
        if (r.char === '.') {
          r.skip(1)
          if (r.isNumeric) {
            r.unread(1)
            tokens.push({
              kind: GlslTokenKind.Float,
              text: readNumber(r),
            })
            continue
          }
          r.unread(1)
        }
        if (r.isNumeric) {
          const value = readNumber(r)
          if (
            value.endsWith('f') ||
            value.endsWith('F') ||
            value.includes('.') ||
            value.includes('e') ||
            value.includes('E')
          ) {
            tokens.push({
              kind: GlslTokenKind.Float,
              text: value,
            })
          } else {
            tokens.push({
              kind: GlslTokenKind.Integer,
              text: value,
            })
          }
          continue
        }
        if (r.isSymbol) {
          tokens.push({
            kind: GlslTokenKind.Symbol,
            text: r.read(1),
          })
          continue
        }
        tokens.push({
          kind: GlslTokenKind.Text,
          text: r.readText(),
        })
      }
    }
  }
  return tokens
}

function readComment(r: TextReader) {
  r.assert('/')
  switch (r.peek(2)) {
    case '//': {
      const lines: string[] = []
      while (r.peek(2) === '//') {
        r.skipChars('/ ')
        lines.push(r.readLine())
        r.skipWhitespace()
      }
      return lines.join('\n')
    }
    case '/*': {
      r.skip(2)
      const comment = r.readUntilText('*/')
      r.skip(2)
      return comment
        .split('\n')
        .map((it) => it.replace(/^(\s\*)+/, ''))
        .map((it) => it.trim())
        .join('\n')
    }
    default: {
      new Error(`Invalid comment format at\n${r.createErrorText()}`)
    }
  }
}

function readNumber(r: TextReader) {
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
  return result
}
