import { getOption, getTime, requestFrame } from '@gglib/utils'
import { Inject, Service } from '../decorators'
import { Entity } from './../Entity'

/**
 * Constructor options for the {@link GameLoopComponent}
 *
 * @public
 */
export interface LoopComponentOptions {
  preferTimeout?: boolean
  fixedTimeStep?: number
  isFixedTimeStep?: boolean

  recursiveSetup?: boolean
  recursiveUpdate?: boolean
  recursiveDraw?: boolean
}

/**
 * @public
 */
@Service()
export class LoopComponent {

  public readonly name = 'Loop'
  public readonly preferTimeout: boolean = false
  public readonly fixedTimeStep: number = 1000 / 60
  public readonly isFixedTimeStep: boolean = true

  public readonly recursiveSetup: boolean = true
  public readonly recursiveUpdate: boolean = true
  public readonly recursiveDraw: boolean = true

  private tickFunction: () => void
  private time: number = 0
  private timeRest: number = 0

  @Inject(Entity)
  private entity: Entity

  constructor(params: LoopComponentOptions = {}) {
    this.preferTimeout = getOption(params, 'preferTimeout', this.preferTimeout)
    this.fixedTimeStep = getOption(params, 'fixedTimeStep', this.fixedTimeStep)
    this.isFixedTimeStep = getOption(params, 'isFixedTimeStep', this.isFixedTimeStep)
    this.recursiveSetup = getOption(params, 'recursiveSetup', this.recursiveSetup)
    this.recursiveUpdate = getOption(params, 'recursiveUpdate', this.recursiveUpdate)
    this.recursiveDraw = getOption(params, 'recursiveDraw', this.recursiveDraw)
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
