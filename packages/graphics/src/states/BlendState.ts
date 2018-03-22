import {
  Blend,
  BlendFunction,
} from './../enums'

import { Device } from './../Device'

let propertyKeys = [
  'colorBlendFunction',
  'alphaBlendFunction',
  'colorSrcBlend',
  'alphaSrcBlend',
  'colorDstBlend',
  'alphaDstBlend',
  'constantR',
  'constantG',
  'constantB',
  'constantA',
  'enabled',
]

/**
 * @public
 */
export interface BlendStateOptions {
  colorBlendFunction?: number
  alphaBlendFunction?: number
  colorSrcBlend?: number
  alphaSrcBlend?: number
  colorDstBlend?: number
  alphaDstBlend?: number
  constantR?: number
  constantG?: number
  constantB?: number
  constantA?: number
  enabled?: boolean
}

/**
 * @public
 */
export class BlendState implements BlendStateOptions {
  public device: Device
  public gl: WebGLRenderingContext
  private $colorBlendFunction: number = BlendFunction.Add
  private $alphaBlendFunction: number = BlendFunction.Add
  private $colorSrcBlend: number = Blend.One
  private $alphaSrcBlend: number = Blend.One
  private $colorDstBlend: number = Blend.Zero
  private $alphaDstBlend: number = Blend.Zero
  private $constantR: number = 0
  private $constantG: number = 0
  private $constantB: number = 0
  private $constantA: number = 0
  private $enabled: boolean = false
  private hasChanged: boolean = false
  private changes: BlendStateOptions = {}

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, state?: BlendStateOptions) {
    this.device = device
    this.gl = device.context
    this.resolve()
    if (state) {
      this.assign(state)
    }
  }

  get colorBlendFunctionName(): string {
    return BlendFunction.nameOf(this.$colorBlendFunction)
  }

  get colorBlendFunction(): number {
    return this.$colorBlendFunction
  }

  set colorBlendFunction(value: number) {
    if (this.$colorBlendFunction !== value) {
      this.$colorBlendFunction = value
      this.changes.colorBlendFunction = value
      this.hasChanged = true
    }
  }

  get alphaBlendFunctionName(): string {
    return BlendFunction.nameOf(this.$alphaBlendFunction)
  }

  get alphaBlendFunction(): number {
    return this.$alphaBlendFunction
  }

  set alphaBlendFunction(value: number) {
    if (this.$alphaBlendFunction !== value) {
      this.$alphaBlendFunction = value
      this.changes.alphaBlendFunction = value
      this.hasChanged = true
    }
  }

  get colorSrcBlendName(): string {
    return Blend.nameOf(this.$colorSrcBlend)
  }

  get colorSrcBlend(): number {
    return this.$colorSrcBlend
  }

  set colorSrcBlend(value: number) {
    if (this.$colorSrcBlend !== value) {
      this.$colorSrcBlend = value
      this.changes.colorSrcBlend = value
      this.hasChanged = true
    }
  }

  get alphaSrcBlendName(): string {
    return Blend.nameOf(this.$alphaSrcBlend)
  }

  get alphaSrcBlend(): number {
    return this.$alphaSrcBlend
  }

  set alphaSrcBlend(value: number) {
    if (this.$alphaSrcBlend !== value) {
      this.$alphaSrcBlend = value
      this.changes.alphaSrcBlend = value
      this.hasChanged = true
    }
  }

  get colorDstBlendName(): string {
    return Blend.nameOf(this.$colorDstBlend)
  }

  get colorDstBlend(): number {
    return this.$colorDstBlend
  }

  set colorDstBlend(value: number) {
    if (this.$colorDstBlend !== value) {
      this.$colorDstBlend = value
      this.changes.colorDstBlend = value
      this.hasChanged = true
    }
  }

  get alphaDstBlendName(): string {
    return Blend.nameOf(this.$alphaDstBlend)
  }

  get alphaDstBlend(): number {
    return this.$alphaDstBlend
  }

  set alphaDstBlend(value: number) {
    if (this.$alphaDstBlend !== value) {
      this.$alphaDstBlend = value
      this.changes.alphaDstBlend = value
      this.hasChanged = true
    }
  }

  get constantR(): number {
    return this.$constantR
  }

  set constantR(value: number) {
    if (this.$constantR !== value) {
      this.$constantR = value
      this.changes.constantR = value
      this.hasChanged = true
    }
  }

  get constantG(): number {
    return this.$constantG
  }

  set constantG(value: number) {
    if (this.$constantG !== value) {
      this.$constantG = value
      this.changes.constantG = value
      this.hasChanged = true
    }
  }

  get constantB(): number {
    return this.$constantB
  }

  set constantB(value: number) {
    if (this.$constantB !== value) {
      this.$constantB = value
      this.changes.constantB = value
      this.hasChanged = true
    }
  }

  get constantA(): number {
    return this.$constantA
  }

  set constantA(value: number) {
    if (this.$constantA !== value) {
      this.$constantA = value
      this.changes.constantA = value
      this.hasChanged = true
    }
  }

  get enabled(): boolean {
    return this.$enabled
  }

  set enabled(value: boolean) {
    if (this.$enabled !== value) {
      this.$enabled = value
      this.changes.enabled = value
      this.hasChanged = true
    }
  }

  public assign(state: BlendStateOptions= {}): BlendState {
    for (let key of propertyKeys) {
      if (state.hasOwnProperty(key)) {
        this[key] = state[key]
      }
    }
    return this
  }

  public commit(state?: BlendStateOptions): BlendState {
    if (state) { this.assign(state) }
    if (!this.hasChanged) { return this }
    let gl = this.gl
    let changes = this.changes
    let enabled = this.enabled
    if (enabled === true) {
      gl.enable(gl.BLEND)
    }
    if (enabled === false) {
      gl.disable(gl.BLEND)
    }
    if (changes.colorBlendFunction !== undefined || changes.alphaBlendFunction !== undefined) {
      gl.blendEquationSeparate(this.colorBlendFunction, this.alphaBlendFunction)
    }
    if (
      changes.colorSrcBlend !== undefined ||
      changes.colorDstBlend !== undefined ||
      changes.alphaSrcBlend !== undefined ||
      changes.alphaDstBlend !== undefined) {
      gl.blendFuncSeparate(this.colorSrcBlend, this.colorDstBlend, this.alphaSrcBlend, this.alphaDstBlend)
    }
    if (
      changes.constantR !== undefined ||
      changes.constantG !== undefined ||
      changes.constantB !== undefined ||
      changes.constantA !== undefined) {
      gl.blendColor(this.constantR, this.constantG, this.constantB, this.constantA)
    }
    this.clearChanges()
    return this
  }

  public copy(out: any= {}): BlendStateOptions {
    for (let key of propertyKeys) { out[key] = this[key] }
    return out
  }

  public resolve(): BlendState {
    BlendState.resolve(this.gl, this)
    this.hasChanged = false
    this.changes = {}
    return this
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of propertyKeys) { this.changes[key] = undefined }
  }

  public static resolve(gl: any, out: any= {}): BlendStateOptions {
    out.colorBlendFunction = gl.getParameter(gl.BLEND_EQUATION_RGB)
    out.alphaBlendFunction = gl.getParameter(gl.BLEND_EQUATION_ALPHA)
    out.colorSrcBlend = gl.getParameter(gl.BLEND_SRC_RGB)
    out.alphaSrcBlend = gl.getParameter(gl.BLEND_SRC_ALPHA)
    out.colorDstBlend = gl.getParameter(gl.BLEND_DST_RGB)
    out.alphaDstBlend = gl.getParameter(gl.BLEND_DST_ALPHA)
    let color = gl.getParameter(gl.BLEND_COLOR)
    // Linux Firefox returns null instead of an array, of blend is disabled
    out.constantR = color ? color[0] : 0
    out.constantG = color ? color[1] : 0
    out.constantB = color ? color[2] : 0
    out.constantA = color ? color[3] : 0
    out.enabled = gl.getParameter(gl.BLEND)
    return out
  }

  public static convert(state: any): BlendStateOptions {
    if (typeof state === 'string') {
      state = BlendState[state]
    }
    if (!state) {
      return state
    }
    if (state.colorBlendFunction) {
      state.colorBlendFunction = BlendFunction[state.colorBlendFunction]
    }
    if (state.alphaBlendFunction) {
      state.alphaBlendFunction = BlendFunction[state.alphaBlendFunction]
    }
    if (state.colorSrcBlend) {
      state.colorSrcBlend = Blend[state.colorSrcBlend]
    }
    if (state.alphaSrcBlend) {
      state.alphaSrcBlend = Blend[state.alphaSrcBlend]
    }
    if (state.colorDstBlend) {
      state.colorDstBlend = Blend[state.colorDstBlend]
    }
    if (state.alphaDstBlend) {
      state.alphaDstBlend = Blend[state.alphaDstBlend]
    }
    return state
  }

  public static Default = Object.freeze({
    colorBlendFunction: BlendFunction.Add,
    alphaBlendFunction: BlendFunction.Add,

    colorSrcBlend: Blend.One,
    alphaSrcBlend: Blend.One,
    colorDstBlend: Blend.Zero,
    alphaDstBlend: Blend.Zero,

    constantR: 0,
    constantG: 0,
    constantB: 0,
    constantA: 0,
    enabled: false,
  })

  public static Additive = Object.freeze({
    colorBlendFunction: BlendFunction.Add,
    alphaBlendFunction: BlendFunction.Add,

    colorSrcBlend: Blend.SrcAlpha,
    alphaSrcBlend: Blend.SrcAlpha,
    colorDstBlend: Blend.One,
    alphaDstBlend: Blend.One,

    constantR: 0,
    constantG: 0,
    constantB: 0,
    constantA: 0,
    enabled: true,
  })

  public static AlphaBlend = Object.freeze({
    colorBlendFunction: BlendFunction.Add,
    alphaBlendFunction: BlendFunction.Add,

    colorSrcBlend: Blend.One,
    alphaSrcBlend: Blend.One,

    colorDstBlend: Blend.SrcAlphaInv,
    alphaDstBlend: Blend.SrcAlphaInv,

    constantR: 0,
    constantG: 0,
    constantB: 0,
    constantA: 0,
    enabled: true,
  })

  public static NonPremultiplied = Object.freeze({
    colorBlendFunction: BlendFunction.Add,
    alphaBlendFunction: BlendFunction.Add,

    colorSrcBlend: Blend.SrcAlpha,
    alphaSrcBlend: Blend.SrcAlpha,

    colorDstBlend: Blend.SrcAlphaInv,
    alphaDstBlend: Blend.SrcAlphaInv,

    constantR: 0,
    constantG: 0,
    constantB: 0,
    constantA: 0,
    enabled: true,
  })
}
