import { COLLADA } from './collada'
import { Light } from './light'
import * as util from './utils'

export class InstanceLight {
  private cache: any = {}
  public get sid(): string { return this.el.getAttribute('sid') }
  public get name(): string { return this.el.getAttribute('name') }
  public get url(): string { return this.el.getAttribute('url') }

  public getInstance(): Promise<Light> {
    return util.fromCache(this.cache, 'getInstance', () => {
      return this.doc.docByUrl(this.url).then((doc) => {
        return (this.doc.libraryLights ? doc.libraryLights.byUriFragment(this.url) : null)
      })
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
