import { DocumentCache, mapQuerySelector } from '../core/utils'
import { CommonColorOrTextureType, parseCommonColorOrTexture } from './commonColorOrTexture'
import { CommonFloatOrParam, parseCommonFloatOrParam } from './commonFloatOrParam'
import { Newparam } from './newparam'

export class CommonTechnique {
  private cache = new DocumentCache()

  /**
   * Declares the amount of light emitted from the surface of this object.
   */
  public get emission(): CommonColorOrTextureType {
    return this.cache.get('emission', () => mapQuerySelector(this.el, 'emission', parseCommonColorOrTexture))
  }

  /**
   * Declares the amount of ambient light emitted from the surface of this object.
   */
  public get ambient(): CommonColorOrTextureType {
    return this.cache.get('ambient', () => mapQuerySelector(this.el, 'ambient', parseCommonColorOrTexture))
  }

  /**
   * Declares the amount of light diffusely reflected from the surface of this object.
   */
  public get diffuse(): CommonColorOrTextureType {
    return this.cache.get('diffuse', () => mapQuerySelector(this.el, 'diffuse', parseCommonColorOrTexture))
  }

  /**
   * Declares the color of light specularly reflected from the surface of this object.
   */
  public get specular(): CommonColorOrTextureType {
    return this.cache.get('specular', () => mapQuerySelector(this.el, 'specular', parseCommonColorOrTexture))
  }

  /**
   * Declares the specularity or roughness of the specular reflection lobe.
   */
  public get shininess(): CommonFloatOrParam {
    return this.cache.get('shininess', () => mapQuerySelector(this.el, 'shininess', parseCommonFloatOrParam))
  }

  /**
   * Declares the color of a perfect mirror reflection.
   */
  public get reflective(): CommonColorOrTextureType {
    return this.cache.get('reflective', () => mapQuerySelector(this.el, 'reflective', parseCommonColorOrTexture))
  }

  /**
   * Declares the amount of perfect mirror reflection to be added to the reflected light as a value between 0.0 and 1.0.
   */
  public get reflectivity(): CommonFloatOrParam {
    return this.cache.get('reflectivity', () => mapQuerySelector(this.el, 'reflectivity', parseCommonFloatOrParam))
  }

  /**
   * Declares the color of perfectly refracted light.
   */
  public get transparent(): CommonColorOrTextureType {
    return this.cache.get('transparent', () => mapQuerySelector(this.el, 'transparent', parseCommonColorOrTexture))
  }

  /**
   * Declares the amount of perfectly refracted light added to the reflected color as a scalar value between 0.0 and 1.0.
   */
  public get transparency(): CommonFloatOrParam {
    return this.cache.get('transparency', () => mapQuerySelector(this.el, 'transparency', parseCommonFloatOrParam))
  }

  /**
   * Declares the index of refraction for perfectly refracted light as a single scalar index.
   */
  public get indexOfRefraction(): CommonFloatOrParam {
    return this.cache.get('index_of_refraction', () => mapQuerySelector(this.el, 'index_of_refraction', parseCommonFloatOrParam))
  }

  public constructor(public readonly tex: { newparam: Newparam[] }, public readonly el: Element) {

  }
}

// tslint:disable-next-line
export class Blinn extends CommonTechnique {
  public constructor(public readonly tex: { newparam: Newparam[] }, public readonly el: Element) {
    super(tex, el)
  }
}

// tslint:disable-next-line
export class Phong extends CommonTechnique {
  public constructor(public readonly tex: { newparam: Newparam[] }, public readonly el: Element) {
    super(tex, el)
  }
}

// tslint:disable-next-line
export class Lambert extends CommonTechnique {
  public constructor(public readonly tex: { newparam: Newparam[] }, public readonly el: Element) {
    super(tex, el)
  }
}

// tslint:disable-next-line
export class Constant extends CommonTechnique {
  public constructor(public readonly tex: { newparam: Newparam[] }, public readonly el: Element) {
    super(tex, el)
  }
}
