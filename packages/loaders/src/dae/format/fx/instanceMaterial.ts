import { COLLADA } from '../core/collada'
import { DocumentCache, mapChildren } from '../core/utils'
import { Material } from './material'

export class InstanceMaterial {
  private cache = new DocumentCache()

  /**
   * A text string value containing the scoped identifier of this element
   */
  public get sid(): string {
    return this.el.getAttribute('sid')
  }

  /**
   * The text string name of this element.
   */
  public get name(): string {
    return this.el.getAttribute('name')
  }

  /**
   * The URI of the location of the <material> element to instantiate. Required.
   * Can refer to a local instance or external reference.
   */
  public get target(): string {
    return this.el.getAttribute('target')
  }

  /**
   * Which symbol defined from within the geometry this material binds to.
   */
  public get symbol(): string {
    return this.el.getAttribute('symbol')
  }

  public get bind() {
    return this.cache.get('bind', () => mapChildren(this.el, 'bind', (el) => {
      return {
        semantic: el.getAttribute('semantic'),
        target: el.getAttribute('target'),
      }
    }))
  }

  public get bindVertexInput() {
    return this.cache.get('bind_vertex_input', () => mapChildren(this.el, 'bind_vertex_input', (el) => {
      return {
        semantic: el.getAttribute('semantic'),
        inputSemantic: el.getAttribute('input_semantic'),
        inputSet: el.getAttribute('input_set'),
      }
    }))
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }

  public getMaterial(): Promise<Material> {
    return this.cache.get('getMaterial', () => {
      return this.doc.docByUrl(this.target).then((doc) => {
        return (this.doc.libraryMaterials ? doc.libraryMaterials.byUriFragment(this.target) : null)
      })
    })
  }
}
