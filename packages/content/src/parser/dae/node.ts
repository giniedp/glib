import { Asset } from './asset'
import { COLLADA } from './collada'
import { InstanceCamera } from './instanceCamera'
import { InstanceGeometry } from './instanceGeometry'
import { InstanceLight } from './instanceLight'
import { InstanceNode } from './instanceNode'
import * as util from './utils'

export interface NodeTranform {
  type: string
  sid: string
  data: number[]
}

export class Node {
  private cache: any = {}

  public get id(): string { return this.el.getAttribute('id') }
  public get name(): string { return this.el.getAttribute('name') }
  public get sid(): string { return this.el.getAttribute('sid') }
  public get url(): string { return this.el.getAttribute('url') }
  public get type(): string { return this.el.getAttribute('type') }
  public get layer(): string { return this.el.getAttribute('layer') }

  public get asset(): Asset {
    return util.fromCache(this.cache, 'asset', () => {
      return util.mapChild(this.el, 'asset', (el) => new Asset(this.doc, el))
    })
  }

  public get nodes(): Node[] {
    return util.fromCache(this.cache, 'nodes', () => {
      return util.mapChildren(this.el, 'node', (el) => new Node(this.doc, el))
    })
  }

  public get instanceCameras(): InstanceCamera[] {
    return util.fromCache(this.cache, 'instanceCameras', () => {
      return util.mapChildren(this.el, 'instance_camera', (el) => new InstanceCamera(this.doc, el))
    })
  }

  public get instanceGeometries(): InstanceGeometry[] {
    return util.fromCache(this.cache, 'instanceGeometries', () => {
      return util.mapChildren(this.el, 'instance_geometry', (el) => new InstanceGeometry(this.doc, el))
    })
  }

  public get instanceLights(): InstanceLight[] {
    return util.fromCache(this.cache, 'instanceLights', () => {
      return util.mapChildren(this.el, 'instance_lights', (el) => new InstanceLight(this.doc, el))
    })
  }

  public get instanceNodes(): InstanceNode[] {
    return util.fromCache(this.cache, 'instanceNodes', () => {
      return util.mapChildren(this.el, 'instance_lights', (el) => new InstanceNode(this.doc, el))
    })
  }

  public get transforms(): NodeTranform[] {
    return util.fromCache(this.cache, 'transforms', () => {
      return util.mapQuerySelectorAll(this.el, 'asset', (el) => {
        return {
          type: el.tagName,
          sid: el.getAttribute('sid'),
          data: util.textContentToNumberArray(el),
        }
      })
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
