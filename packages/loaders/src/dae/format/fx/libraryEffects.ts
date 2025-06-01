import { COLLADA } from '../core/collada'
import { Library } from '../core/library'
import { Effect } from './effect'

/**
 * Provides a library in which to place <visual_scene> elements.
 */
export class LibraryEffects extends Library<Effect> {

  protected itemsTag: string = 'effect'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element) {
    return new Effect(this.doc, el)
  }
}
