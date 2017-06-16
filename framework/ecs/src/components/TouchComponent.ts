import { extend } from '@glib/core'
import * as Input from '@glib/input'
import { Component } from './../Component'
import { Entity } from './../Entity'

export class TouchComponent implements Component {
  public node: Entity
  public name: string = 'Touch'
  public service: boolean = true
  public enabled: boolean = true

  public touch: Input.TouchPane
  public touchIds: number[]

  public oldStates: any
  public newStates: any

  constructor(options: any = {}) {
    this.touch = new Input.TouchPane({ element: options.element || document })
    this.touchIds = []
    extend(this, options)
    this.newStates = {}
    this.oldStates = {}
  }

  public update() {
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

  public debug(): string {
    return [
      `- component: ${this.name}`,
      `  enabled: ${this.enabled}`,
    ].join('\n')
  }
}
