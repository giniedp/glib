import { COLLADA } from './collada'
import { Param, parseParam } from './param'
import { DocumentCache, mapChildren } from './utils'

export class Accessor {
  private cache = new DocumentCache()

  /**
   * The number of times the array is accessed
   */
  public get count(): number {
    return Number(this.el.getAttribute('count'))
  }

  /**
   * The index of the first value to be read from the array. The default is 0.
   */
  public get offset(): number {
    return Number(this.el.getAttribute('offset')) || 0
  }

  /**
   * The location of the array to access using a URI expression.
   * This element may refer to a COLLADA array element or to an array data source outside the
   * scope of the instance document; the source does not need to be a COLLADA document.
   */
  public get source(): string {
    return this.el.getAttribute('source')
  }

  /**
   * The number of values that are to be considered a unit during each access to the array.
   * The default is 1, indicating that a single value is accessed.
   */
  public get stride(): number {
    return Number(this.el.getAttribute('stride')) || 1
  }

  public get params(): Param[] {
    return this.cache.get('params', () => mapChildren(this.el, 'param', parseParam))
  }

  public get sourceData(): any[] {
    return this.doc.getSourceData(this.source)
  }

  constructor(private doc: COLLADA, private el: Element) {

  }

  /**
   * Performs an access into the source data
   *
   * @param index - The index at which the access is performed
   * @param emit - Callback function that is called for each `param` with its value
   */
  public access(index: number, emit: (param: Param, value: any) => void): void {
    this.params.forEach((param, i) => {
      emit(param, param.convert(this.sourceData[this.offset + index * this.stride + i]))
    })
  }

  /**
   * Performs an access into the source data
   *
   * @remarks
   * In contrast to `access` this will return a plain object where each param.name
   * is mapped to a value
   *
   * @param index - The index at which the access is performed
   */
  public accessElement(index: number): any {
    const result: any = {}
    this.access(index, (p, e) => result[p.name] = p.convert(e))
    return result
  }
}
