import { Accessor } from './accessor'
import { Asset, parseAsset } from './asset'
import { COLLADA } from './collada'
import { DocumentCache, mapChild, mapQuerySelector } from './utils'

export class Source {
  private cache = new DocumentCache()

  /**
   * A text string containing the unique identifier of the element.
   */
  public get id(): string {
    return this.el.getAttribute('id')
  }

  /**
   * The text string name of this element.
   */
  public get name(): string {
    return this.el.getAttribute('name')
  }

  public get asset(): Asset {
    return this.cache.get('asset', () => {
      return mapChild(this.el, 'asset', parseAsset)
    })
  }

  public get accessor(): Accessor {
    return this.cache.get('accessor', () => {
      return mapQuerySelector(this.el, 'technique_common accessor', (el) => {
        return new Accessor(this.doc, el)
      })
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
