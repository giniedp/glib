import {
  Blend,
  BlendFunction,
  BlendFunctionName,
  BlendName,
  nameOfBlend,
  nameOfBlendFunction,
  valueOfBlend,
  valueOfBlendFunction,
} from './../enums'

import { Device } from './../Device'

const propertyKeys: Array<keyof BlendStateParams> = [
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
 * Options for {@link BlendState.convert}
 *
 * @public
 */
export interface BlendStateOptions {
  colorBlendFunction?: BlendFunction | BlendFunctionName
  alphaBlendFunction?: BlendFunction | BlendFunctionName
  colorSrcBlend?: Blend | BlendName
  alphaSrcBlend?: Blend | BlendName
  colorDstBlend?: Blend | BlendName
  alphaDstBlend?: Blend | BlendName
  constantR?: number
  constantG?: number
  constantB?: number
  constantA?: number
  enabled?: boolean
}

/**
 * BlendState parameters that will be sent to the GPU
 *
 * @public
 */
export interface BlendStateParams {
  colorBlendFunction?: BlendFunction
  alphaBlendFunction?: BlendFunction
  colorSrcBlend?: Blend
  alphaSrcBlend?: Blend
  colorDstBlend?: Blend
  alphaDstBlend?: Blend
  constantR?: number
  constantG?: number
  constantB?: number
  constantA?: number
  enabled?: boolean
}

/**
 *
 * @public
 */
export class BlendState implements BlendStateParams {
  public device: Device
  private $colorBlendFunction = BlendFunction.Add
  private $alphaBlendFunction = BlendFunction.Add
  private $colorSrcBlend = Blend.One
  private $alphaSrcBlend = Blend.One
  private $colorDstBlend = Blend.Zero
  private $alphaDstBlend = Blend.Zero
  private $constantR: number = 0
  private $constantG: number = 0
  private $constantB: number = 0
  private $constantA: number = 0
  private $enabled: boolean = false
  private hasChanged: boolean = false
  private changes: BlendStateParams = {}

  constructor(device: Device, state?: BlendStateParams) {
    this.device = device
    this.resolve()
    if (state) {
      this.assign(state)
    }
  }

  /**
   * Indicates whether the state has been changed but not committed to the GPU
   */
  public get isDirty() {
    return this.hasChanged
  }

  private get gl() {
    return this.device.context
  }

  /**
   * @internal
   */
  public get colorBlendFunctionName(): string {
    return nameOfBlendFunction(this.$colorBlendFunction)
  }

  /**
   *
   */
  public get colorBlendFunction(): BlendFunction {
    return this.$colorBlendFunction
  }

  public set colorBlendFunction(value: BlendFunction) {
    if (this.$colorBlendFunction !== value) {
      this.$colorBlendFunction = value
      this.changes.colorBlendFunction = value
      this.hasChanged = true
    }
  }

  /**
   * @internal
   */
  public get alphaBlendFunctionName(): string {
    return nameOfBlendFunction(this.$alphaBlendFunction)
  }

  public get alphaBlendFunction(): BlendFunction {
    return this.$alphaBlendFunction
  }

  public set alphaBlendFunction(value: BlendFunction) {
    if (this.$alphaBlendFunction !== value) {
      this.$alphaBlendFunction = value
      this.changes.alphaBlendFunction = value
      this.hasChanged = true
    }
  }

  /**
   * @internal
   */
  public get colorSrcBlendName(): string {
    return nameOfBlend(this.$colorSrcBlend)
  }

  public get colorSrcBlend(): Blend {
    return this.$colorSrcBlend
  }

  public set colorSrcBlend(value: Blend) {
    if (this.$colorSrcBlend !== value) {
      this.$colorSrcBlend = value
      this.changes.colorSrcBlend = value
      this.hasChanged = true
    }
  }

  /**
   * @internal
   */
  public get alphaSrcBlendName(): string {
    return nameOfBlend(this.$alphaSrcBlend)
  }

  public get alphaSrcBlend(): Blend {
    return this.$alphaSrcBlend
  }

  public set alphaSrcBlend(value: Blend) {
    if (this.$alphaSrcBlend !== value) {
      this.$alphaSrcBlend = value
      this.changes.alphaSrcBlend = value
      this.hasChanged = true
    }
  }

  /**
   * @internal
   */
  public get colorDstBlendName(): string {
    return nameOfBlend(this.$colorDstBlend)
  }

  public get colorDstBlend(): Blend {
    return this.$colorDstBlend
  }

  public set colorDstBlend(value: Blend) {
    if (this.$colorDstBlend !== value) {
      this.$colorDstBlend = value
      this.changes.colorDstBlend = value
      this.hasChanged = true
    }
  }

  /**
   * @internal
   */
  public get alphaDstBlendName(): string {
    return nameOfBlend(this.$alphaDstBlend)
  }

  public get alphaDstBlend(): Blend {
    return this.$alphaDstBlend
  }

  public set alphaDstBlend(value: Blend) {
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

  public assign(state: BlendStateParams= {}): BlendState {
    for (let key of propertyKeys) {
      if (state.hasOwnProperty(key)) {
        this[key as any] = state[key]
      }
    }
    return this
  }

  public commit(state?: BlendStateParams): BlendState {
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

  public copy(out: any= {}): BlendStateParams {
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
    for (let key of propertyKeys) { this.changes[key as any] = undefined }
  }

  public static resolve(gl: any, out: BlendStateParams= {}): BlendStateParams {
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

  public static convert(state: string | BlendStateOptions): BlendStateParams {
    if (typeof state === 'string') {
      return BlendState[state] ? {...BlendState[state]} : null
    }
    if (!state) {
      return null
    }

    if (state.colorBlendFunction) {
      state.colorBlendFunction = valueOfBlendFunction(state.colorBlendFunction)
    }
    if (state.alphaBlendFunction) {
      state.alphaBlendFunction = valueOfBlendFunction(state.alphaBlendFunction)
    }
    if (state.colorSrcBlend) {
      state.colorSrcBlend = valueOfBlend(state.colorSrcBlend)
    }
    if (state.alphaSrcBlend) {
      state.alphaSrcBlend = valueOfBlend(state.alphaSrcBlend)
    }
    if (state.colorDstBlend) {
      state.colorDstBlend = valueOfBlend(state.colorDstBlend)
    }
    if (state.alphaDstBlend) {
      state.alphaDstBlend = valueOfBlend(state.alphaDstBlend)
    }
    return state as BlendStateParams
  }

  public static Default = Object.freeze<BlendStateParams>({
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

  public static Additive = Object.freeze<BlendStateParams>({
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

  public static AlphaBlend = Object.freeze<BlendStateParams>({
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

  public static NonPremultiplied = Object.freeze<BlendStateParams>({
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
