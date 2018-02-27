import { COLLADA } from './collada'
import * as util from './utils'

export class Asset {
  get contributor(): string[] { return util.mapChildren(this.el, 'contributor', (c) => c.textContent) }
  get coverage() {
    return util.mapChild(this.el, 'coverage', (el) => {
      return {
        longitude: util.mapChild(el, 'longitude', (c) => Number(c.textContent) || 0),
        latitude: util.mapChild(el, 'latitude', (c) => Number(c.textContent) || 0),
        altitude: util.mapChild(el, 'altitude', (c) => Number(c.textContent) || 0),
        altitudeMode: util.mapChild(el, 'altitude', (c) => c.getAttribute('mode')),
      }
    })
  }
  get created(): string { return util.textOfChild(this.el, 'created') }
  get keywords(): string[] { return util.mapChildren(this.el, 'keywords', (c) => c.textContent)}
  get modified(): string { return util.textOfChild(this.el, 'modified') }
  get revision(): string { return util.textOfChild(this.el, 'revision') }
  get subject(): string { return util.textOfChild(this.el, 'subject') }
  get title(): string { return util.textOfChild(this.el, 'title') }
  get unit(): { name: string, meter: number } {
    return util.mapChild(this.el, 'unit', (c) => {
      return {
        name: c.getAttribute('name') || 'meter',
        meter: Number(c.getAttribute('meter')) || 1,
      }
    })
  }
  get upAxis(): string { return util.textOfChild(this.el, 'up_axis') }

  constructor(public doc: COLLADA, public el: Element) {

  }
}
