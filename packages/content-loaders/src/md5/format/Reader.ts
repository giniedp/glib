export class LineReader {
  private lines: string[]
  private index: number
  public lastMatch: RegExpMatchArray

  public get line() {
    return this.lines[this.index]
  }

  constructor(input: string) {
    this.lines = input.replace(/\r/g, '\n').split('\n')
    this.index = -1
  }

  public next() {
    this.index++
    return this.index < this.lines.length
  }

  public match(regex: string | RegExp) {
    if (this.line != null) {
      this.lastMatch = this.line.match(regex)
    } else {
      this.lastMatch = null
    }
    return this.lastMatch
  }
}
