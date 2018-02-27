import { LibraryCameras } from './libraryCameras'
import { LibraryGeometries } from './libraryGeometries'
import { LibraryLights } from './libraryLights'
import { LibraryNodes } from './libraryNodes'
import { LibraryVisualScenes } from './libraryVisualScenes'
import Scene from './scene'
import Source from './source'
import * as util from './utils'

export class COLLADA {

  public static parse(data: any) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(data, 'application/xml')
    return new COLLADA(doc, doc.querySelector('COLLADA'))
  }

  private cache: any = {}
  private $queryCache: any = {}
  public getCachedData(selector: string, transform: (el: Element) => any) {
    if (this.$queryCache[selector] === undefined) {
      const el = this.doc.querySelector(selector)
      this.$queryCache[selector] = el ? transform(el) : null
    }
    return this.$queryCache[selector]
  }

  public get libraryCameras(): LibraryCameras {
    return util.fromCache(this.cache, 'libraryCameras', () => {
      return util.mapChild(this.el, 'library_cameras', (el) => new LibraryCameras(this, el))
    })
  }

  public get libraryVisualScenes(): LibraryVisualScenes {
    return util.fromCache(this.cache, 'libraryVisualScenes', () => {
      return util.mapChild(this.el, 'library_visual_scenes', (el) => new LibraryVisualScenes(this, el))
    })
  }

  public get libraryGeometries(): LibraryGeometries {
    return util.fromCache(this.cache, 'libraryGeometries', () => {
      return util.mapChild(this.el, 'library_geometries', (el) => new LibraryGeometries(this, el))
    })
  }

  public get libraryNodes(): LibraryNodes {
    return util.fromCache(this.cache, 'libraryNodes', () => {
      return util.mapChild(this.el, 'library_nodes', (el) => new LibraryNodes(this, el))
    })
  }

  public get libraryLights(): LibraryLights {
    return util.fromCache(this.cache, 'libraryLights', () => {
      return util.mapChild(this.el, 'library_lights', (el) => new LibraryLights(this, el))
    })
  }

  public get scene(): Scene {
    return util.fromCache(this.cache, 'scene', () => {
      return util.mapChild(this.el, 'scene', (el) => new Scene(this, el))
    })
  }

  constructor(public doc: Document, public el: Element) {

  }

  public getSource(uriFragment: string): Source {
    return this.getCachedData(util.escapeUriFragment(uriFragment), (el) => {
      if (el.tagName === 'vertices') {
        uriFragment = el.querySelector('input[semantic=POSITION]').getAttribute('source')
        el = this.doc.querySelector(util.escapeUriFragment(uriFragment))
      }
      return new Source(this, el)
    })
  }

  public getSourceData(selector: string): any[] {
    return this.getCachedData(util.escapeUriFragment(selector), util.textContentToArray) || []
  }

  public docByUrl(urlWithFragment: string): Promise<COLLADA> {
    if (urlWithFragment.indexOf('#') === -1) {
      return Promise.resolve(this)
    }
    throw new Error('addressing external collada documents is not supported yet')
  }
}
