import { Asset } from './asset'
import { Camera } from './camera'
import { COLLADA } from './collada'
import * as util from './utils'

export class LibraryCameras {
  private cache: any = {}
  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }

  public get asset(): Asset {
    return util.fromCache(this.cache, 'asset', () => {
      return util.mapChild(this.el, 'asset', (el) => new Asset(this.doc, el))
    })
  }

  public get cameras(): Camera[] {
    return util.fromCache(this.cache, 'cameras', () => {
      return util.mapChildren(this.el, 'camera', (el) => new Camera(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {

  }

  public byUriFragment(fragment: string) {
    const parts = fragment.split('#')
    fragment = parts[parts.length - 1]
    return this.cameras.find((it) => it.id === fragment)
  }
}
