import { COLLADA } from './collada'

/**
 * Declares the input semantics of a data source and connects a consumer to that source.
 */
export class Input {
  /**
   * The offset into the list of indices defined by the parent element’s <p> or <v> subelement.
   *
   * @remarks
   * If two <input> elements share the same offset, they are indexed the same.
   * This is a simple form of compression for the list of indices and also defines the order
   * in which the inputs are used.
   */
  public get offset(): number {
    return Number(this.el.getAttribute('offset')) || 0
  }

  /**
   * The user-defined meaning of the input connection.
   */
  public get semantic(): string {
    return this.el.getAttribute('semantic')
  }

  /**
   * The location of the data source
   */
  public get source(): string {
    return this.el.getAttribute('source')
  }

  /**
   * Which inputs to group as a single set. This is helpful when multiple inputs share the same semantics.
   */
  public get set(): number {
    return Number(this.el.getAttribute('set')) || 0
  }

  constructor(private doc: COLLADA, private el: Element) {

  }
}
