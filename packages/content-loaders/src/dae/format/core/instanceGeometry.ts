import { BindMaterial } from '../fx/bindMaterial'
import { COLLADA } from './collada'
import { Geometry } from './geometry'
import { DocumentCache, mapChild } from './utils'

export class InstanceGeometry {
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
   * The URL of the location of the <geometry> element to instantiate. Required. Can refer to a local instance or external reference.
   */
  public get url(): string {
    return this.el.getAttribute('url')
  }

  /**
   * Binds material symbols to material instances.
   *
   * @remarks
   * This allows a single geometry to be instantiated into a scene multiple times each
   * with a different appearance.
   */
  public get bindMaterial(): BindMaterial {
    return this.cache.get('bind_material', () => mapChild(this.el, 'bind_material', (el) => new BindMaterial(this.doc, el)))
  }

  public getGeometry(): Promise<Geometry> {
    return this.cache.get('geometry', async () => {
      const doc = await this.doc.docByUrl(this.url)
      return doc.libraryGeometries ? doc.libraryGeometries.byUriFragment(this.url) : null
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
