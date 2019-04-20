import { Asset, parseAsset } from '../core/asset'
import { COLLADA } from '../core/collada'
import { DocumentCache, mapChild, mapChildren, mapQuerySelector } from '../core/utils'
import { Blinn, Constant, Lambert, Phong } from './commonTechnique'
import { Newparam, parseNewparam } from './newparam'

export class ProfileCommon {
  private cache = new DocumentCache()

  public get id(): string {
    return this.el.getAttribute('id')
  }

  public get asset(): Asset {
    return this.cache.get('asset', () => mapChild(this.el, 'asset', parseAsset))
  }

  public get newparam(): Newparam[] {
    return this.cache.get('newparam', () => mapChildren(this.el, 'newparam', parseNewparam))
  }

  public get techniqueBlinn(): Blinn {
    return this.cache.get('technique blinn', () => mapQuerySelector(this.el, 'technique blinn', (el) => {
      return new Blinn(this, el)
    }))
  }

  public get techniqueConstant(): Constant {
    return this.cache.get('technique constant', () => mapQuerySelector(this.el, 'technique constant', (el) => {
      return new Constant(this, el)
    }))
  }

  public get techniqueLambert(): Lambert {
    return this.cache.get('technique lambert', () => mapQuerySelector(this.el, 'technique lambert', (el) => {
      return new Lambert(this, el)
    }))
  }

  public get techniquePhong(): Phong {
    return this.cache.get('technique phong', () => mapQuerySelector(this.el, 'technique phong', (el) => {
      return new Phong(this, el)
    }))
  }

  public constructor(public readonly doc: COLLADA, public readonly el: Element) {

  }
}
