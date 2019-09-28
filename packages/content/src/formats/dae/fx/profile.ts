import { Asset, parseAsset } from '../core/asset'
import { COLLADA } from '../core/collada'
import { DocumentCache, mapChild, mapChildren } from '../core/utils'
import { Code, parseCode } from './code'
import { Effect } from './effect'
import { Include, parseInclude } from './include'
import { Newparam, parseNewparam } from './newparam'
import { Technique } from './technique'

export class Profile {
  private cache = new DocumentCache()

  /**
   * A text string containing the unique identifier of the element.
   */
  public get id(): string {
    return this.el.getAttribute('id')
  }

  /**
   * The type of platform.
   *
   * @remarks
   * These are vendor-defined character strings that indicates the platforms or capability
   * targets for the technique. Enables support for multiple OpenGL ES 2.0 platforms.
   * This may target a specific piece of hardware or a hardware family
   */
  public get platforms(): string[] {
    return this.el.getAttribute('platforms').split(/\s+/)
  }

  /**
   * For resource management tracking.
   */
  public get asset(): Asset {
    return this.cache.get('asset', () => mapChild(this.el, 'asset', parseAsset))
  }

  /**
   * An embedded block of source code
   */
  public get code(): Code[] {
    return this.cache.get('code', () => mapChildren(this.el, 'code', parseCode))
  }

  /**
   * A block of source code referenced by URL.
   */
  public get include(): Include[] {
    return this.cache.get('include', () => mapChildren(this.el, 'include', parseInclude))
  }

  /**
   * Declarations of new parameters to feed the shaders.
   */
  public get newparam(): Newparam[] {
    return this.cache.get('newparam', () => mapChildren(this.el, 'newparam', parseNewparam))
  }

  public get technique(): Technique[] {
    return this.cache.get('technique', () => mapChildren(this.el, 'technique', (el) => {
      return new Technique(this.root, this, el)
    }))
  }

  constructor(public readonly root: COLLADA, public readonly parent: Effect, protected readonly el: Element) {
    //
  }
}

// tslint:disable-next-line
export class ProfileGLES2 extends Profile {

  /**
   * The shading language that is used. Current valid languages are GLSL-ES and CG.
   */
  public get language(): string {
    return this.el.getAttribute('language')
  }

  constructor(root: COLLADA, public readonly parent: Effect, el: Element) {
    super(root, parent, el)
  }
}

// tslint:disable-next-line
export class ProfileGLSL extends Profile {

  constructor(root: COLLADA, public readonly parent: Effect, el: Element) {
    super(root, parent, el)
  }
}
