import { Asset, parseAsset } from './asset'
import { COLLADA } from './collada'
import { Mesh } from './mesh'
import { DocumentCache, mapChild } from './utils'

/**
 * Describes the visual shape and appearance of an object in a scene.
 */
export class Geometry {
  private cache = new DocumentCache()

  /**
   * A text string containing the unique identifier of the <geometry> element.
   * This value must be unique within the instance document.
   */
  public get id(): string { return this.el.getAttribute('id') }

  /**
   * A text string containing the name of this element.
   */
  public get name(): string { return this.el.getAttribute('name') }

  /**
   * The asset metadata
   */
  public get asset(): Asset {
    return this.cache.get('asset', () => mapChild(this.el, 'asset', parseAsset))
  }

  public get convexMesh() {
    return this.cache.get('convexMesh', () => {
      return mapChild(this.el, 'convex_mesh', (el) => { throw new Error('convex mesh is not supported yet') })
    })
  }

  public get spline() {
    return this.cache.get('spline', () => {
      return mapChild(this.el, 'spline', (el) => { throw new Error('splines are not supported yet') })
    })
  }

  public get brep() {
    return this.cache.get('brep', () => {
      return mapChild(this.el, 'brep', (el) => { throw new Error('brep is not supported yet') })
    })
  }

  public get mesh(): Mesh {
    return this.cache.get('mesh', () => mapChild(this.el, 'mesh', (el) => new Mesh(this.doc, el)))
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
