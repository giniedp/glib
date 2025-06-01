import { COLLADA } from '../core/collada'
import { Library } from '../core/library'
import { Image } from './image'

/**
 * Provides a library in which to place <image> elements.
 */
export class LibraryImages extends Library<Image> {

  protected itemsTag: string = 'image'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element) {
    return new Image(this.doc, el)
  }
}
