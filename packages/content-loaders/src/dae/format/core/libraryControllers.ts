import { COLLADA } from './collada'
import { Library } from './library'

/**
 * Provides a library in which to place <controller> elements.
 */
export class LibraryControllers extends Library<null> {

  protected itemsTag: string = 'controller'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element): null {
    // TODO:
    return null
  }
}
