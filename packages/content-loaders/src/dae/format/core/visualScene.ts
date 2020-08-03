import { Asset, parseAsset } from './asset'
import { COLLADA } from './collada'
import { Node } from './node'
import { DocumentCache, mapChild, mapChildren } from './utils'

export class VisualScene {
  private cache = new DocumentCache()
  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }

  public get asset(): Asset {
    return this.cache.get('asset', () => {
      return mapChild(this.el, 'asset', parseAsset)
    })
  }

  public get nodes(): Node[] {
    return this.cache.get('nodes', () => {
      return mapChildren(this.el, 'node', (el) => new Node(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
