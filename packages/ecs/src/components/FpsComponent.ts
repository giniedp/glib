import { Inject, Service } from '../decorators'
import { OnUpdate } from './../Component'
import { TimeComponent } from './TimeComponent'

/**
 * @public
 */
@Service()
export class FpsComponent implements OnUpdate {

  public frames: number
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

  public onUpdate() {
    this.frames += 1
    this.fpsTimer += this.time.real.elapsedMs
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
