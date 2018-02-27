import { COLLADA } from './collada'
import * as util from './utils'
import { VisualScene } from './visualScene'

export class InstanceVisualScene {
  private cache: any = {}
  public get sid(): string { return this.el.getAttribute('sid') }
  public get name(): string { return this.el.getAttribute('name') }
  public get url(): string { return this.el.getAttribute('url') }

  public getInstance(): Promise<VisualScene> {
    return util.fromCache(this.cache, 'getInstance', () => {
      return this.doc.docByUrl(this.url).then((doc) => {
        return (this.doc.libraryGeometries ? doc.libraryVisualScenes.byUriFragment(this.url) : null)
      })
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
