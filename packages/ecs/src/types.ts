export interface AbstractType<T> extends Function {
  prototype: T
}

export interface Type<T> extends Function {
  new (...args: any[]): T
}

export class GameTypeToken<T> {
  private description: string
  public constructor(description: string) {
    this.description = description
  }
  public toString() {
    return `GameType ${this.description}`
  }
}
