/**
 * @public
 */
export class TextReader {
  private index: number = 0

  public whitespaces = ' \t\r\n\f'

  public get canRead(): boolean {
    return this.index < this.text.length
  }

  /**
   * The character at current read position
   */
  public get char(): string {
    return this.text[this.index]
  }

  /**
   * The remaining text
   */
  public get rest(): string {
    return this.text.substring(this.index)
  }

  constructor(private readonly text: string) {

  }

  /**
   * Advances the reader position to the next character
   *
   * @remarks
   * If the reader is finished reading, an empty string will be returned
   *
   * @returns the character at the new position
   */
  public next() {
    if (!this.canRead) {
      return ''
    }
    this.index++
    return this.char
  }

  /**
   * Skips whitespaces at current position and then reads until next whitespace character
   *
   * @returns the string that was being read
   */
  public nextToken() {
    if (!this.canRead) {
      return ''
    }
    const i = this.index
    this.skipWhile(this.whitespaces)
    this.skipUntil(this.whitespaces)
    this.skipWhile(this.whitespaces)
    return this.text.substr(i, this.index - i).trim()
  }

  /**
   * Reads until next occurance of a new line character
   *
   * @param cb - on optional callback that will receive a new reader for the new line
   * @returns the string that was being read
   */
  public nextLine(cb?: (r: TextReader) => void) {
    if (!this.canRead) {
      return ''
    }
    const i = this.index
    this.skipUntil('\n')
    this.next()
    const line = this.text.substr(i, this.index - i).trim()
    if (cb) {
      cb(new TextReader(line))
    }
    return line
  }

  /**
   * Reads until next occurance of `start` and then until `end`
   *
   * @param start - character identifying the begin of a block
   * @param end - character identifying the begin of a block
   * @param cb - a callback to call with a new text reader
   */
  public nextBlock(start: string, end: string, cb?: (r: TextReader) => void) {
    if (!this.canRead) {
      return ''
    }

    this.skipUntil(start, true)

    let iStart = this.index
    let iEnd = this.index
    let depth = 1

    while (this.canRead) {
      if (start.indexOf(this.char) >= 0) {
        depth++
      }
      if (end.indexOf(this.char) >= 0) {
        depth--

        if (depth === 0) {
          iEnd = this.index
          this.next()
          break
        }
      }
      this.next()
    }

    const block = this.text.substring(iStart, iEnd)

    if (cb) {
      cb(new TextReader(block))
    }
    return block
  }

  /**
   * Returns the next character but does not advance the reader position
   */
  public peek() {
    const i = this.index
    const c = this.next()
    this.index = i
    return c
  }

  /**
   * Returns the next token but does not advance the reader position
   */
  public peekToken() {
    const i = this.index
    const t = this.nextToken()
    this.index = i
    return t
  }

  /**
   * Returns the current line but does not advance the reader position
   */
  public peekLine() {
    const i = this.index
    const l = this.nextLine()
    this.index = i
    return l
  }

  /**
   * Skips all whitespace characters
   */
  public skipWhitespace() {
    this.skipWhile(this.whitespaces)
  }

  /**
   * Skips all characters in given string
   *
   * @param char - the characters to skip
   */
  public skipWhile(char: string) {
    while (this.canRead && char.indexOf(this.char) >= 0) {
      this.next()
    }
  }

  /**
   * Skips characters until occurance of one in the given string
   *
   * @param char - the characters to stop at
   */
  public skipUntil(char: string, andBeyond = false) {
    while (this.canRead && char.indexOf(this.char) === -1) {
      this.next()
    }
    if (andBeyond) {
      this.skipWhile(char)
    }
  }

  public consumeToken(name: string) {
    if (this.peekToken() !== name) {
      const line = (this.text.match(/\n/g) || []).length
      const post = this.index - this.text.lastIndexOf('\n')
      throw new Error(`expected token "${name}" but was "${this.peekToken()}" at ${line}:${post}`)
    }
    this.nextToken()
  }

  public acceptToken(name: string): boolean {
    if (this.peekToken() !== name) {
      return false
    }
    this.nextToken()
    return true
  }
}
