import { Asset } from './asset'
import { COLLADA } from './collada'
import * as util from './utils'

export class Camera {
  private cache: any = {}

  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }

  public get asset(): Asset {
    return util.fromCache(this.cache, 'asset', () => {
      return util.mapChild(this.el, 'asset', (el) => new Asset(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
