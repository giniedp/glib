import { printTokens, TokenPrinter } from './print'
import { type CommentToken, type Token, type TypedToken } from './Token'

export class TokenReader<T extends TypedToken<string> = Token> {
  protected tokens: T[]
  protected index: number

  public get token() {
    return this.tokens[this.index]
  }

  public get tokenType() {
    return this.token?.type
  }

  public get tokenValue() {
    return this.token?.value
  }

  public get canRead() {
    return !!this.token
  }

  public get position() {
    return this.index
  }

  public constructor(tokens: T[]) {
    this.tokens = tokens
    this.index = 0
  }

  public next() {
    this.index++
    return this.token
  }

  public prev() {
    this.index--
    return this.token
  }

  public peek(offset = 1) {
    return this.tokens[this.index + offset]
  }

  public peekType(offset = 1) {
    return this.peek(offset)?.type
  }

  public peekValue(offset = 1) {
    return this.peek(offset)?.value
  }

  public is(type: T['type'] | '*', value?: T['value']) {
    if (type !== '*' && this.tokenType !== type) {
      return false
    }
    if (value !== undefined && this.tokenValue !== value) {
      return false
    }
    return true
  }

  public assert(type: T['type'] | '*', value?: T['value']) {
    if (this.is(type, value)) {
      return
    }
    if (value == null) {
      throw new Error(`expected token type "${type}" but got "${this.token?.type}" at\n${this.createLog()}`)
    } else {
      throw new Error(
        `expected token type "${type}" with vlaue "${value}" but got "${this.tokenType}" and "${
          this.tokenValue
        }" at\n${this.createLog()}`,
      )
    }
  }

  public read(type: T['type'] | '*', value?: T['value']) {
    this.assert(type, value)
    const result = this.tokenValue
    this.next()
    return result
  }

  public skipType(type: T['type']) {
    while (this.canRead && this.tokenType === type) {
      this.next()
    }
  }

  public skipUntilKind(type: T['type']) {
    while (this.canRead && this.tokenType !== type) {
      this.next()
    }
  }

  public skipBlock(open: string, close: string) {
    this.assert('symbol', open)
    let depth = 0
    while (this.canRead) {
      if (this.tokenValue === open) {
        depth++
      } else if (this.tokenValue === close) {
        depth--
        if (depth === 0) {
          this.next()
          break
        }
      }
      this.next()
    }
  }

  /**
   * Reads a block of tokens between matching open and close symbols, and returns the tokens inside the block.
   *
   * The open and close symbols must be balanced, and can be nested.
   *
   * If `includeParen` is true, the returned tokens will include the open and close symbols.
   */
  public readBlock(open: string, close: string, includeParen = false) {
    this.assert('symbol', open)

    const start = this.index + (includeParen ? 0 : open.length)
    let depth = 0
    while (this.canRead) {
      if (this.tokenType !== 'symbol') {
        this.next()
        continue
      }
      if (this.tokenValue === open) {
        depth++
      } else if (this.tokenValue === close) {
        depth--
        if (depth === 0) {
          const end = this.index + (includeParen ? close.length : 0)
          this.next()
          return this.tokens.slice(start, end)
        }
      }
      this.next()
    }
    throw new Error(`unclosed block, expected "${close}" at\n${this.createLog()}`)
  }

  public readBlockText(open: string, close: string, includeParen = false) {
    return printTokens(this.readBlock(open, close, includeParen))
  }

  public readUntil(type: T['type'], value?: string) {
    const result: T[] = []
    while (this.canRead) {
      if (this.tokenType === type && (value === undefined || this.tokenValue === value)) {
        break
      }
      result.push(this.token)
      this.next()
    }
    return result
  }

  public readWhile(predicate: (token: T) => boolean) {
    const result: T[] = []
    while (this.canRead) {
      if (!predicate(this.token)) {
        break
      }
      result.push(this.token)
      this.next()
    }
    return result
  }

  public createLog() {
    return printTokens(this.tokens, '  ', logPrinter('', this.index))
  }
}

function logPrinter(message: string, targetIndex: number): TokenPrinter {
  let lineNum = 0
  let linePos = 0
  const stack: string[] = []
  const lines: string[] = []
  let tokenIndex = 0
  return {
    getLast() {
      return stack[stack.length - 1]
    },
    push(...text: string[]) {
      if (tokenIndex === targetIndex) {
        lineNum = lines.length
        linePos = stack.join('').length
      }
      for (const str of text) {
        if (str === '\n') {
          lines.push(stack.join(''))
          stack.length = 0
        } else {
          stack.push(str)
        }
      }
    },
    *each(tokens: Token[]) {
      for (const token of tokens) {
        yield token
        tokenIndex++
      }
    },
    print() {
      if (stack.length) {
        lines.push(stack.join(''))
        stack.length = 0
      }
      return printError(lines, lineNum, linePos, message)
    },
  }
}

function printError(lines: string[], lineNum: number, linePos: number, message: string) {
  const result: string[] = []
  if (message) {
    result.push(message)
  }

  for (let i = lineNum - 10; i < lineNum + 10; i++) {
    if (i < 0 || i >= lines.length) {
      continue
    }

    if (i !== lineNum) {
      result.push(`${String(i).padStart(5)}:  ${lines[i]}`)
    } else {
      result.push(`>${String(i).padStart(4)}:  ${lines[i]}`)
      result.push(`      ${' '.repeat(linePos + 1)}^`)
    }
  }
  return result.join('\n')
}
