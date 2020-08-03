import { DocumentCache, mapChild, mapChildren, textContent } from './utils'

export function parseAsset(el: Element) {
  return new Asset(el)
}

/**
 * Defines asset-management information regarding its parent element.
 */
export class Asset {
  private cache = new DocumentCache()

  /**
   * Provides data related to a contributor who worked on the parent element.
   */
  get contributor(): string[] {
    return this.cache.get('contributor', () => mapChildren(this.el, 'contributor', textContent))
  }

  /**
   * Provides information about the location of the visual scene in physical space
   */
  get coverage() {
    return this.cache.get('coverage', () => mapChild(this.el, 'coverage', (el) => {
      return {
        longitude: mapChild(el, 'longitude', (c) => Number(c.textContent) || 0),
        latitude: mapChild(el, 'latitude', (c) => Number(c.textContent) || 0),
        altitude: mapChild(el, 'altitude', (c) => Number(c.textContent) || 0),
        altitudeMode: mapChild(el, 'altitude', (c) => c.getAttribute('mode')),
      }
    }))
  }

  /**
   * Contains the date and time that the parent element was created. Represented in an ISO
   * 8601 format as per the XML Schema xs:dateTime primitive type.
   */
  get created(): string {
    return mapChild(this.el, 'created', textContent)
  }

  /**
   * Contains a list of words used as search criteria for the parent element
   */
  get keywords(): string[] {
    return this.cache.get('keywords', () => mapChildren(this.el, 'keywords', textContent))
  }

  /**
   * Contains the date and time that the parent element was last modified. Represented in an
   * ISO 8601 format as per the XML Schema xs:dateTime primitive type
   */
  get modified(): string {
    return mapChild(this.el, 'modified', textContent)
  }

  /**
   * Contains revision information for the parent element.
   */
  get revision(): string {
    return mapChild(this.el, 'revision', textContent)
  }

  /**
   * Contains a description of the topical subject of the parent element.
   */
  get subject(): string {
    return mapChild(this.el, 'subject', textContent)
  }

  /**
   * Contains title information for the parent element.
   */
  get title(): string {
    return mapChild(this.el, 'title', textContent)
  }

  /**
   * Defines unit of distance for COLLADA elements and objects.
   */
  get unit() {
    return this.cache.get('unit', () => mapChild(this.el, 'unit', (c) => {
      return {
        name: c.getAttribute('name') || 'meter',
        meter: Number(c.getAttribute('meter')) || 1,
      }
    }))
  }

  /**
   * Contains descriptive information about the coordinate system of the geometric data. All
   * coordinates are right-handed by definition. Valid values are X_UP, Y_UP, or Z_UP.
   */
  get upAxis(): 'X_UP' | 'Y_UP' | 'Z_UP' {
    return mapChild(this.el, 'up_axis', textContent) as any
  }

  constructor(public el: Element) {

  }
}
