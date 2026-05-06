import { printToken, printTokens } from './print'
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

  /**
   * Indicates that calling `next()` should skip comments
   */
  public skipComments = false

  public constructor(tokens: T[]) {
    this.tokens = tokens
    this.index = 0
  }

  public next() {
    this.index++
    while (this.canRead && this.skipComments && this.tokenType === ('comment' satisfies CommentToken['type'])) {
      this.index++
    }
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
      throw new Error(`expected token type "${type}" but got "${this.token?.type}" at ${this.createLog()}`)
    } else {
      throw new Error(
        `expected token type "${type}" with vlaue "${value}" but got "${this.tokenType}" and "${
          this.tokenValue
        }" at ${this.createLog()}`,
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

  public readBlock(open: string, close: string, includeParen = false) {
    this.assert('symbol', open)
    const start = this.index + (includeParen ? 0 : open.length)
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
    const end = this.index - (includeParen ? 0 : close.length)
    return this.tokens.slice(start, end)
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
    const before = this.tokens
      .slice(this.index - 10, this.index)
      .map(printToken)
      .join(' ')
    const after = this.tokens
      .slice(this.index, this.index + 10)
      .map(printToken)
      .join(' ')
    return '\n' + before + ' ' + after + '\n' + '─'.repeat(before.length) + '┘' + '\n'
  }
}
