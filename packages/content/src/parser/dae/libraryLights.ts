import { Asset } from './asset'
import { COLLADA } from './collada'
import { Light } from './light'
import * as util from './utils'

export class LibraryLights {
  private cache: any = {}
  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }

  public get asset(): Asset {
    return util.fromCache(this.cache, 'asset', () => {
      return util.mapChild(this.el, 'asset', (el) => new Asset(this.doc, el))
    })
  }

  public get lights(): Light[] {
    return util.fromCache(this.cache, 'lights', () => {
      return util.mapChildren(this.el, 'light', (el) => new Light(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {

  }

  public byUriFragment(fragment: string) {
    const parts = fragment.split('#')
    fragment = parts[parts.length - 1]
    return this.lights.find((it) => it.id === fragment)
  }
}
