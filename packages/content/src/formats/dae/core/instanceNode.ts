import { COLLADA } from './collada'
import { Node } from './node'
import { DocumentCache } from './utils'

export class InstanceNode {
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
   * The URL of the location of the <node> element to instantiate.
   * Can refer to a local instance or external reference.
   */
  public get url(): string { return this.el.getAttribute('url') }

  /**
   * The mechanism and use of this attribute is application-defined.
   * For example, it can be used for bounding boxes or level of detail
   */
  public get proxy(): string { return this.el.getAttribute('proxy') }

  public getNode(): Promise<Node> {
    return this.cache.get('getNode', () => {
      return this.doc.docByUrl(this.url).then((doc) => {
        return (this.doc.libraryNodes ? doc.libraryNodes.byUriFragment(this.url) : null)
      })
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
