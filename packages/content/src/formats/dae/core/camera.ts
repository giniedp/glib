import { Asset, parseAsset } from './asset'
import { COLLADA } from './collada'
import { DocumentCache, mapChild, mapQuerySelector, textContentToNumber } from './utils'

/**
 * Describes the field of view of an orthographic camera.
 */
export interface Orthographic {
  /**
   * Contains a floating-point number describing the horizontal (X) magnification of the view
   */
  xmag?: number
  /**
   * Contains a floating-point number describing the vertical (Y) magnification of the view.
   */
  ymag?: number
  /**
   * Contains a floating-point number describing the aspect ratio of the field of view.
   */
  aspect_ratio?: number
  /**
   * Contains a floating-point number that describes the distance to the near clipping plane.
   */
  znear?: number
  /**
   * Contains a floating-point number that describes the distance to the far clipping plane.
   */
  zfar?: number
}

/**
 * Describes the field of view of a perspective camera.
 */
export interface Perspective {
  /**
   * Contains a floating-point number describing the horizontal field of view in degrees.
   */
  xfov?: number
  /**
   * Contains a floating-point number describing the vertical field of view in degrees.
   */
  yfov?: number
  /**
   * Contains a floating-point number describing the aspect ratio of the field of view.
   */
  aspect_ratio?: number
  /**
   * Contains a floating-point number that describes the distance to the near clipping plane.
   */
  znear?: number
  /**
   * Contains a floating-point number that describes the distance to the far clipping plane.
   */
  zfar?: number
}

/**
 * Declares a view of the visual scene hierarchy or scene graph.
 * The camera contains elements that describe the camera’s optics and imager.
 */
export class Camera {
  private cache = new DocumentCache()

  /**
   * A text string containing the unique identifier
   */
  public get id(): string {
    return this.el.getAttribute('id')
  }

  /**
   * The text string name of this element
   */
  public get name(): string {
    return this.el.getAttribute('name')
  }

  /**
   * Defines the directions of the axes and the units of
   * measurement for the camera’s view. Also contains
   * information about the creation of this element
   */
  public get asset(): Asset {
    return this.cache.get('asset', () => mapChild(this.el, 'asset', parseAsset))
  }

  /**
   * Describes the field of view of an orthographic camera.
   */
  public get orthographic(): Orthographic {
    return this.cache.get('optics technique_common orthographic', () => mapChild(this.el, 'optics technique_common orthographic', (el) => {
      return {
        xmag: mapQuerySelector(el, 'xmag', textContentToNumber),
        ymag: mapQuerySelector(el, 'ymag', textContentToNumber),
        aspect_ratio: mapQuerySelector(el, 'aspect_ratio', textContentToNumber),
        znear: mapQuerySelector(el, 'znear', textContentToNumber),
        zfar: mapQuerySelector(el, 'zfar', textContentToNumber),
      }
    }))
  }

  /**
   * Describes the field of view of a perspective camera.
   */
  public get perspective(): Perspective {
    return this.cache.get('optics technique_common perspective', () => mapChild(this.el, 'optics technique_common perspective', (el) => {
      return {
        xfov: mapQuerySelector(el, 'xfov', textContentToNumber),
        yfov: mapQuerySelector(el, 'yfov', textContentToNumber),
        aspect_ratio: mapQuerySelector(el, 'aspect_ratio', textContentToNumber),
        znear: mapQuerySelector(el, 'znear', textContentToNumber),
        zfar: mapQuerySelector(el, 'zfar', textContentToNumber),
      }
    }))
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
