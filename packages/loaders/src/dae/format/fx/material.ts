import { Asset, parseAsset } from '../core/asset'
import { COLLADA } from '../core/collada'
import { DocumentCache, mapChild } from '../core/utils'
import { InstanceEffect } from './instanceEffect'

export class Material {
  private cache = new DocumentCache()

  /**
   * A text string containing the unique identifier of the element
   */
  public get id(): string {
    return this.el.getAttribute('id')
  }

  /**
   * The text string name of this element
   */
  public get name(): string {
    return this.el.getAttribute('name')
  }

  public get asset(): Asset | null {
    return this.cache.get('asset', () => mapChild(this.el, 'asset', parseAsset))
  }

  public get instanceEffect(): InstanceEffect {
    return this.cache.get('instance_effect', () => mapChild(this.el, 'instance_effect', (el) => new InstanceEffect(this.doc, el)))
  }

  public constructor(private doc: COLLADA, private el: Element) {

  }
}
