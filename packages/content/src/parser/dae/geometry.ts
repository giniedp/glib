import { Asset } from './asset'
import { COLLADA } from './collada'
import { Mesh } from './mesh'
import * as util from './utils'

export class Geometry {
  private cache: any = {}
  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }

  public get asset(): Asset {
    return util.fromCache(this.cache, 'asset', () => {
      return util.mapChild(this.el, 'asset', (el) => new Asset(this.doc, el))
    })
  }

  public get convexMesh() {
    return util.fromCache(this.cache, 'convexMesh', () => {
      return util.mapChild(this.el, 'convex_mesh', (el) => { throw new Error('convex mesh is not supported yet') })
    })
  }

  public get spline() {
    return util.fromCache(this.cache, 'spline', () => {
      return util.mapChild(this.el, 'spline', (el) => { throw new Error('splines are not supported yet') })
    })
  }

  public get brep() {
    return util.fromCache(this.cache, 'brep', () => {
      return util.mapChild(this.el, 'brep', (el) => { throw new Error('brep is not supported yet') })
    })
  }

  public get mesh(): Mesh {
    return util.fromCache(this.cache, 'mesh', () => {
      return util.mapChild(this.el, 'mesh', (el) => new Mesh(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
