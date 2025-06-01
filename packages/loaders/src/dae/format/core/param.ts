export interface Param<T = any> {
  name: string
  sid: string
  type: string
  semantic: string
  convert: (v: any) => T
}

export function parseParam(el: Element) {
  const type = el.getAttribute('type')
  return {
    name: el.getAttribute('name'),
    sid: el.getAttribute('sid'),
    type: type,
    semantic: el.getAttribute('semantic'),
    convert: (() => {
      if (type === 'float') {
        return Number
      }
      if (type === 'int') {
        return Number
      }
      if (type === 'bool') {
        return (v: any): boolean => v === 'true'
      }
      return (v: any): any => v
    })(),
  }
}
