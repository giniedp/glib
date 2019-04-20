import { Asset, parseAsset } from './asset'
import { COLLADA } from './collada'
import { InstanceCamera } from './instanceCamera'
import { InstanceGeometry } from './instanceGeometry'
import { InstanceLight } from './instanceLight'
import { InstanceNode } from './instanceNode'
import Lookat from './lookat'
import Matrix from './matrix'
import Rotate from './rotate'
import Scale from './scale'
import Skew from './skew'
import Translate from './translate'
import { DocumentCache, mapChild, mapChildren, mapQuerySelectorAll } from './utils'

export interface NodeTranform {
  type: 'lookat' | 'matrix' | 'rotate' | 'scale' | 'skew' | 'translate'
  data: number[]
}

export class Node {
  private cache = new DocumentCache()

  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }
  public get sid(): string { return this.el.getAttribute('sid') }
  public get url(): string { return this.el.getAttribute('url') }
  public get type(): string { return this.el.getAttribute('type') }
  public get layer(): string { return this.el.getAttribute('layer') }

  public get asset(): Asset {
    return this.cache.get('asset', () => {
      return mapChild(this.el, 'asset', parseAsset)
    })
  }

  public get nodes(): Node[] {
    return this.cache.get('nodes', () => {
      return mapChildren(this.el, 'node', (el) => new Node(this.doc, el))
    })
  }

  public get instanceCameras(): InstanceCamera[] {
    return this.cache.get('instanceCameras', () => {
      return mapChildren(this.el, 'instance_camera', (el) => new InstanceCamera(this.doc, el))
    })
  }

  public get instanceGeometries(): InstanceGeometry[] {
    return this.cache.get('instanceGeometries', () => {
      return mapChildren(this.el, 'instance_geometry', (el) => new InstanceGeometry(this.doc, el))
    })
  }

  public get instanceLights(): InstanceLight[] {
    return this.cache.get('instanceLights', () => {
      return mapChildren(this.el, 'instance_light', (el) => new InstanceLight(this.doc, el))
    })
  }

  public get instanceNodes(): InstanceNode[] {
    return this.cache.get('instanceNodes', () => {
      return mapChildren(this.el, 'instance_node', (el) => new InstanceNode(this.doc, el))
    })
  }

  public get transforms(): NodeTranform[] {
    return this.cache.get('transforms', () => {
      return mapQuerySelectorAll(this.el, 'lookat,matrix,rotate,scale,skew,translate', (el) => {
        switch (el.tagName) {
          case 'lookat':
            return new Lookat(this.doc, el)
          case 'matrix':
            return new Matrix(this.doc, el)
          case 'rotate':
            return new Rotate(this.doc, el)
          case 'scale':
            return new Scale(this.doc, el)
          case 'skew':
            return new Skew(this.doc, el)
          case 'translate':
            return new Translate(this.doc, el)
          default:
            return null
        }
      }).filter((it) => it != null)
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
