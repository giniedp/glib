import { mapChild, textContent } from '../core/utils'

export function parseBindAttribute(el: Element): BindAttribute {
  return {
    symbol: el.getAttribute('symbol'),
    semantic: mapChild(el, 'semantic', textContent),
  }
}

export interface BindAttribute {
  symbol: string
  semantic: string
}
