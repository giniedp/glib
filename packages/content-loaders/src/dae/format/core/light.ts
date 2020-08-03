import { Asset, parseAsset } from './asset'
import { COLLADA } from './collada'
import { DocumentCache, mapChild } from './utils'

export class Light {
  private cache = new DocumentCache()
  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }

  public get asset(): Asset {
    return this.cache.get('asset', () => {
      return mapChild(this.el, 'asset', parseAsset)
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
