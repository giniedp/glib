import { extend } from '@gglib/core'
import { TouchPane } from '@gglib/input'
import { OnAdded, OnRemoved, OnUpdate } from './../Component'
import { Entity } from './../Entity'

/**
 * Constructor options for the {@link TouchComponent}
 *
 * @public
 */
export interface TouchComponentOptions {
  eventTarget?: EventTarget
}

/**
 * @public
 */
export class TouchComponent implements OnAdded, OnRemoved, OnUpdate {

  public touch: TouchPane
  public touchIds: number[]

  public oldStates: any
  public newStates: any

  constructor(options: TouchComponentOptions = {}) {
    this.touch = new TouchPane({ eventTarget: options.eventTarget || document })
    this.touchIds = []
    extend(this, options)
    this.newStates = {}
    this.oldStates = {}
  }

  public onAdded(entity: Entity) {
    entity.addService(TouchComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(TouchComponent)
  }

  public onUpdate() {
    let ids = this.touchIds
    ids.length = 0
    for (let id in this.touch.state) {
      if (this.touch.state.hasOwnProperty(id)) {
        ids.push(Number(id))
      }
    }
    for (let id of ids) {
      let tmp = this.oldStates[id] || {}
      this.oldStates = this.newStates[id] || {}
      this.newStates = tmp
      this.touch.copyState(Number(id), tmp)
    }
  }

  public x(id: number) {
    let n = this.newStates[id]
    if (n) { return n.x }
  }

  public y(id: number) {
    let n = this.newStates[id]
    if (n) { return n.y }
  }

  public xDelta(id: number) {
    let n = this.newStates[id]
    let o = this.oldStates[id]
    if (n && o && n.active && o.active) {
      return n.x - o.x
    }
    return 0
  }

  public yDelta(id: number) {
    let n = this.newStates[id]
    let o = this.oldStates[id]
    if (n && o && n.active && o.active) {
      return n.y - o.y
    }
    return 0
  }

  public isActive(id: number) {
    let n = this.newStates[id]
    let o = this.oldStates[id]
    return n && o && n.active && o.active
  }
}
