import { COLLADA } from './collada'
import { Param } from './param'
import * as util from './utils'

export class Accessor {
  private cache: any = {}

  public get count(): number { return Number(this.el.getAttribute('count')) }
  public get offset(): number { return Number(this.el.getAttribute('offset')) || 0 }
  public get source(): string { return this.el.getAttribute('source') }
  public get stride(): number { return Number(this.el.getAttribute('stride')) || 1 }

  public get params(): Param[] {
    return util.fromCache(this.cache, 'params', () => {
      return util.mapChildren(this.el, 'param', (el) => new Param(this.doc, el))
    })
  }

  public get sourceData(): any[] {
    return this.doc.getSourceData(this.source)
  }

  constructor(private doc: COLLADA, private el: Element) {

  }

  public access(index: number, cb: (param: Param, value: any) => void) {
    let pIndex = 0
    this.params.forEach((param) => {
      cb(param, param.convert(this.sourceData[this.offset + index * this.stride + pIndex]))
      pIndex++
    })
  }

  public accessElement(index: number): any {
    const result: any = {}
    this.access(index, (p, e) => result[p.name] = p.convert(e))
    return result
  }
}
