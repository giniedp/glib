import { Inject, OnUpdate, Component } from '@gglib/ecs'
import { TimeComponent } from './TimeComponent'

/**
 * @public
 */
@Component()
export class FpsComponent implements OnUpdate {
  /**
   * Number of counted frames since reset
   */
  public frames: number

  /**
   * Current frames per second
   */
  public fps: number

  public fpsTimer: number
  public fpsCounter: number

  @Inject(TimeComponent, { from: 'root' })
  public time: TimeComponent

  constructor() {
    this.reset()
  }

  public reset() {
    this.frames = 0
    this.fps = 0
    this.fpsTimer = 0
    this.fpsCounter = 0
  }

  public onUpdate(dt: number) {
    this.frames += 1
    this.fpsTimer += dt
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
