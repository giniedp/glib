import { mapChild, mapChildren, mapChildSimpleType, textContent } from '../core/utils'
import { Annotate, parseAnnotate } from './annotate'

export function parseNewparam(el: Element): Newparam {
  return {
    sid: el.getAttribute('sid'),
    annotations: mapChildren(el, 'annotate', parseAnnotate),
    semantic: mapChild(el, 'semantic', textContent),
    modifier: mapChild(el, 'modifier', textContent),
    ...(
      mapChildSimpleType(el) || {
        type: 'unknown',
        value: null,
      }
    ),
  }
}

export interface Newparam {
  sid: string
  annotations: Annotate[]
  semantic: string
  modifier: string
  type: string
  value: any
}
