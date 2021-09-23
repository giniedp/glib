import { getOption } from './utils'

/**
 * Options for the {@link TextReader} constructor
 */
export interface TextReaderOptions {
  /**
   * Characters that identify a white space. Default is `' \t\r\n\f'`.
   */
  whitespaces?: string
  /**
   * Characters that are identified as symbols
   */
  symbols?: string
}

export const enum TextCharKind {
  Whitespace,
  Symbol,
}

/**
 * A wrapper around a string. Simplifies reading arbitrary formatted text data.
 *
 * @public
 */
export class TextReader {
  private index: number = 0

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
    return this.text.charAt(this.index)
  }

  public get charCode(): number {
    return this.text.charCodeAt(this.index)
  }
  /**
   * Gets a substring until the end of the string.
   */
  public get rest(): string {
    return this.text.substring(this.index)
  }

  /**
   * Detects whether the character at current position is a symbol
   */
  public get isSymbol() {
    return this.charMap.get(this.char) === TextCharKind.Symbol
  }

  /**
   * Detects whether the character at current position is a whitespace
   */
  public get isWhitespace() {
    return this.charMap.get(this.char) === TextCharKind.Whitespace
  }

  /**
   * Detects whether the character at current position is a '\n'
   */
  public get isNewLine() {
    return this.char === '\n'
  }

  /**
   * Detects whether the caracter at current position is neither whitespace nor symbol
   */
  public get isToken() {
    return !(this.isWhitespace || this.isSymbol)
  }

  /**
   * Detects whether the caracter at current position is [0-9]
   */
  public get isNumeric() {
    const c = this.charCode
    return c >= 48 && c <= 57
  }

  /**
   * Detects whether the caracter at current position is [a-zA-Z]
   */
   public get isAlpha() {
    const c = this.charCode
    return c >= 65 && c <= 90 || c >= 97 && c <= 122
  }

  public get position() {
    return this.index
  }

  public readonly options: TextReaderOptions
  protected charMap: Map<string, TextCharKind> = new Map()
  protected cachedSets = new Map<string, Set<string>>()

  /**
   * Creates a new instance of {@link TextReader}
   *
   * @param text - The text data to read
   */
  constructor(private readonly text: string, options?: TextReaderOptions) {
    this.options = options
    getOption(options, 'whitespaces', ' \t\r\n\f')
      .split('')
      .forEach((it) => {
        this.charMap.set(it, TextCharKind.Whitespace)
      })
    getOption(options, 'symbols', '.+-/*%<>[](){}^|&~=!:;,?')
      .split('')
      .forEach((it) => {
        this.charMap.set(it, TextCharKind.Symbol)
      })
  }

  private getSet(set: string) {
    let result = this.cachedSets.get(set)
    if (!result) {
      result = new Set(set.split(''))
      this.cachedSets.set(set, result)
    }
    return result
  }

  /**
   * Sets the current reader position to the given index
   */
  public seek(index: number) {
    this.index = index
  }

  /**
   * Returns the string that is in front of current position
   *
   * @param count - number of characters to peek
   */
  public peek(count?: number) {
    return count == null || count === 1 ? this.char : this.text.substr(this.index, count)
  }

  /**
   *
   * @param offset
   * @param count
   * @returns
   */
  public peekOffset(offset: number, count?: number) {
    return this.text.substr(this.index + offset, count ?? 1)
  }

  /**
   * Returns the text that is in front of current position (see `readText`)
   */
  public peekText() {
    const i = this.index
    const t = this.readText()
    this.index = i
    return t
  }

  /**
   * Returns the token that is in front of current position (see `readToken`)
   */
  public peekToken() {
    const i = this.index
    const t = this.readToken()
    this.index = i
    return t
  }

  /**
   * Return the text from current position until next new line terminator
   */
  public peekLine() {
    const i = this.index
    const l = this.readLine()
    this.index = i
    return l
  }

  /**
   * Moves pointer back to unread the given number of characters
   */
  public unread(count: number) {
    this.index = Math.max(this.index, this.index - Math.abs(count))
  }

  /**
   * Reads the given number of characters.
   *
   * @remarks
   * If the reader is finished reading, an empty string will be returned
   *
   * @returns the string that was read
   */
  public read(count?: number) {
    if (!this.canRead) {
      return ''
    }
    if (count > 1) {
      const result = this.text.substr(this.index, count)
      this.index += count
      return result
    }
    const result = this.char
    this.index++
    return result
  }

  /**
   * Skips initial whitespaces and then reads everything until next occurance of a whitespace
   *
   * @returns the string that was read
   */
  public readText() {
    if (!this.canRead) {
      return ''
    }
    this.skipWhitespace()
    const i = this.index
    this.skipUntilWhitespace()
    return this.text.substr(i, this.index - i).trim()
  }

  /**
   * Skips initial whitespaces and then reads everything until next occurance of a whitespace or symbol
   *
   * @returns the string that was read
   */
  public readToken() {
    if (!this.canRead) {
      return ''
    }
    this.skipWhitespace()
    const i = this.index
    this.skipUntilWhitespaceOrSymbol()
    return this.text.substr(i, this.index - i).trim()
  }

  /**
   * Reads until next occurrence of a new line character and trims the result
   *
   * @param cb - on optional callback that will receive a new reader for the new line
   * @returns the trimmed string that was being read
   */
  public readLine(cb?: (r: TextReader) => void) {
    const line = this.readLineRaw().trim()
    if (cb) {
      cb(this.createReader(line))
    }
    return line
  }

  /**
   * Reads until next occurrence of a new line character
   *
   * @param cb - on optional callback that will receive a new reader for the new line
   * @returns the string that was being read
   */
  public readLineRaw(cb?: (r: TextReader) => void) {
    if (!this.canRead) {
      return ''
    }
    const i = this.index
    this.skipUntil('\n')
    this.skip(1)
    const line = this.text.substr(i, this.index - i)
    if (cb) {
      cb(this.createReader(line))
    }
    return line
  }

  /**
   * Skips leading whitespaces and then reads a block that is determined by the `open` and `close` character.
   *
   * @param start - character set identifying the begin of a block. Usually an opening parenthesis.
   * @param end - character set identifying the end of a block. Usually matching parenthesis.
   * @param cb - a callback to call with a new text reader
   */
  public readBlock(open: string, close: string, cb?: (r: TextReader) => void) {
    if (!this.canRead) {
      return ''
    }
    this.skipWhitespace()
    if (this.char !== open) {
      throw new Error(`expected '${open}' at current position but was ${this.char}`)
    }

    let iStart = this.index + 1
    let iEnd = iStart
    let depth = 0

    while (this.canRead) {
      if (this.char === open) {
        depth++
      }
      if (this.char === close) {
        depth--
      }
      if (depth === 0) {
        iEnd = this.index
        this.skip(1)
        break
      }
      this.skip(1)
    }

    const block = this.text.substring(iStart, iEnd)

    if (cb) {
      cb(this.createReader(block))
    }
    return block
  }

  /**
   * Reads a sequence of characters that are in given set
   *
   * @param cahrSet - the allowed character set
   * @returns the text being read
   */
  public readWhile(cahrSet: string) {
    const set = this.getSet(cahrSet)
    const i = this.index
    while(this.canRead && set.has(this.char)) {
      this.index += 1
    }
    return this.text.substr(i, this.index - i)
  }

  /**
   * Reads everything until any character from given charset occurs
   *
   * @param charSet - the character set
   * @param inclusive - wheter to also read the boundary characters
   * @returns the text being read
   */
  public readUntil(charSet: string, inclusive?: boolean) {
    const i = this.index
    this.skipUntil(charSet, inclusive)
    return this.text.substr(i, this.index - i)
  }

  /**
   * Reads everything until the given sequence occurs
   *
   * @param charSet - the character sequence
   * @param inclusive - wheter to also read the sequence at the end
   * @returns the text being read
   */
  public readUntilText(sequence: string, inclusive?: boolean) {
    const i = this.index
    this.skipUntilSequence(sequence, inclusive)
    return this.text.substr(i, this.index - i)
  }

  /**
   * Skips the given number of characters
   *
   * @param count - the character count
   */
  public skip(count: number) {
    this.index += count
  }

  /**
   * Skips all whitespace characters
   */
  public skipWhitespace() {
    while (this.canRead && this.isWhitespace) {
      this.index += 1
    }
  }

  /**
   * Skips all symbol characters
   */
  public skipSymbols() {
    while (this.canRead && this.isSymbol) {
      this.index += 1
    }
  }

  /**
   * Skips all whitespace and symbol characters
   */
  public skipWhitespaceAndSymbols() {
    while (this.canRead && (this.isWhitespace || this.isSymbol)) {
      this.index += 1
    }
  }

  /**
   * Skips all characters in given character set
   *
   * @param charset - the characters to skip
   */
  public skipChars(charset: string) {
    while (this.canRead && charset.indexOf(this.char) >= 0) {
      this.index += 1
    }
  }

  /**
   * Skips characters until the next whitespace
   */
  public skipUntilWhitespace() {
    while (this.canRead && !this.isWhitespace) {
      this.index += 1
    }
  }

  /**
   * Skips characters until the next symbol
   */
  public skipUntilSymbol() {
    while (this.canRead && !this.isSymbol) {
      this.index += 1
    }
  }

  /**
   * Skips characters until the next whitespace or symbol
   */
  public skipUntilWhitespaceOrSymbol() {
    while (this.canRead && !(this.isWhitespace || this.isSymbol)) {
      this.index += 1
    }
  }

  /**
   * Skips characters until occurrence of one in the given string
   *
   * @param charset - the characters to stop at
   * @param consume -
   */
  public skipUntil(charset: string, consume?: boolean) {
    const set = this.getSet(charset)
    while (this.canRead && !set.has(this.char)) {
      this.skip(1)
    }
    if (consume) {
      this.skipChars(charset)
    }
  }

  /**
   * Skips forward until the occurence of given sequence
   *
   * @param sequence - the sequence to search for
   * @param consume - whether to consume the found sequence
   */
  public skipUntilSequence(sequence: string, consume?: boolean) {
    while (this.canRead) {
      if (this.char !== sequence[0]) {
        this.skip(1)
      } else if (this.peek(sequence.length) === sequence) {
        if (consume) {
          this.skip(sequence.length)
        }
        return
      } else {
        this.skip(1)
      }
    }
  }

  /**
   * Consumes the next token only if it matches the given value. Otherwise leaves the state untouched.
   */
  public accept(value: string): string {
    const actual = this.peek(value.length)
    if (actual === value) {
      this.index += value.length
      return value
    }
    return undefined
  }

  /**
   * Checks whether the value at current position equals the given value
   *
   * @param value
   */
  public assert(value: string, consume?: boolean) {
    const actual = this.peek(value.length)
    if (actual !== value) {
      throw new Error(`Expected '${value}' at current position but was '${actual}'\n${this.createErrorText()}`)
    }
    if (consume) {
      this.index += value.length
    }
  }

  /**
   * Checks whether the value at current position equals the given value
   *
   * @param value
   */
  public assertChar(value: string, consume?: boolean) {
    if (this.char !== value) {
      throw new Error(`Expected '${value}' at current position but was '${this.char}'\n${this.createErrorText()}`)
    }
    if (consume) {
      this.index += 1
    }
  }

  public createErrorText(offset = 10) {
    const start = Math.max(this.index - 10, 0)
    const end = Math.min(this.index + 10, this.text.length - 1)
    return ' '.repeat(offset) + 'v\n' + `${this.text.substring(start, end)}`
  }

  public createReader(text: string) {
    return new TextReader(text, this.options)
  }
}
