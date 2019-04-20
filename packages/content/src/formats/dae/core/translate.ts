import { COLLADA } from './collada'
import { textContentToNumberArray } from './utils'

export default class Translate {
  public readonly type = 'translate'
  public get sid(): string {
    return this.el.getAttribute('sid')
  }

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
