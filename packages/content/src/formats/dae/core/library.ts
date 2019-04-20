import { Asset, parseAsset } from './asset'
import { COLLADA } from './collada'
import { Light } from './light'
import { DocumentCache, mapChild, mapChildren } from './utils'

export abstract class Library<T extends { id: string }> {

  private cache = new DocumentCache()

  public get id(): string {
    return this.el.getAttribute('id')
  }
  public get name(): string {
    return this.el.getAttribute('name')
  }
  public get asset(): Asset {
    return this.cache.get('asset', () => {
      return mapChild(this.el, 'asset', parseAsset)
    })
  }

  public get items(): T[] {
    return this.cache.get(this.itemsTag, () => {
      return mapChildren(this.el, this.itemsTag, (el) => this.parseItem(el))
    })
  }

  protected abstract itemsTag: string

  constructor(protected readonly doc: COLLADA, protected readonly el: Element) {

  }

  public byUriFragment(fragment: string): T {
    const parts = fragment.split('#')
    fragment = parts[parts.length - 1]
    return this.items.find((it) => it.id === fragment)
  }

  protected abstract parseItem(el: Element): T
}
