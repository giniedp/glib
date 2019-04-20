import { COLLADA } from './collada'
import { DocumentCache, mapChild, textContentToNumberArray } from './utils'

export default class Lookat {
  public readonly type = 'lookat'
  public get sid(): string { return this.el.getAttribute('sid') }

  private $data: number[]
  public get data(): number[] {
    if (this.$data === undefined) {
      this.$data = textContentToNumberArray(this.el)
    }
    return this.$data
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
