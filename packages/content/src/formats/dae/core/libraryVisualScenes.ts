import { COLLADA } from './collada'
import { Library } from './library'
import { VisualScene } from './visualScene'

/**
 * Provides a library in which to place <visual_scene> elements.
 */
export class LibraryVisualScenes extends Library<VisualScene> {

  protected itemsTag: string = 'visual_scene'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element) {
    return new VisualScene(this.doc, el)
  }
}
