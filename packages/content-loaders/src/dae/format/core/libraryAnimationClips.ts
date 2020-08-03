import { COLLADA } from './collada'
import { Library } from './library'

/**
 * Provides a library in which to place <animation_clip> elements.
 */
export class LibraryAnimationClipss extends Library<null> {

  protected itemsTag: string = 'animation_clip'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element): null {
    // TODO:
    return null
  }
}
