import { COLLADA } from './collada'
import { Library } from './library'

/**
 * Provides a library in which to place <animation> elements.
 */
export class LibraryAnimations extends Library<null> {

  protected itemsTag: string = 'animation'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element): null {
    // TODO:
    return null
  }
}
