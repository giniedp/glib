import { COLLADA } from './collada'

export class Param {
  public get name(): string { return this.el.getAttribute('name') }
  public get sid(): string { return this.el.getAttribute('sid') }
  public get type(): string { return this.el.getAttribute('type') }
  public get semantic(): string { return this.el.getAttribute('semantic') }
  public convert: (v: any) => any

  constructor(private doc: COLLADA, private el: Element) {
    this.convert = (() => {
      if (this.type === 'float') {
        return Number
      }
      if (this.type === 'float') {
        return Number
      }
      if (this.type === 'bool') {
        return Boolean
      }
      return (v: any): any => v
    })()
  }
}
