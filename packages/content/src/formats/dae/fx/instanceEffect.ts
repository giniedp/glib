import { COLLADA } from '../core/collada'
import { DocumentCache, mapChildren, mapChildSimpleType } from '../core/utils'
import { Effect } from './effect'

/**
 * Instantiates a COLLADA effect.
 */
export class InstanceEffect {
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
   * The URI of the location of the <effect> element to instantiate.
   * Can refer to a local instance or external reference.
   */
  public get url(): string { return this.el.getAttribute('url') }

  public get techniqueHints() {
    return mapChildren(this.el, 'technique_hint', (child) => {
      return {
        platform: child.getAttribute('platform'),
        ref: child.getAttribute('ref'),
        profile: child.getAttribute('profile'),
      }
    })
  }

  public get setparam() {
    return mapChildren(this.el, 'setparam', (child) => {
      return {
        ref: child.getAttribute('ref'),
        ...(
          mapChildSimpleType(child) || {
            type: 'unknown',
            value: null,
          }
        ),
      }
    })
  }

  constructor(private doc: COLLADA, private el: Element) {

  }

  public getEffect(): Promise<Effect> {
    return this.cache.get('getEffect', () => {
      return this.doc.docByUrl(this.url).then((doc) => {
        return (this.doc.libraryEffects ? doc.libraryEffects.byUriFragment(this.url) : null)
      })
    })
  }
}
