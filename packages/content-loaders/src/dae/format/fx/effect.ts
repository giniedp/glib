import { Asset, parseAsset } from '../core/asset'
import { COLLADA } from '../core/collada'
import { DocumentCache, mapChild, mapChildren } from '../core/utils'
import { Annotate, parseAnnotate } from './annotate'
import { Newparam, parseNewparam } from './newparam'
import { ProfileGLES2, ProfileGLSL } from './profile'
import { ProfileCommon } from './profileCommon'

export class Effect {
  private cache = new DocumentCache()

  /**
   * Global identifier for this object
   */
  public get id(): string {
    return this.el.getAttribute('id')
  }

  /**
   * Pretty-print name for this effect
   */
  public get name(): string {
    return this.el.getAttribute('name')
  }

  public get asset(): Asset | null {
    return this.cache.get('asset', () => mapChild(this.el, 'asset', parseAsset))
  }

  public get annotations(): Annotate[] {
    return this.cache.get('annotate', () => mapChildren(this.el, 'annotate', parseAnnotate))
  }

  public get newparams(): Newparam[] {
    return this.cache.get('newparam', () => mapChildren(this.el, 'newparam', parseNewparam))
  }

  public get profileCommon() {
    return this.cache.get('profile_COMMON', () => mapChild(this.el, 'profile_COMMON', (el) => {
      return new ProfileCommon(this.doc, el)
    }))
  }

  public get profileGLES2() {
    return this.cache.get('profile_GLES2', () => mapChild(this.el, 'profile_GLES2', (el) => {
      return new ProfileGLES2(this.doc, this, el)
    }))
  }

  public get profileGLSL() {
    return this.cache.get('profile_GLES2', () => mapChild(this.el, 'profile_GLES2', (el) => {
      return new ProfileGLSL(this.doc, this, el)
    }))
  }

  public constructor(private doc: COLLADA, private el: Element) {

  }
}
