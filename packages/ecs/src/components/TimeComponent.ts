import { extend, getTime } from '@gglib/utils'
import { Service } from '../decorators'
import { OnUpdate } from './../Component'

/**
 * @public
 */
@Service()
export class TimeComponent implements OnUpdate {

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

  public onUpdate(ms: number) {
    const time = getTime()
    this.elapsedMsInGame = ms
    this.totalMsInGame += this.elapsedMsInGame
    this.elapsedMsInReal = time - this.current
    this.totalMsInReal += this.elapsedMsInReal
    this.current = time
  }
}
