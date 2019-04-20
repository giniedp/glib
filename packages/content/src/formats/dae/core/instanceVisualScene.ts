import { COLLADA } from './collada'
import { DocumentCache, mapChild, mapChildren } from './utils'
import { VisualScene } from './visualScene'

export class InstanceVisualScene {
  private cache = new DocumentCache()

  /**
   * A text string value containing the scoped identifier of this element.
   * This value must be unique within the scope of the parent element.
   */
  public get sid(): string { return this.el.getAttribute('sid') }

  /**
   * The text string name of this element.
   */
  public get name(): string { return this.el.getAttribute('name') }

  /**
   * The URL of the location of the <visual_scene> element to instantiate.
   * Can refer to a local instance or external reference.
   */
  public get url(): string { return this.el.getAttribute('url') }

  public getScene(): Promise<VisualScene> {
    return this.cache.get('getScene', () => {
      return this.doc.docByUrl(this.url).then((doc) => {
        return (this.doc.libraryGeometries ? doc.libraryVisualScenes.byUriFragment(this.url) : null)
      })
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
