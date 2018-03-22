import { Device } from './../Device'

const propertyKeys: Array<keyof ViewportStateOptions> = ['x', 'y', 'width', 'height', 'zMin', 'zMax']

/**
 * @public
 */
export interface ViewportStateOptions {
  x?: number
  y?: number
  width?: number
  height?: number
  zMin?: number
  zMax?: number
}

/**
 * @public
 */
export class ViewportState implements ViewportStateOptions {
  public device: Device
  public gl: WebGLRenderingContext
  private xField: number = 0
  private yField: number = 0
  private widthField: number = 0
  private heightField: number = 0
  private zMinField: number = 0
  private zMaxField: number = 1
  private hasChanged: boolean = false
  private changes: ViewportStateOptions = {}

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, state?: ViewportStateOptions) {
    this.device = device
    this.gl = device.context
    this.resolve()
    if (state) { this.apply(state) }
  }

  get x(): number {
    return this.xField
  }

  set x(value: number) {
    if (this.xField !== value) {
      this.xField = value
      this.changes.x = value
      this.hasChanged = true
    }
  }

  get y(): number {
    return this.yField
  }

  set y(value: number) {
    if (this.yField !== value) {
      this.yField = value
      this.changes.y = value
      this.hasChanged = true
    }
  }

  get width(): number {
    return this.widthField
  }

  set width(value: number) {
    if (this.widthField !== value) {
      this.widthField = value
      this.changes.width = value
      this.hasChanged = true
    }
  }

  get height(): number {
    return this.heightField
  }

  set height(value: number) {
    if (this.heightField !== value) {
      this.heightField = value
      this.changes.height = value
      this.hasChanged = true
    }
  }

  get zMin(): number {
    return this.zMinField
  }

  set zMin(value: number) {
    if (this.zMinField !== value) {
      this.zMinField = value
      this.changes.zMin = value
      this.hasChanged = true
    }
  }

  get zMax(): number {
    return this.zMaxField
  }

  set zMax(value: number) {
    if (this.zMaxField !== value) {
      this.zMaxField = value
      this.changes.zMax = value
      this.hasChanged = true
    }
  }

  public apply(state: ViewportStateOptions= {}): ViewportState {
    for (let key of propertyKeys) {
      if (state.hasOwnProperty(key)) { this[key] = state[key] }
    }
    return this
  }

  public commit(state?: ViewportStateOptions): ViewportState {
    if (state) { this.apply(state) }
    if (!this.hasChanged) { return this }
    let gl = this.gl
    let changes = this.changes
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

  public copy(out: any= {}): ViewportStateOptions {
    for (let key of propertyKeys) { out[key] = this[key] }
    return out
  }

  public resolve(): ViewportState {
    ViewportState.resolve(this.gl, this)
    this.clearChanges()
    return this
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of propertyKeys) { this.changes[key] = undefined }
  }

  public static resolve(gl: WebGLRenderingContext, out: any= {}): ViewportStateOptions {
    let range = gl.getParameter(gl.DEPTH_RANGE)
    out.zMin = range[0]
    out.zMax = range[1]
    let viewport = gl.getParameter(gl.VIEWPORT)
    out.width = viewport[2]
    out.height = viewport[3]
    out.x = viewport[0]
    out.y = viewport[1]
    return out
  }
}
