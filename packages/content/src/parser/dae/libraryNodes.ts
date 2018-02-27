import { Asset } from './asset'
import { COLLADA } from './collada'
import { Node } from './node'
import * as util from './utils'

export class LibraryNodes {
  private cache: any = {}
  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }

  public get asset(): Asset {
    return util.fromCache(this.cache, 'asset', () => {
      return util.mapChild(this.el, 'asset', (el) => new Asset(this.doc, el))
    })
  }

  public get nodes(): Node[] {
    return util.fromCache(this.cache, 'nodes', () => {
      return util.mapChildren(this.el, 'node', (el) => new Node(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {

  }

  public byUriFragment(fragment: string) {
    const parts = fragment.split('#')
    fragment = parts[parts.length - 1]
    return this.nodes.find((it) => it.id === fragment)
  }
}
