import { COLLADA } from './collada'
import { Library } from './library'

/**
 * Provides a library in which to place <formula> elements.
 */
export class LibraryFormulas extends Library<null> {

  protected itemsTag: string = 'formula'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element): null {
    // TODO:
    return null
  }
}
