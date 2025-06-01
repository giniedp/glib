import { mapChild, textContentToNumber } from '../core/utils'

export function parseCommonFloatOrParam(el: Element): CommonFloatOrParam {
  return {
    value: mapChild(el, 'float', textContentToNumber),
    ref:  mapChild(el, 'param', (e) => e.getAttribute('ref')),
  }
}

export interface CommonFloatOrParam {
  value?: number
  ref?: string
}
