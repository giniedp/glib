import { Effect } from '../fx/effect'
import { Image } from '../fx/image'
import { LibraryEffects } from '../fx/libraryEffects'
import { LibraryImages } from '../fx/libraryImages'
import { LibraryMaterials } from '../fx/libratyMaterials'
import { Material } from '../fx/material'
import { Camera } from './camera'
import { Geometry } from './geometry'
import { LibraryAnimationClipss } from './libraryAnimationClips'
import { LibraryAnimations } from './libraryAnimations'
import { LibraryCameras } from './libraryCameras'
import { LibraryControllers } from './libraryControllers'
import { LibraryGeometries } from './libraryGeometries'
import { LibraryLights } from './libraryLights'
import { LibraryNodes } from './libraryNodes'
import { LibraryVisualScenes } from './libraryVisualScenes'
import { Light } from './light'
import { Node } from './node'
import { Scene } from './scene'
import { Source } from './source'
import { DocumentCache, escapeUriFragment, mapChild, mapQuerySelector, textContentToArray } from './utils'
import { VisualScene } from './visualScene'

export class COLLADA {

  public static parse(data: Document | string) {
    if (data instanceof Document) {
      return new COLLADA(data)
    } else if (typeof data === 'string') {
      return new COLLADA(new DOMParser().parseFromString(data, 'application/xml'))
    } else {
      throw new Error('unsupported data type')
    }
  }

  private cache = new DocumentCache()

  public get libraryAnimationClips(): LibraryAnimationClipss {
    return this.cache.get('library_animation_clips', (key) => {
      return mapChild(this.el, key, (el) => new LibraryAnimationClipss(this, el))
    })
  }

  public get libraryAnimations(): LibraryAnimations {
    return this.cache.get('library_animations', (key) => {
      return mapChild(this.el, key, (el) => new LibraryAnimations(this, el))
    })
  }

  public get libraryCameras(): LibraryCameras {
    return this.cache.get('library_cameras', (key) => {
      return mapChild(this.el, key, (el) => new LibraryCameras(this, el))
    })
  }

  public get libraryControllers(): LibraryControllers {
    return this.cache.get('library_controllers', (key) => {
      return mapChild(this.el, key, (el) => new LibraryControllers(this, el))
    })
  }

  public get libraryVisualScenes(): LibraryVisualScenes {
    return this.cache.get('library_visual_scenes', (key) => {
      return mapChild(this.el, key, (el) => new LibraryVisualScenes(this, el))
    })
  }

  public get libraryGeometries(): LibraryGeometries {
    return this.cache.get('library_geometries', (key) => {
      return mapChild(this.el, key, (el) => new LibraryGeometries(this, el))
    })
  }

  public get libraryNodes(): LibraryNodes {
    return this.cache.get('library_nodes', (key) => {
      return mapChild(this.el, key, (el) => new LibraryNodes(this, el))
    })
  }

  public get libraryLights(): LibraryLights {
    return this.cache.get('library_lights', (key) => {
      return mapChild(this.el, key, (el) => new LibraryLights(this, el))
    })
  }

  public get libraryMaterials(): LibraryMaterials {
    return this.cache.get('library_materials', (key) => {
      return mapChild(this.el, key, (el) => new LibraryMaterials(this, el))
    })
  }

  public get libraryEffects(): LibraryEffects {
    return this.cache.get('library_effects', (key) => {
      return mapChild(this.el, key, (el) => new LibraryEffects(this, el))
    })
  }

  public get libraryImages(): LibraryImages {
    return this.cache.get('library_images', (key) => {
      return mapChild(this.el, key, (el) => new LibraryImages(this, el))
    })
  }

  public get scene(): Scene {
    return this.cache.get('scene', (key) => {
      return mapChild(this.el, key, (el) => new Scene(this, el))
    })
  }

  constructor(public doc: Document, public el: Element = doc.querySelector('COLLADA')) {

  }

  private sourceCache = new DocumentCache()
  public getSource(uriFragment: string): Source {
    const escapedUriFragment = escapeUriFragment(uriFragment)
    return this.sourceCache.get(escapedUriFragment, () => {
      let el = this.doc.querySelector(escapedUriFragment)
      if (!el) {
        return null
      }
      if (el.tagName === 'vertices') {
        uriFragment = el.querySelector('input[semantic=POSITION]').getAttribute('source')
        el = this.doc.querySelector(escapeUriFragment(uriFragment))
      }
      return new Source(this, el)
    })
  }

  private sourceDataCache = new DocumentCache()
  public getSourceData(selector: string): any[] {
    selector = escapeUriFragment(selector)
    return this.sourceDataCache.get(selector, () => {
      return mapQuerySelector(this.el, selector, textContentToArray) || []
    })
  }

  public docByUrl(urlWithFragment: string): Promise<COLLADA> {
    const fragmentBegin = urlWithFragment.indexOf('#')
    if (fragmentBegin <= 0) {
      return Promise.resolve(this)
    }
    // TODO: return this.resolver(urlWithFragment.substring(0, fragmentBegin))
    throw new Error('addressing external collada documents is not supported yet')
  }

  public async getCamera(uri: string): Promise<Camera> {
    const doc = await this.docByUrl(uri)
    return doc.libraryCameras ? doc.libraryCameras.byUriFragment(uri) : null
  }

  public async getVisualScene(uri: string): Promise<VisualScene> {
    const doc = await this.docByUrl(uri)
    return doc.libraryVisualScenes ? doc.libraryVisualScenes.byUriFragment(uri) : null
  }

  public async getGeometry(uri: string): Promise<Geometry> {
    const doc = await this.docByUrl(uri)
    return doc.libraryGeometries ? doc.libraryGeometries.byUriFragment(uri) : null
  }

  public async getNode(uri: string): Promise<Node> {
    const doc = await this.docByUrl(uri)
    return doc.libraryNodes ? doc.libraryNodes.byUriFragment(uri) : null
  }

  public async getLight(uri: string): Promise<Light> {
    const doc = await this.docByUrl(uri)
    return doc.libraryLights ? doc.libraryLights.byUriFragment(uri) : null
  }

  public async getMaterial(uri: string): Promise<Material> {
    const doc = await this.docByUrl(uri)
    return doc.libraryMaterials ? doc.libraryMaterials.byUriFragment(uri) : null
  }

  public async getEffect(uri: string): Promise<Effect> {
    const doc = await this.docByUrl(uri)
    return doc.libraryEffects ? doc.libraryEffects.byUriFragment(uri) : null
  }

  public async getImage(uri: string): Promise<Image> {
    const doc = await this.docByUrl(uri)
    return doc.libraryImages ? doc.libraryImages.byUriFragment(uri) : null
  }
}
