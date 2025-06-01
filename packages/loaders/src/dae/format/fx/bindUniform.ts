import { mapChild, parseSimpleType } from '../core/utils'

export function parseBindUniform(el: Element): BindUniform {
  const ref = mapChild(el, 'param', (e) => e.getAttribute('ref'))
  const st = ref ? {} : parseSimpleType(el.firstElementChild)
  return {
    symbol: el.getAttribute('symbol'),
    paramRef: ref,
    ...st,
  }
}

export interface BindUniform {
  symbol: string
  type?: string
  value?: any
  paramRef?: string
}
