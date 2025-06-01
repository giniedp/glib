import { COLLADA } from '../core/collada'
import { Library } from '../core/library'
import { Material } from './material'

/**
 * Provides a library in which to place <material> elements.
 */
export class LibraryMaterials extends Library<Material> {

  protected itemsTag: string = 'material'

  constructor(doc: COLLADA, el: Element) {
    super(doc, el)
  }

  protected parseItem(el: Element) {
    return new Material(this.doc, el)
  }
}
