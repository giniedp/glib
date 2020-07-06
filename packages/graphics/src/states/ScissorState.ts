import { Device } from './../Device'

const params: Array<keyof ScissorStateParams> = [
  'enable',
  'x',
  'y',
  'width',
  'height',
]

/**
 * An object with all scissor state parameters
 *
 * @public
 */
export interface IScissorState {
  enable: boolean
  x: number
  y: number
  width: number
  height: number
}

/**
 * Represents a sub set of {@link IScissorState}
 *
 * @public
 */
export type ScissorStateParams = Partial<IScissorState>

/**
 * @public
 */
export class ScissorState implements IScissorState {

  protected $enable: boolean = false
  protected $x: number = 0
  protected $y: number = 0
  protected $width: number = 0
  protected $height: number = 0
  protected $hasChanged: boolean = false
  protected $changes: ScissorStateParams = {}

  /**
   * Indicates whether the state has changes which are not committed to the GPU
   */
  public get isDirty() {
    return this.$hasChanged
  }

  /**
   * Enables or disables the scissor test
   */
  public get enable(): boolean {
    return this.$enable
  }
  public set enable(value: boolean) {
    if (this.$enable !== value) {
      this.$enable = value
      this.$changes.enable = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the x scissor parameter
   */
  public get x(): number {
    return this.$x
  }
  public set x(value: number) {
    if (this.$x !== value) {
      this.$x = value
      this.$changes.x = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the y scissor parameter
   */
  public get y(): number {
    return this.$y
  }
  public set y(value: number) {
    if (this.$y !== value) {
      this.$y = value
      this.$changes.y = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the width scissor parameter
   */
  public get width(): number {
    return this.$width
  }
  public set width(value: number) {
    if (this.$width !== value) {
      this.$width = value
      this.$changes.width = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the height scissor parameter
   */
  public get height(): number {
    return this.$height
  }
  public set height(value: number) {
    if (this.$height !== value) {
      this.$height = value
      this.$changes.height = value
      this.$hasChanged = true
    }
  }

  /**
   * Assigns multiple parameters to the current state
   */
  public assign(state: ScissorStateParams= {}): this {
    for (const key of params) {
      if (state.hasOwnProperty(key)) {
        this[key as any] = state[key]
      }
    }
    return this
  }

  /**
   * Uploads all changes to the GPU
   *
   * @param state - State changes to be assigned before committing
   */
  public commit(state?: ScissorStateParams): this {
    if (state) { this.assign(state) }
    if (!this.$hasChanged) { return this }
    this.commitChanges(this.$changes)
    this.clearChanges()
    return this
  }

  /**
   * Creates a copy of this state state
   */
  public copy(): IScissorState
  /**
   * Creates a copy of this state and writes it into the target object
   *
   * @param target - Where the state should be written to
   */
  public copy<T>(target: T): T & IScissorState
  public copy(out: any= {}): IScissorState {
    for (const key of params) {
      out[key] = this[key]
    }
    return out
  }

  protected commitChanges(changes: Partial<IScissorState>) {
    //
  }

  protected clearChanges() {
    this.$hasChanged = false
    for (const key of params) {
      this.$changes[key as any] = undefined
    }
  }

  /**
   * A default state with scissor test disabled
   */
  public static Default = Object.freeze<ScissorStateParams>({
    enable: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
}
