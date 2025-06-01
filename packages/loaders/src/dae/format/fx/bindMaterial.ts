import { COLLADA } from '../core/collada'
import { parseParam } from '../core/param'
import { DocumentCache, mapChildren, mapQuerySelectorAll } from '../core/utils'
import { InstanceMaterial } from './instanceMaterial'

export class BindMaterial {
  private cache = new DocumentCache()

  public get params() {
    return this.cache.get('params', () => mapChildren(this.el, 'param', parseParam))
  }

  public get techniqueCommonInstanceMaterial() {
    return this.cache.get('technique_common instance_material', (key) => {
      return mapQuerySelectorAll(this.el, key, (el) => new InstanceMaterial(this.doc, el))
    })
  }

  public constructor(private doc: COLLADA, private el: Element) {

  }
}
