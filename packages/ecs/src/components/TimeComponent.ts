import { extend, getTime } from '@gglib/core'
import { Component } from './../Component'
import { Entity } from './../Entity'

/**
 * @public
 */
export class TimeComponent implements Component {
  public readonly name: string = 'Time'
  public readonly service: boolean = true

  public entity: Entity
  public enabled: boolean = true

  public current: number
  public elapsedMsInGame: number
  public totalMsInGame: number
  public elapsedMsInReal: number
  public totalMsInReal: number

  constructor(params: any = {}) {
    extend(this, params)
    this.reset()
  }

  public reset() {
    this.current = getTime()
    this.elapsedMsInGame = 0
    this.totalMsInGame = 0
    this.elapsedMsInReal = 0
    this.totalMsInReal = 0
  }

  public update(ms: number) {
    const time = getTime()
    this.elapsedMsInGame = ms
    this.totalMsInGame += this.elapsedMsInGame
    this.elapsedMsInReal = time - this.current
    this.totalMsInReal += this.elapsedMsInReal
    this.current = time
  }
}
