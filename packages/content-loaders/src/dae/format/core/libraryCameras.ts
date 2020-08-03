import { Camera } from './camera'
import { COLLADA } from './collada'
import { Library } from './library'

/**
 * Provides a library in which to place <camera> elements.
 */
export class LibraryCameras extends Library<Camera> {

  protected itemsTag: string = 'camera'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element) {
    return new Camera(this.doc, el)
  }
}
