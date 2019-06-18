import { Device } from './../Device'

let optionKeys: Array<keyof OffsetStateParams> = [
  'offsetEnable',
  'offsetFactor',
  'offsetUnits',
]

/**
 * @public
 */
export interface OffsetStateParams {
  offsetEnable?: boolean
  offsetFactor?: number
  offsetUnits?: number
}

/**
 * @public
 */
export class OffsetState implements OffsetStateParams {
  public device: Device
  public gl: WebGLRenderingContext
  private offsetEnableField: boolean = false
  private offsetFactorField: number = 0
  private offsetUnitsField: number = 0
  private hasChanged: boolean = false
  private changes: OffsetStateParams = {}

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, state?: OffsetStateParams) {
    this.device = device
    this.gl = device.context
    this.resolve()
    if (state) { this.assign(state) }
  }

  get offsetEnable(): boolean {
    return this.offsetEnableField
  }

  set offsetEnable(value: boolean) {
    if (this.offsetEnableField !== value) {
      this.offsetEnableField = value
      this.changes.offsetEnable = value
      this.hasChanged = true
    }
  }

  get offsetFactor(): number {
    return this.offsetFactorField
  }

  set offsetFactor(value: number) {
    if (this.offsetFactorField !== value) {
      this.offsetFactorField = value
      this.changes.offsetFactor = value
      this.hasChanged = true
    }
  }

  get offsetUnits(): number {
    return this.offsetUnitsField
  }

  set offsetUnits(value: number) {
    if (this.offsetUnitsField !== value) {
      this.offsetUnitsField = value
      this.changes.offsetUnits = value
      this.hasChanged = true
    }
  }

  public assign(state: OffsetStateParams): OffsetState {
    for (let key of optionKeys) {
      if (state.hasOwnProperty(key)) { this[key as any] = state[key] }
    }
    return this
  }

  public commit(state?: OffsetStateParams): OffsetState {
    if (state) { this.assign(state) }
    if (!this.hasChanged) { return this }
    let changes = this.changes
    let gl = this.gl
    if (this.changes.offsetEnable === true) {
      gl.enable(gl.POLYGON_OFFSET_FILL)
    }
    if (this.changes.offsetEnable === false) {
      gl.disable(gl.POLYGON_OFFSET_FILL)
    }
    if (this.changes.offsetFactor !== null || this.changes.offsetUnits !== null) {
      gl.polygonOffset(this.offsetFactor, this.offsetUnits)
    }
    this.clearChanges()
    return this
  }

  public copy(out: any= {}): OffsetStateParams {
    for (let key of optionKeys) { out[key] = this[key] }
    return out
  }

  public resolve(): OffsetState {
    OffsetState.resolve(this.gl, this)
    this.clearChanges()
    return this
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of optionKeys) { this.changes[key as any] = undefined }
  }

  public static convert(state: string | OffsetStateParams): OffsetStateParams {
    if (typeof state === 'string') {
      return OffsetState[state] ? {...OffsetState[state]} : null
    }
    return state
  }

  public static resolve(gl: any, out: any= {}): OffsetStateParams {
    out.offsetEnable = gl.getParameter(gl.POLYGON_OFFSET_FILL)
    out.offsetFactor = gl.getParameter(gl.POLYGON_OFFSET_FACTOR)
    out.offsetUnits = gl.getParameter(gl.POLYGON_OFFSET_UNITS)
    return out
  }

  public static Default = Object.freeze<OffsetStateParams>({
    offsetEnable: false,
    offsetFactor: 0,
    offsetUnits: 0,
  })
}
