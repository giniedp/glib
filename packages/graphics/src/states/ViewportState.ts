import { Device } from './../Device'

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
  /**
   * The graphics device
   */
  public device: Device

  private xField: number = 0
  private yField: number = 0
  private widthField: number = 0
  private heightField: number = 0
  private zMinField: number = 0
  private zMaxField: number = 1
  private hasChanged: boolean = false
  private changes: ViewportStateParams = {}

  public get isDirty() {
    return this.hasChanged
  }

  /**
   * Instantiates the {@link ViewportState}
   */
  constructor(device: Device) {
    this.device = device
    this.resolve()
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
      if (state.hasOwnProperty(key)) { this[key] = state[key] }
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
    const gl = this.device.context
    const changes = this.changes
    if (changes.x !== null || changes.y !== null ||
      changes.width !== null || changes.height !== null) {
      gl.viewport(this.x, this.y, this.width, this.height)
    }
    if (changes.zMin !== undefined || changes.zMax !== undefined) {
      gl.depthRange(this.zMin, this.zMax)
    }
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

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    ViewportState.resolve(this.device, this)
    this.clearChanges()
    return this
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of params) { this.changes[key as any] = undefined }
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(device: Device): IViewPortState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(device: Device, out: T): T & IViewPortState
  public static resolve(device: Device, out: ViewportStateParams = {}): IViewPortState {
    const gl = device.context
    const range = gl.getParameter(gl.DEPTH_RANGE)
    out.zMin = range[0]
    out.zMax = range[1]
    const viewport = gl.getParameter(gl.VIEWPORT)
    out.x = viewport[0]
    out.y = viewport[1]
    out.width = viewport[2]
    out.height = viewport[3]
    return out as IViewPortState
  }
}
