import { COLLADA } from './collada'
import { Input } from './input'
import { Param } from './param'
import * as util from './utils'

function createCollector(doc: COLLADA, el: Element, type: string) {
  const primitives = util.mapChildren(el, 'p', util.textContentToNumberArray)
  const inputs = util.mapChildren(el, 'input', (it) => new Input(doc, it))
  const stride = inputs.reduce((max: number, i: Input) => Math.max(max, i.offset), 1) + 1
  return {
    type: type,
    name: el.getAttribute('name'),
    count: Number(el.getAttribute('count')),
    material: el.getAttribute('string'),
    inputs: inputs,
    collect: (collector: {
      param: (input: Input, param: Param, value: any) => void,
      endParam: () => void,
      endPrimitive: () => void,
      endPrimitiveList: () => void,
    }): void => {
      for (const list of primitives) {
        for (let i = 0; i < list.length; i += stride) {
          for (const input of inputs) {
            doc.getSource(input.source).accessor.access(list[i + input.offset], (param, value) => {
              collector.param(input, param, value)
            })
            collector.endParam()
          }
          collector.endPrimitive()
        }
        collector.endPrimitiveList()
      }
    },
  }
}

export class Mesh {
  private cache: any = {}

  public get lines() {
    return util.fromCache(this.cache, 'lines', () => {
      return util.mapChildren(this.el, 'lines', (el) => createCollector(this.doc, el, 'lines'))
    })
  }

  public get linestrips() {
    return util.fromCache(this.cache, 'linestrips', () => {
      return util.mapChildren(this.el, 'linestrips', (el) => createCollector(this.doc, el, 'linestrips'))
    })
  }

  public get polygons() {
    return util.fromCache(this.cache, 'polygons', () => {
      return util.mapChildren(this.el, 'polygons', (el) => null)
    })
  }

  public get polylist() {
    return util.fromCache(this.cache, 'polylist', () => {
      return util.mapChildren(this.el, 'polylist', (el) => null)
    })
  }

  public get triangles() {
    return util.fromCache(this.cache, 'triangles', () => {
      return util.mapChildren(this.el, 'triangles', (el) => createCollector(this.doc, el, 'triangles'))
    })
  }

  public get trifans() {
    return util.fromCache(this.cache, 'trifans', () => {
      return util.mapChildren(this.el, 'trifans', (el) => createCollector(this.doc, el, 'trifans'))
    })
  }

  public get tristrips() {
    return util.fromCache(this.cache, 'tristrips', () => {
      return util.mapChildren(this.el, 'tristrips', (el) => createCollector(this.doc, el, 'tristrips'))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
