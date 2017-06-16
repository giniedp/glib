import { Component } from './../Component'
import { Entity } from './../Entity'
import { TimeComponent } from './TimeComponent'

export class FpsComponent implements Component {
  public node: Entity
  public name: string = 'Fps'
  public enabled: boolean = true
  public service: boolean = true

  public frames: number
  public fps: number
  public fpsTimer: number
  public fpsCounter: number

  public time: TimeComponent

  constructor() {
    this.reset()
  }

  public setup() {
    this.time = this.node.root.getService('Time')
  }

  public reset() {
    this.frames = 0
    this.fps = 0
    this.fpsTimer = 0
    this.fpsCounter = 0
  }

  public update() {
    this.frames += 1
    this.fpsTimer += this.time.elapsedMsInReal
    this.fpsCounter += 1
    if (this.fpsTimer >= 1000) {
      this.fps = this.fpsCounter * this.fpsTimer * 0.001
      this.fpsCounter = 0
      while (this.fpsTimer >= 1000) {
        this.fpsTimer -= 1000
      }
    }
  }

  public debug(): string {
    return [
      `- component: ${this.name}`,
      `  enabled: ${this.enabled}`,
      `  fps: ${this.fps.toPrecision(5)}`,
    ].join('\n')
  }
}
