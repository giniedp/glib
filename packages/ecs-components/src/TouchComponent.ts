import { OnUpdate, Component } from '@gglib/ecs'
import { ITouchPaneOptions, TouchPane } from '@gglib/input'

/**
 * Constructor options for the {@link TouchComponent}
 *
 * @public
 */
export type TouchComponentOptions = ITouchPaneOptions

/**
 * @public
 */
@Component()
export class TouchComponent implements OnUpdate {
  public readonly name = 'Touch'

  public readonly touch: TouchPane
  public readonly touchIds: ReadonlyArray<number>

  public oldStates = new Map<number, Touch>()
  public newStates = new Map<number, Touch>()

  constructor(options: TouchComponentOptions) {
    this.touch = new TouchPane(options)
    this.touchIds = []
  }

  public onUpdate() {
    const ids = this.touchIds as number[]
    ids.length = 0

      // swap states
      ;
    [this.oldStates, this.newStates] = [this.newStates, this.oldStates]

    this.newStates.clear()
    this.touch.touches.forEach((touch, id) => {
      ids.push(id)
      this.newStates.set(id, touch)
    })
  }

  public justTouched(id: number) {
    return this.newStates.has(id) && !this.oldStates.has(id)
  }

  public justReleased(id: number) {
    return !this.newStates.has(id) && this.oldStates.has(id)
  }

  public x(id: number) {
    const t = this.newStates.get(id) || this.oldStates.get(id)
    return t ? TouchPane.getX(t) : null
  }

  public y(id: number) {
    const t = this.newStates.get(id) || this.oldStates.get(id)
    return t ? TouchPane.getY(t) : null
  }

  public deltaX(id: number) {
    return this.delta(id, 'clientX')
  }

  public deltaY(id: number) {
    return this.delta(id, 'clientY')
  }

  public isActive(id: number) {
    return this.newStates.has(id) && this.oldStates.has(id)
  }

  public delta(id: number, key: keyof Touch) {
    const n = this.newStates.get(id)
    const o = this.oldStates.get(id)
    if (n && o) {
      return (n[key] as number) - (o[key] as number)
    }
    return 0
  }
}
