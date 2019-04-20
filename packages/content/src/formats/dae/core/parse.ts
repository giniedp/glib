import { COLLADA } from './collada'

export function parse(data: any) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(data, 'application/xml')
  return new COLLADA(doc, doc.querySelector('COLLADA'))
}
