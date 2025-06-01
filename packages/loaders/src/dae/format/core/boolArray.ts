import { textContentToBoolArray } from './utils'

export function parseBoolArray(el: Element) {
  return new BoolArray(el)
}

/**
 * Declares the storage for a homogenous array of Boolean values.
 */
export class BoolArray {

  /**
   * The number of values in the array
   */
  get count() {
    return Number(this.el.getAttribute('count'))
  }

  /**
   * A text string containing the unique identifier of this element.
   */
  get id() {
    return this.el.getAttribute('id')
  }

  /**
   * The text string name of this element
   */
  get name() {
    return this.el.getAttribute('name')
  }

  private $data: boolean[]

  /**
   * array of Boolean values
   */
  get data() {
    if (!this.$data) {
      this.$data = textContentToBoolArray(this.el)
    }
    return this.$data
  }

  constructor(private el: Element) {

  }
}
