import { mapChildSimpleType } from './utils'

export function parseSetparam(el: Element) {
  return {
    ref: el.getAttribute('ref'),
    ...(
      mapChildSimpleType(el) || {
        type: 'unknown',
        value: null,
      }
    ),
  }
}

export interface Setparam {
  /**
   * References the ID of the predefined parameter that will have its value set.
   */
  ref: string
  /**
   * Name of the value type
   */
  type: string
  /**
   * The value to set
   */
  value: any
}
