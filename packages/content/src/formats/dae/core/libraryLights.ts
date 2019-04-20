import { COLLADA } from './collada'
import { Library } from './library'
import { Light } from './light'

/**
 * Provides a library in which to place <light> elements.
 */
export class LibraryLights extends Library<Light> {

  protected itemsTag: string = 'light'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element) {
    return new Light(this.doc, el)
  }
}
