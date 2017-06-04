import { CullMode, FrontFace } from './../enums/Enums'

import { Device } from './../Device'

export interface CullStateOptions {
  frontFace?: number
  cullMode?: number
  culling?: boolean
}

const optionKeys: Array<keyof CullStateOptions> = ['frontFace', 'cullMode', 'culling']

export class CullState implements CullStateOptions {
  public device: Device
  public gl: WebGLRenderingContext
  private frontFaceField: number = FrontFace.CounterClockWise
  private cullModeField: number = CullMode.Back
  private cullingField: boolean = false
  private hasChanged: boolean = false
  private changes: CullStateOptions = {}

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, state?: CullStateOptions) {
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

  get frontFace(): number {
    return this.frontFaceField
  }

  get frontFaceName(): string {
    return FrontFace.nameOf(this.frontFace)
  }

  set frontFace(value: number) {
    if (this.frontFaceField !== value) {
      this.frontFaceField = value
      this.changes.frontFace = value
      this.hasChanged = true
    }
  }

  get cullMode(): number {
    return this.cullModeField
  }

  get cullModeName(): string {
    return CullMode.nameOf(this.cullMode)
  }

  set cullMode(value: number) {
    if (this.cullModeField !== value) {
      this.cullModeField = value
      this.changes.cullMode = value
      this.hasChanged = true
    }
  }

  public assign(state: CullStateOptions): CullState {
    for (let key of optionKeys) {
      if (state.hasOwnProperty(key)) { this[key] = state[key] }
    }
    return this
  }

  public commit(state?: CullStateOptions): CullState {
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

  public copy(out: any= {}): CullStateOptions {
    for (let key of optionKeys) { out[key] = this[key] }
    return out
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of optionKeys) { this.changes[key] = undefined }
  }

  public static convert(state: any): CullStateOptions {
    if (typeof state === 'string') {
      state = CullState[state]
    }
    if (!state) {
      return state
    }
    if (state.cullMode) {
      state.cullMode = CullMode[state.cullMode]
    }
    if (state.frontFace) {
      state.frontFace = FrontFace[state.frontFace]
    }
    return state
  }

  public static resolve(gl: any, out: any= {}): CullStateOptions {
    out.frontFace = gl.getParameter(gl.FRONT_FACE)
    out.culling = gl.getParameter(gl.CULL_FACE)
    out.cullMode = gl.getParameter(gl.CULL_FACE_MODE)
    return out
  }

  public static Default = Object.freeze({
    culling: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.CounterClockWise,
  })

  public static CullNone = Object.freeze({
    culling: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.CounterClockWise,
  })

  public static CullClockWise = Object.freeze({
    culling: true,
    cullMode: CullMode.Back,
    frontFace: FrontFace.CounterClockWise,
  })

  public static CullCounterClockWise = Object.freeze({
    culling: true,
    cullMode: CullMode.Back,
    frontFace: FrontFace.ClockWise,
  })
}
