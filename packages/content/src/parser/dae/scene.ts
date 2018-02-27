import { COLLADA } from './collada'
import { InstanceVisualScene } from './instanceVisualScene'
import * as util from './utils'

export default class Scene {
  private cache: any = {}

  public get instanceVisialScene(): InstanceVisualScene {
    return util.fromCache(this.cache, 'instanceVisialScene', () => {
      return util.mapChild(this.el, 'instance_visual_scene', (el) => new InstanceVisualScene(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
