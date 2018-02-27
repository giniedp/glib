import { extend, getTime, Log, requestFrame } from '@glib/core'
import { Component } from './../Component'
import { Entity } from './../Entity'

export class GameLoopComponent implements Component {
  public entity: Entity
  public name: string = 'GameLoop'
  public service: boolean = true
  public enabled: boolean = true

  public preferTimeout: boolean = false
  public fixedTimeStep: number = 1000 / 60
  public isFixedTimeStep: boolean = true

  public recursiveSetup: boolean = true
  public recursiveUpdate: boolean = true
  public recursiveDraw: boolean = true

  private tickFunction: () => void
  private time: number = 0
  private timeRest: number = 0

  constructor(params: any= {}) {
    extend(this, params)
  }

  public run() {
    this.tickFunction = () => { this.tick() }
    this.tick()
  }
  public pause() {
    this.tickFunction = () => {
      //
    }
  }
  public stop() {
    this.tickFunction = () => {
      //
    }
  }

  public tick() {
    const time = getTime()
    let dt = time - this.time
    this.time = time

    if (this.isFixedTimeStep) {

      if (dt >= (this.fixedTimeStep - this.timeRest)) {
        this.onFrame(this.fixedTimeStep)
        this.timeRest = 0
      }
      while (dt > this.fixedTimeStep) {
        dt -= this.fixedTimeStep
      }
      this.timeRest += dt
    } else {
      this.onFrame(dt)
    }

    if (this.preferTimeout) {
      self.setTimeout(this.tickFunction, 1)
    } else {
      requestFrame(this.tickFunction)
    }
  }

  private onFrame(dt: number) {
    const node = this.entity
    node.initializeComponents(this.recursiveSetup)
    node.updateComponents(dt, this.recursiveUpdate)
    node.drawComponents(dt, this.recursiveDraw)
    return this
  }
}
