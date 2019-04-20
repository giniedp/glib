import { COLLADA } from './collada'
import { Geometry } from './geometry'
import { Library } from './library'

/**
 * Provides a library in which to place <geometry> elements.
 */
export class LibraryGeometries extends Library<Geometry> {

  protected itemsTag: string = 'geometry'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element) {
    return new Geometry(this.doc, el)
  }
}
