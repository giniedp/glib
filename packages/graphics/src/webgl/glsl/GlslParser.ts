import { Keywords } from "./keywords"
import { GlslNode, GlslTokenKind } from "./tokenize"

export interface GlslMember {
  /**
   * The leading comment of the member
   */
  comment: string
  /**
   * The identifying name of the member
   */
  name: string
}

export interface GlslVariable extends GlslMember {
  /**
   * Qualifier of
   */
  qualifier: Record<string, boolean>
  /**
   * The glsl variable type
   */
  type: string
  /**
   * The array size of the variable
   *
   * @remarks
   * if the variable is not an array, the value is null or missing
   */
  size: number
}

export interface GlslStruct extends GlslMember {
  /**
   * All members of the struct
   */
  members: Array<GlslVariable>
}

export interface GlslInterface extends GlslStruct {
  /**
   * The instance name of the interface block
   */
  instance: GlslVariable
}

export type GlslMemberField = GlslVariable

export interface GlslLayout {

}

export interface GlslParseResult {
  variables: Record<string, GlslVariable>,
  structs: Record<string, GlslStruct>,
  interfaces: Record<string, GlslInterface>
}

export class GlslParser {
  protected tokens: GlslNode[]
  protected index: number

  public get current() {
    return this.tokens[this.index]
  }

  public get canRead() {
    return !!this.current
  }

  public constructor(tokens: GlslNode[]) {
    this.tokens = tokens
    this.index = 0
  }

  public next() {
    this.index++
    return this.current
  }

  public prev() {
    this.index--
    return this.current
  }

  public currentKind() {
    return this.current?.kind
  }

  public currentText() {
    return this.current?.text
  }

  public peek(offset = 1) {
    return this.tokens[this.index + offset]
  }

  public peekKind(offset = 1) {
    return this.peek(offset)?.kind
  }

  public peekText(offset = 1) {
    return this.peek(offset)?.text
  }

  public skipMethod() {
    this.assertKind(GlslTokenKind.Identifier)
    this.next()
    this.skipKind(GlslTokenKind.Comment)

    this.assertText('(')
    this.skipParenBlock('(', ')')
    this.skipKind(GlslTokenKind.Comment)

    this.assertText('{')
    this.skipParenBlock('{', '}')
  }

  public assertKeyword(text: string) {
    this.assertKind(GlslTokenKind.Keyword)
    this.assertText(text)
  }

  public assertKind(kind: GlslTokenKind) {
    if (this.current && this.current.kind !== kind) {
      throw new Error(`expected token kind "${kind}" but got "${this.current.kind}"" at ${this.createLog()}`)
    }
  }

  public assertText(text: string) {
    if (this.current && this.current.text !== text) {
      throw new Error(`expected text "${text}"" but got "${this.current.text}" at ${this.createLog()}`)
    }
  }

  public skipKind(kind: GlslTokenKind) {
    while(this.canRead && this.current.kind === kind) {
      this.next()
    }
  }

  public skipUntilKind(kind: GlslTokenKind) {
    while(this.canRead && this.current.kind !== kind) {
      this.next()
    }
  }

  public skipParenBlock(open: string, close: string) {
    this.assertText(open)
    let depth = 0
    while(this.canRead) {
      if (this.current.text === open) {
        depth++
      } else if (this.current.text === close) {
        depth--
        if (depth === 0) {
          this.next()
          break
        }
      }
      this.next()
    }
  }

  public readArrayLength() {
    let result: number = null
    if (this.currentKind() === GlslTokenKind.BracketOpen) {
      this.next()
      result = 0
      if (this.currentKind() === GlslTokenKind.Integer) {
        result = this.readInt()
      }
      this.assertKind(GlslTokenKind.BracketClose)
    }
    return result
  }

  public readNumber() {
    if (this.current.kind === GlslTokenKind.Integer) {
      return this.readInt()
    }
    return this.readFloat()
  }

  public readInt() {
    this.assertKind(GlslTokenKind.Integer)
    const text = this.current.text
    this.next()
    if (text[1] === 'x' || text[1] === 'X') {
      return parseInt(text, 16)
    }
    if (text[0] === '0') {
      return parseInt(text, 8)
    }
    return parseInt(text, 10)
  }

  public readFloat() {
    this.assertKind(GlslTokenKind.Float)
    const text = this.current.text
    this.next()
    return parseFloat(text)
  }

  public readStruct() {
    const struct: GlslStruct = {
      comment: null,
      name: null,
      members: [],
    }
    this.assertKeyword('struct')
    this.next()
    if (this.current.kind === GlslTokenKind.Identifier) {
      struct.name = this.readIdentifier()
    }
    this.readStructBody(struct)
    return struct
  }

  public readInterface() {
    const struct: GlslInterface = {
      comment: null,
      name: null,
      members: [],
      instance: null
    }
    if (this.current.kind === GlslTokenKind.Identifier) {
      struct.name = this.current.text
      this.next()
    }
    this.readComments()
    this.readStructBody(struct)

    const comment = this.readComments()
    if (this.canRead && this.current.kind === GlslTokenKind.Identifier) {
      const name = this.readIdentifier()
      struct.instance = {
        comment: comment,
        name: name,
        size: this.readArrayLength(),
        qualifier: {},
        type: struct.name
      }
    }
    return struct
  }

  private readStructBody(struct: GlslStruct) {
    let field: GlslMemberField = {
      comment: null,
      name: null,
      type: null,
      size: null,
      qualifier: {}
    }

    this.assertKind(GlslTokenKind.BraceOpen)
    this.next()

    while (this.canRead && this.current.kind !== GlslTokenKind.BraceClose) {
      switch (this.current.kind) {
        case GlslTokenKind.Comment: {
          field.comment = this.current.text
          this.next()
          break
        }
        case GlslTokenKind.Keyword: {
          if (Keywords.simpleTypes.has(this.current.text)) {
            field.type = this.current.text
          } else if (Keywords.samplerTypes.has(this.current.text)) {
            field.type = this.current.text
          } else {
            field.qualifier[this.current.text] = true
          }
          this.next()
          break
        }
        case GlslTokenKind.Identifier: {
          if (!field.name) {
            field.name = this.current.text
            this.next()
            field.size = this.readArrayLength()
          } else {
            field.type = field.name
            this.next()
          }
          break
        }
        case GlslTokenKind.Comma: {
          struct.members.push(field)
          field = {
            ...field,
            name: null,
            size: null,
            comment: null,
          }
          this.next()
          break
        }
        case GlslTokenKind.Semicolon: {
          struct.members.push(field)
          field = {
            comment: null,
            name: null,
            type: null,
            size: null,
            qualifier: {}
          }
          this.next()
          break
        }
        default: {
          this.next()
        }
      }
    }
    this.assertKind(GlslTokenKind.BraceClose)
    this.next()
  }

  private readIdentifier() {
    this.assertKind(GlslTokenKind.Identifier)
    const result = this.current.text
    this.next()
    return result
  }
  public readComments() {
    let result: string[] = []
    while (this.canRead && this.current.kind === GlslTokenKind.Comment) {
      result.push(this.current.text)
      this.next()
    }
    return result.length ? result.join('\n') : null
  }

  private createLog() {
    const before = this.tokens.slice(this.index - 10, this.index).join(' ')
    const after = this.tokens.slice(this.index, this.index + 10).join(' ')
    return '\n' + before + ' ' + after + '\n' + '_'.repeat(before.length) + '^' + '\n'
  }
}
