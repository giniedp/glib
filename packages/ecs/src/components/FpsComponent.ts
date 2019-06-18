import { OnAdded, OnInit, OnRemoved, OnUpdate } from './../Component'
import { Entity } from './../Entity'
import { TimeComponent } from './TimeComponent'

/**
 * @public
 */
export class FpsComponent implements OnAdded, OnRemoved, OnInit, OnUpdate {

  public frames: number
  public fps: number
  public fpsTimer: number
  public fpsCounter: number

  public time: TimeComponent

  constructor() {
    this.reset()
  }

  public onAdded(entity: Entity) {
    entity.addService(FpsComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(FpsComponent)
  }

  public onInit(entity: Entity) {
    this.time = entity.root.getService(TimeComponent)
  }

  public reset() {
    this.frames = 0
    this.fps = 0
    this.fpsTimer = 0
    this.fpsCounter = 0
  }

  public onUpdate() {
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
}
