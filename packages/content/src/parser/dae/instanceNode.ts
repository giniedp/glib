import { COLLADA } from './collada'
import { Node } from './node'
import * as util from './utils'

export class InstanceNode {
  private cache: any = {}
  public get sid(): string { return this.el.getAttribute('sid') }
  public get name(): string { return this.el.getAttribute('name') }
  public get url(): string { return this.el.getAttribute('url') }
  public get proxy(): string { return this.el.getAttribute('proxy') }

  private $instance: Promise<Node>
  public getInstance(): Promise<Node> {
    return util.fromCache(this.cache, 'getInstance', () => {
      return this.doc.docByUrl(this.url).then((doc) => {
        return (this.doc.libraryNodes ? doc.libraryNodes.byUriFragment(this.url) : null)
      })
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
