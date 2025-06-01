import { COLLADA } from './collada'
import { InstanceVisualScene } from './instanceVisualScene'
import { DocumentCache, mapChild } from './utils'

export class Scene {
  private cache = new DocumentCache()

  public get instanceVisualScene(): InstanceVisualScene {
    return this.cache.get('instanceVisialScene', () => {
      return mapChild(this.el, 'instance_visual_scene', (el) => new InstanceVisualScene(this.doc, el))
    })
  }

  constructor(private doc: COLLADA, private el: Element) {
    //
  }
}
