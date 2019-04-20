import { COLLADA } from '../core/collada'

export class InstanceImage {

  /**
   * A text string value containing the scoped identifier of this element
   */
  get sid(): string { return this.el.getAttribute('sid') }

  /**
   * The text string name of this element
   */
  get name(): string { return this.el.getAttribute('name') }

  /**
   * The URI of the location of the <effect> element to instantiate
   */
  get url(): string { return this.el.getAttribute('url') }

  public constructor(private doc: COLLADA, private el: Element) {

  }
}
