import { COLLADA } from '../core/collada'
import { DocumentCache, mapChildren } from '../core/utils'
import { Annotate, parseAnnotate } from './annotate'
import { parseStates, States } from './state'
import { Technique } from './technique'

export class Pass {
  private cache = new DocumentCache()

  /**
   * A text string value containing the scoped identifier of this element.
   * This value must be unique within the scope of the parent element
   */
  public get sid(): string {
    return this.el.getAttribute('sid')
  }

  public get annotate(): Annotate[] {
    return this.cache.get('annotate', () => mapChildren(this.el, 'annotate', parseAnnotate))
  }

  public get states(): States[] {
    return this.cache.get('states', () => mapChildren(this.el, 'states', parseStates))
  }

  public get program(): States[] {
    return this.cache.get('program', () => mapChildren(this.el, 'program', parseStates))
  }

  constructor(private root: COLLADA, public readonly parent: Technique, private el: Element) {
    //
  }
}
