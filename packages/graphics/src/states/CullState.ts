import {
  CullMode,
  CullModeOption,
  FrontFace,
  FrontFaceOption,
  nameOfFrontFace,
  valueOfCullMode,
  valueOfFrontFace,
} from './../enums/Enums'

import { Device } from './../Device'

const optionKeys: Array<keyof CullStateParams> = ['frontFace', 'cullMode', 'culling']

/**
 * @public
 */
export interface CullStateParams {
  frontFace?: FrontFace
  cullMode?: CullMode
  culling?: boolean
}

/**
 * @public
 */
export interface CullStateOptions {
  frontFace?: FrontFaceOption
  cullMode?: CullModeOption
  culling?: boolean
}

/**
 * @public
 */
export class CullState implements CullStateParams {
  public device: Device
  public gl: WebGLRenderingContext
  private frontFaceField: number = FrontFace.CounterClockWise
  private cullModeField: number = CullMode.Back
  private cullingField: boolean = false
  private hasChanged: boolean = false
  private changes: CullStateParams = {}

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, state?: CullStateParams) {
    this.device = device
    this.gl = device.context
    this.resolve()
    if (state) { this.assign(state) }
  }

  get culling(): boolean {
    return this.cullingField
  }

  set culling(value: boolean) {
    if (this.cullingField !== value) {
      this.cullingField = value
      this.changes.culling = value
      this.hasChanged = true
    }
  }

  get frontFaceName(): string {
    return nameOfFrontFace(this.frontFace)
  }

  get frontFace(): number {
    return this.frontFaceField
  }

  set frontFace(value: number) {
    if (this.frontFaceField !== value) {
      this.frontFaceField = value
      this.changes.frontFace = value
      this.hasChanged = true
    }
  }

  get cullModeName(): string {
    return nameOfFrontFace(this.cullMode)
  }

  get cullMode(): number {
    return this.cullModeField
  }

  set cullMode(value: number) {
    if (this.cullModeField !== value) {
      this.cullModeField = value
      this.changes.cullMode = value
      this.hasChanged = true
    }
  }

  public assign(state: CullStateParams): CullState {
    for (let key of optionKeys) {
      if (state.hasOwnProperty(key)) { this[key as any] = state[key] }
    }
    return this
  }

  public commit(state?: CullStateParams): CullState {
    if (state) { this.assign(state) }
    if (!this.hasChanged) { return this }
    let gl = this.gl
    let changes = this.changes
    if (changes.culling === true) {
      gl.enable(gl.CULL_FACE)
    }
    if (changes.culling === false) {
      gl.disable(gl.CULL_FACE)
    }
    if (changes.cullMode !== null) {
      gl.cullFace(this.cullMode)
    }
    if (changes.frontFace !== null) {
      gl.frontFace(this.frontFace)
    }
    this.clearChanges()
    return this
  }

  public resolve(): CullState {
    CullState.resolve(this.gl, this)
    this.clearChanges()
    return this
  }

  public copy(out: any= {}): CullStateParams {
    for (let key of optionKeys) { out[key] = this[key] }
    return out
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of optionKeys) { this.changes[key as any] = undefined }
  }

  public static convert(state: string | CullStateOptions): CullStateParams {
    if (typeof state === 'string') {
      return CullState[state] ? {...CullState[state]} : null
    }
    if (!state) {
      return null
    }

    if (state.cullMode) {
      state.cullMode = valueOfCullMode(state.cullMode)
    }
    if (state.frontFace) {
      state.frontFace = valueOfFrontFace(state.frontFace)
    }
    return state as CullStateParams
  }

  public static resolve(gl: any, out: any= {}): CullStateParams {
    out.frontFace = gl.getParameter(gl.FRONT_FACE)
    out.culling = gl.getParameter(gl.CULL_FACE)
    out.cullMode = gl.getParameter(gl.CULL_FACE_MODE)
    return out
  }

  public static Default = Object.freeze<CullStateParams>({
    culling: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.ClockWise,
  })

  public static CullNone = Object.freeze<CullStateParams>({
    culling: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.ClockWise,
  })

  public static CullClockWise = Object.freeze<CullStateParams>({
    culling: true,
    cullMode: CullMode.Back,
    frontFace: FrontFace.CounterClockWise,
  })

  public static CullCounterClockWise = Object.freeze<CullStateParams>({
    culling: true,
    cullMode: CullMode.Back,
    frontFace: FrontFace.ClockWise,
  })
}
