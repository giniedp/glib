import { extend, getTime, requestFrame } from '@gglib/core'
import { OnAdded, OnRemoved } from './../Component'
import { Entity } from './../Entity'

/**
 * Constructor options for the {@link GameLoopComponent}
 *
 * @public
 */
export interface GameLoopOptions {
  preferTimeout?: boolean
  fixedTimeStep?: number
  isFixedTimeStep?: boolean

  recursiveSetup?: boolean
  recursiveUpdate?: boolean
  recursiveDraw?: boolean
}

function getOption<T>(options: GameLoopOptions, key: keyof GameLoopOptions, fallback: T): T {
  return key in options ? options[key] as any : fallback
}

/**
 * @public
 */
export class GameLoopComponent implements OnAdded, OnRemoved {

  public readonly preferTimeout: boolean = false
  public readonly fixedTimeStep: number = 1000 / 60
  public readonly isFixedTimeStep: boolean = true

  public readonly recursiveSetup: boolean = true
  public readonly recursiveUpdate: boolean = true
  public readonly recursiveDraw: boolean = true

  private tickFunction: () => void
  private time: number = 0
  private timeRest: number = 0
  private entity: Entity

  constructor(params: GameLoopOptions = {}) {
    this.preferTimeout = getOption(params, 'preferTimeout', this.preferTimeout)
    this.fixedTimeStep = getOption(params, 'fixedTimeStep', this.fixedTimeStep)
    this.isFixedTimeStep = getOption(params, 'isFixedTimeStep', this.isFixedTimeStep)
    this.recursiveSetup = getOption(params, 'recursiveSetup', this.recursiveSetup)
    this.recursiveUpdate = getOption(params, 'recursiveUpdate', this.recursiveUpdate)
    this.recursiveDraw = getOption(params, 'recursiveDraw', this.recursiveDraw)
  }

  public onAdded(entity: Entity) {
    this.entity = entity
    entity.addService(GameLoopComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(GameLoopComponent)
    this.entity = null
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
