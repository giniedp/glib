import { COLLADA } from './collada'
import * as util from './utils'

export default class Scale {
  public get sid(): string { return this.el.getAttribute('sid') }

  private $data: number[]
  public get data(): number[] {
    if (this.$data === undefined) {
      this.$data = util.textContentToNumberArray(this.el)
    }
    return this.$data
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
