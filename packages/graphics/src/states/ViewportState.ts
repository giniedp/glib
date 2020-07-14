import { hasOwnProperty } from '@gglib/utils'

const params: Array<keyof ViewportStateParams> = [
  'x',
  'y',
  'width',
  'height',
  'zMin',
  'zMax',
]

/**
 * An object with all viewport state parameters
 *
 * @public
 */
export interface IViewPortState {
  x: number
  y: number
  width: number
  height: number
  zMin: number
  zMax: number
}

/**
 * Represents a sub set of {@link IViewPortState}
 *
 * @public
 */
export type ViewportStateParams = Partial<IViewPortState>

/**
 * @public
 */
export class ViewportState implements IViewPortState {

  protected xField: number = 0
  protected yField: number = 0
  protected widthField: number = 0
  protected heightField: number = 0
  protected zMinField: number = 0
  protected zMaxField: number = 1
  protected hasChanged: boolean = false
  protected changes: ViewportStateParams = {}

  public get isDirty() {
    return this.hasChanged
  }

  /**
   * Gets and sets the viewport x parameter
   */
  public get x(): number {
    return this.xField
  }
  public set x(value: number) {
    if (this.xField !== value) {
      this.xField = value
      this.changes.x = value
      this.hasChanged = true
    }
  }

  /**
   * Gets and sets the viewport y parameter
   */
  public get y(): number {
    return this.yField
  }
  public set y(value: number) {
    if (this.yField !== value) {
      this.yField = value
      this.changes.y = value
      this.hasChanged = true
    }
  }

  /**
   * Gets and sets the viewport width parameter
   */
  public get width(): number {
    return this.widthField
  }
  public set width(value: number) {
    if (this.widthField !== value) {
      this.widthField = value
      this.changes.width = value
      this.hasChanged = true
    }
  }

  /**
   * Gets and sets the viewport height parameter
   */
  public get height(): number {
    return this.heightField
  }
  public set height(value: number) {
    if (this.heightField !== value) {
      this.heightField = value
      this.changes.height = value
      this.hasChanged = true
    }
  }

  /**
   * Gets and sets the viewport zMin parameter
   */
  public get zMin(): number {
    return this.zMinField
  }
  public set zMin(value: number) {
    if (this.zMinField !== value) {
      this.zMinField = value
      this.changes.zMin = value
      this.hasChanged = true
    }
  }

  /**
   * Gets and sets the viewport zMax parameter
   */
  public get zMax(): number {
    return this.zMaxField
  }
  public set zMax(value: number) {
    if (this.zMaxField !== value) {
      this.zMaxField = value
      this.changes.zMax = value
      this.hasChanged = true
    }
  }

  /**
   * Assigns multiple parameters to the current state
   */
  public assign(state: ViewportStateParams= {}): this {
    for (let key of params) {
      if (hasOwnProperty(state, key)) { this[key] = state[key] }
    }
    return this
  }

  /**
   * Uploads all changes to the GPU
   *
   * @param state - State changes to be assigned before committing
   */
  public commit(state?: ViewportStateParams): this {
    if (state) { this.assign(state) }
    if (!this.hasChanged) { return this }
    this.commitChanges(this.changes)
    this.clearChanges()
    return this
  }

  /**
   * Creates a copy of this state state
   */
  public copy(): IViewPortState
  /**
   * Creates a copy of this state and writes it into the target object
   *
   * @param target - Where the state should be written to
   */
  public copy<T>(target: T): T & IViewPortState
  public copy(out: any= {}): IViewPortState {
    for (let key of params) { out[key] = this[key] }
    return out
  }

  protected commitChanges(changes: Partial<IViewPortState>) {
    //
  }

  protected clearChanges() {
    this.hasChanged = false
    for (let key of params) { this.changes[key as any] = undefined }
  }
}
