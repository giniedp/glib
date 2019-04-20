import { Asset, parseAsset } from '../core/asset'
import { COLLADA } from '../core/collada'
import { DocumentCache, mapChild, mapChildren } from '../core/utils'
import { Annotate, parseAnnotate } from './annotate'
import { Pass } from './pass'
import { Profile } from './profile'

export class Technique {
  private cache = new DocumentCache()

  /**
   * A text string containing the unique identifier of the element.
   */
  public get id(): string {
    return this.el.getAttribute('id')
  }

  /**
   * A text string value containing the scoped identifier of this element.
   * This value must be unique within the scope of the parent element
   */
  public get sid(): string {
    return this.el.getAttribute('sid')
  }

  /**
   * For resource management tracking.
   */
  public get asset(): Asset {
    return this.cache.get('asset', () => mapChild(this.el, 'asset', parseAsset))
  }

  public get annotate(): Annotate[] {
    return this.cache.get('annotate', () => mapChildren(this.el, 'annotate', parseAnnotate))
  }

  public get pass(): Pass[] {
    return this.cache.get('pass', () => mapChildren(this.el, 'pass', (el) => new Pass(this.root, this, el)))
  }

  constructor(public readonly root: COLLADA, public readonly parent: Profile, private el: Element) {
    //
  }
}
