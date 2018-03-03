import { COLLADA } from './collada'
import { Geometry } from './geometry'
import * as util from './utils'

export class InstanceGeometry {
  private cache: any = {}
  public get sid(): string { return this.el.getAttribute('sid') }
  public get name(): string { return this.el.getAttribute('name') }
  public get url(): string { return this.el.getAttribute('url') }

  public getInstance(): Promise<Geometry> {
    return util.fromCache(this.cache, 'getInstance', () => {
      return this.doc.docByUrl(this.url).then((doc) => {
        return (this.doc.libraryGeometries ? doc.libraryGeometries.byUriFragment(this.url) : null)
      })
    })
  }

  // TODO: bind material
  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}