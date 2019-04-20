import { COLLADA } from './collada'
import { Input } from './input'
import { Param } from './param'
import { DocumentCache, mapChildren, textContentToNumberArray } from './utils'

function createBuilder(doc: COLLADA, el: Element, type: GeometryType): MeshBuilderDef {
  const primitives = mapChildren(el, 'p', textContentToNumberArray)
  const inputs = mapChildren(el, 'input', (it) => new Input(doc, it))
  const stride = inputs.reduce((max: number, i: Input) => Math.max(max, i.offset), 1) + 1
  return {
    type: type,
    name: el.getAttribute('name'),
    count: Number(el.getAttribute('count')),
    material: el.getAttribute('material'),
    inputs: inputs,
    build: (builder: MeshBuilder): void => {
      for (const list of primitives) {
        for (let i = 0; i < list.length; i += stride) {
          const hash = []
          for (const input of inputs) {
            const index = list[i + input.offset]
            hash.push(index)
            doc.getSource(input.source).accessor.access(index, (param, value) => {
              builder.param(input, param, value)
            })
            builder.endAttribute()
          }
          builder.endVertex(hash)
        }
        builder.endPrimitive()
      }
    },
  }
}

export type GeometryType = 'lines' | 'linestrips' | 'polygons' | 'triangles' | 'trifans' | 'tristrips'

export interface MeshBuilderDef {
  type: GeometryType
  name: string
  count: number
  material: string
  inputs: Input[]
  build: (collector: MeshBuilder) => void
}

export interface MeshBuilder {
  param: (input: Input, param: Param, value: any) => void,
  endAttribute: () => void,
  endVertex: (hash?: number[]) => void,
  endPrimitive: () => void,
}

export class Mesh {
  private cache = new DocumentCache()

  public get lines() {
    return this.cache.get('lines', () => {
      return mapChildren(this.el, 'lines', (el) => createBuilder(this.doc, el, 'lines'))
    })
  }

  public get linestrips() {
    return this.cache.get('linestrips', () => {
      return mapChildren(this.el, 'linestrips', (el) => createBuilder(this.doc, el, 'linestrips'))
    })
  }

  public get polygons() {
    return this.cache.get('polygons', () => {
      return mapChildren(this.el, 'polygons', (el) => null)
    })
  }

  public get polylist() {
    return this.cache.get('polylist', () => {
      return mapChildren(this.el, 'polylist', (el) => createBuilder(this.doc, el, 'triangles'))
    })
  }

  public get triangles() {
    return this.cache.get('triangles', () => {
      return mapChildren(this.el, 'triangles', (el) => createBuilder(this.doc, el, 'triangles'))
    })
  }

  public get trifans() {
    return this.cache.get('trifans', () => {
      return mapChildren(this.el, 'trifans', (el) => createBuilder(this.doc, el, 'trifans'))
    })
  }

  public get tristrips() {
    return this.cache.get('tristrips', () => {
      return mapChildren(this.el, 'tristrips', (el) => createBuilder(this.doc, el, 'tristrips'))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
