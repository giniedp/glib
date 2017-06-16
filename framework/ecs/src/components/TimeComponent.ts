import { extend, getTime } from '@glib/core'
import { Component } from './../Component'
import { Entity } from './../Entity'

export class TimeComponent implements Component {
  public node: Entity
  public name: string = 'Time'
  public service: boolean = true
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

  public debug(): string {
    return [
      `- component: ${this.name}`,
      `  enabled: ${this.enabled}`,
      `  elapsed gameTime: ${this.elapsedMsInGame.toPrecision(5)}`,
      `  total gameTime: ${this.totalMsInGame}`,
      `  elapsed realTime: ${this.elapsedMsInReal.toPrecision(5)}`,
      `  total realTime: ${this.totalMsInReal}`,
    ].join('\n')
  }
}
