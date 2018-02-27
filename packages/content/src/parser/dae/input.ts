import { COLLADA } from './collada'

export class Input {
  public get offset(): number { return Number(this.el.getAttribute('offset')) || 0 }
  public get semantic(): string { return this.el.getAttribute('semantic') }
  public get source(): string { return this.el.getAttribute('source') }
  public get set(): number { return Number(this.el.getAttribute('set')) || 0 }

  constructor(private doc: COLLADA, private el: Element) {

  }
}
