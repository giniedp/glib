/**
 * A wrapper around a string. Simplifies reading arbitrary formatted text data.
 *
 * @public
 */
export class TextReader {
  private index: number = 0

  /**
   * Characters that identify a white space. Default is `' \t\r\n\f'`.
   */
  public whitespaces = ' \t\r\n\f'

  /**
   * Checks whether the readers position has not reached the end of the string
   */
  public get canRead(): boolean {
    return this.index < this.text.length
  }

  /**
   * Gets the character at the current readers position.
   */
  public get char(): string {
    return this.text[this.index]
  }

  /**
   * Gets a substring until the end of the string.
   */
  public get rest(): string {
    return this.text.substring(this.index)
  }

  /**
   * Creates a new instance of {@link TextReader}
   *
   * @param text - The text data to read
   */
  constructor(private readonly text: string) {

  }

  /**
   * Advances the readers position to the next character.
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
   * Skips whites paces at current position and then reads until next whitespace character
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
   * Reads until next occurrence of a new line character
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
   * Skips until next occurrence of `start` character and then reads the text until the `end` character
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
   * Returns the next character but does not advance the reader position.
   */
  public peek() {
    const i = this.index
    const c = this.next()
    this.index = i
    return c
  }

  /**
   * Returns the next token but does not advance the reader position.
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
   * Skips characters until occurrence of one in the given string
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

  /**
   * Reads the next token but throws an error if it does not match the given value
   *
   * @param value - The value to match
   */
  public consumeToken(value: string) {
    if (this.peekToken() !== value) {
      const line = (this.text.match(/\n/g) || []).length
      const post = this.index - this.text.lastIndexOf('\n')
      throw new Error(`expected token "${value}" but was "${this.peekToken()}" at ${line}:${post}`)
    }
    this.nextToken()
  }

  /**
   * Consumes the next token only if it matches the given value. Otherwise leaves the state untouched.
   */
  public acceptToken(value: string): boolean {
    if (this.peekToken() !== value) {
      return false
    }
    this.nextToken()
    return true
  }
}
