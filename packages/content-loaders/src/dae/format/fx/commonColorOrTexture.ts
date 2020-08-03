import { mapChild, textContentToNumberArray } from '../core/utils'

export function parseCommonColorOrTexture(el: Element): CommonColorOrTextureType {
  return {
    color: mapChild(el, 'color', textContentToNumberArray),
    ref:  mapChild(el, 'param', (e) => e.getAttribute('ref')),
  }
}

export interface CommonColorOrTextureType {
  color?: number[]
  ref?: string
  // texture?:
}
