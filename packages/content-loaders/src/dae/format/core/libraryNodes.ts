import { COLLADA } from './collada'
import { Library } from './library'
import { Node } from './node'

/**
 * Provides a library in which to place <node> elements.
 */
export class LibraryNodes extends Library<Node> {

  protected itemsTag: string = 'node'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element) {
    return new Node(this.doc, el)
  }
}
