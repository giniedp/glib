import { Asset } from './asset'
import { COLLADA } from './collada'
import * as util from './utils'
import { VisualScene } from './visualScene'

export class LibraryVisualScenes {
  private cache: any = {}
  public getAsset(): Asset {
    return util.fromCache(this.cache, 'asset', () => {
      return util.mapChild(this.el, 'asset', (el) => new Asset(this.doc, el))
    })
  }

  public get visualScenes(): VisualScene[] {
    return util.fromCache(this.cache, 'visualScenes', () => {
      return util.mapChildren(this.el, 'visual_scene', (el) => new VisualScene(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {

  }

  public byUriFragment(fragment: string) {
    const parts = fragment.split('#')
    fragment = parts[parts.length - 1]
    return this.visualScenes.find((it) => it.id === fragment)
  }
}
