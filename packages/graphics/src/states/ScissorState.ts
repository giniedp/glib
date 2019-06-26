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
  /**
   * The graphics device
   */
  public device: Device

  private $enable: boolean = false
  private $x: number = 0
  private $y: number = 0
  private $width: number = 0
  private $height: number = 0
  private $hasChanged: boolean = false
  private $changes: ScissorStateParams = {}

  /**
   * Indicates whether the state has changes which are not committed to the GPU
   */
  public get isDirty() {
    return this.$hasChanged
  }

  /**
   * Instantiates the {@link ScissorState}
   */
  constructor(device: Device) {
    this.device = device
    this.resolve()
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
  public assign(state: ScissorStateParams= {}): ScissorState {
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
  public commit(state?: ScissorStateParams): ScissorState {
    if (state) { this.assign(state) }
    if (!this.$hasChanged) { return this }
    const changes = this.$changes
    const gl = this.device.context
    if (changes.enable === true) {
      gl.enable(gl.SCISSOR_TEST)
    }
    if (changes.enable === false) {
      gl.disable(gl.SCISSOR_TEST)
    }
    if (changes.x != null || changes.y != null || changes.width != null || changes.height != null) {
      gl.scissor(this.x, this.y, this.width, this.height)
    }
    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): ScissorState {
    ScissorState.resolve(this.device, this)
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

  private clearChanges() {
    this.$hasChanged = false
    for (const key of params) {
      this.$changes[key as any] = undefined
    }
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(device: Device): IScissorState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(device: Device, out: T): T & IScissorState
  public static resolve(device: Device, out: ScissorStateParams = {}): IScissorState {
    const gl = device.context
    out.enable = gl.getParameter(gl.SCISSOR_TEST)
    const scissor = gl.getParameter(gl.SCISSOR_BOX)
    out.x = scissor[0]
    out.y = scissor[1]
    out.width = scissor[2]
    out.height = scissor[3]
    return out as IScissorState
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
