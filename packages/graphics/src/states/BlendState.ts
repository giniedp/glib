import {
  Blend,
  BlendFunction,
  BlendFunctionOption,
  BlendOption,
  nameOfBlend,
  nameOfBlendFunction,
  valueOfBlend,
  valueOfBlendFunction,
} from './../enums'

const params: Array<keyof BlendStateParams> = [
  'alphaBlendFunction',
  'alphaDstBlend',
  'alphaSrcBlend',
  'colorBlendFunction',
  'colorDstBlend',
  'colorSrcBlend',
  'constantA',
  'constantB',
  'constantG',
  'constantR',
  'enable',
]

/**
 * Options to be converted into {@link IBlendState} via {@link BlendState.convert}
 *
 * @public
 */
export interface BlendStateOptions {
  colorBlendFunction?: BlendFunctionOption
  alphaBlendFunction?: BlendFunctionOption
  colorSrcBlend?: BlendOption
  alphaSrcBlend?: BlendOption
  colorDstBlend?: BlendOption
  alphaDstBlend?: BlendOption
  constantR?: number
  constantG?: number
  constantB?: number
  constantA?: number
  enable?: boolean
}

/**
 * An object with all blend state parameters
 *
 * @public
 */
export interface IBlendState {
  colorBlendFunction: BlendFunction
  alphaBlendFunction: BlendFunction
  colorSrcBlend: Blend
  alphaSrcBlend: Blend
  colorDstBlend: Blend
  alphaDstBlend: Blend
  constantR: number
  constantG: number
  constantB: number
  constantA: number
  enable: boolean
}

/**
 * Represents a sub set of {@link IBlendState}
 *
 * @public
 */
export type BlendStateParams = Partial<IBlendState>

/**
 * @public
 */
export class BlendState implements IBlendState {

  protected $colorBlendFunction = BlendFunction.Add
  protected $alphaBlendFunction = BlendFunction.Add
  protected $colorSrcBlend = Blend.One
  protected $alphaSrcBlend = Blend.One
  protected $colorDstBlend = Blend.Zero
  protected $alphaDstBlend = Blend.Zero
  protected $constantR: number = 0
  protected $constantG: number = 0
  protected $constantB: number = 0
  protected $constantA: number = 0
  protected $enable: boolean = false
  protected $hasChanged: boolean = false
  protected $changes: BlendStateParams = {}

  /**
   * Indicates whether the state has changes which are not committed to the GPU
   */
  public get isDirty() {
    return this.$hasChanged
  }

  /**
   * Gets a readable name of the color blend function
   */
  public get colorBlendFunctionName(): string {
    return nameOfBlendFunction(this.$colorBlendFunction)
  }
  /**
   * Gets and sets the color blend function
   */
  public get colorBlendFunction(): BlendFunction {
    return this.$colorBlendFunction
  }
  public set colorBlendFunction(value: BlendFunction) {
    if (this.$colorBlendFunction !== value) {
      this.$colorBlendFunction = value
      this.$changes.colorBlendFunction = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets a readable name of the alpha blend function
   */
  public get alphaBlendFunctionName(): string {
    return nameOfBlendFunction(this.$alphaBlendFunction)
  }
  /**
   * Gets and sets the alpha blend function
   */
  public get alphaBlendFunction(): BlendFunction {
    return this.$alphaBlendFunction
  }
  public set alphaBlendFunction(value: BlendFunction) {
    if (this.$alphaBlendFunction !== value) {
      this.$alphaBlendFunction = value
      this.$changes.alphaBlendFunction = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets a readable name of the blend factor for the source color
   */
  public get colorSrcBlendName(): string {
    return nameOfBlend(this.$colorSrcBlend)
  }
  /**
   * Gets and sets the blend factor for the source color
   */
  public get colorSrcBlend(): Blend {
    return this.$colorSrcBlend
  }
  public set colorSrcBlend(value: Blend) {
    if (this.$colorSrcBlend !== value) {
      this.$colorSrcBlend = value
      this.$changes.colorSrcBlend = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets a readable name of the blend factor for the source alpha
   */
  public get alphaSrcBlendName(): string {
    return nameOfBlend(this.$alphaSrcBlend)
  }
  /**
   * Gets and sets the blend factor for the source alpha
   */
  public get alphaSrcBlend(): Blend {
    return this.$alphaSrcBlend
  }
  public set alphaSrcBlend(value: Blend) {
    if (this.$alphaSrcBlend !== value) {
      this.$alphaSrcBlend = value
      this.$changes.alphaSrcBlend = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets a readable name of the blend factor for the destination color
   */
  public get colorDstBlendName(): string {
    return nameOfBlend(this.$colorDstBlend)
  }
  /**
   * Gets and sets the blend factor for the destination color
   */
  public get colorDstBlend(): Blend {
    return this.$colorDstBlend
  }
  public set colorDstBlend(value: Blend) {
    if (this.$colorDstBlend !== value) {
      this.$colorDstBlend = value
      this.$changes.colorDstBlend = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets a readable name of the blend factor for the destination alpha
   */
  public get alphaDstBlendName(): string {
    return nameOfBlend(this.$alphaDstBlend)
  }
  /**
   * Gets and sets the blend factor for the destination alpha
   */
  public get alphaDstBlend(): Blend {
    return this.$alphaDstBlend
  }
  public set alphaDstBlend(value: Blend) {
    if (this.$alphaDstBlend !== value) {
      this.$alphaDstBlend = value
      this.$changes.alphaDstBlend = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the red component of the blend color
   */
  public get constantR(): number {
    return this.$constantR
  }
  public set constantR(value: number) {
    if (this.$constantR !== value) {
      this.$constantR = value
      this.$changes.constantR = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the green component of the blend color
   */
  public get constantG(): number {
    return this.$constantG
  }
  public set constantG(value: number) {
    if (this.$constantG !== value) {
      this.$constantG = value
      this.$changes.constantG = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the blue component of the blend color
   */
  public get constantB(): number {
    return this.$constantB
  }
  public set constantB(value: number) {
    if (this.$constantB !== value) {
      this.$constantB = value
      this.$changes.constantB = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the alpha component of the blend color
   */
  public get constantA(): number {
    return this.$constantA
  }
  public set constantA(value: number) {
    if (this.$constantA !== value) {
      this.$constantA = value
      this.$changes.constantA = value
      this.$hasChanged = true
    }
  }

  /**
   * Enables or disables blending functionality
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
   * Assigns multiple parameters to the current state
   */
  public assign(state: BlendStateParams): this {
    for (let key of params) {
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
  public commit(state?: BlendStateParams): this {
    if (state) { this.assign(state) }
    if (!this.$hasChanged) { return this }
    this.commitChanges(this.$changes)
    this.clearChanges()
    return this
  }

  /**
   * Creates a copy of this state state
   */
  public copy(): IBlendState
  /**
   * Creates a copy of this state and writes it into the target object
   *
   * @param target - Where the state should be written to
   */
  public copy<T>(target: T): T & IBlendState
  public copy(out: any = {}): IBlendState {
    for (let key of params) {
      out[key] = this[key]
    }
    return out
  }

  protected commitChanges(changes: Partial<IBlendState>) {
    //
  }

  protected clearChanges() {
    this.$hasChanged = false
    for (let key of params) { this.$changes[key as any] = undefined }
  }

  /**
   * Converts a state name or options into {@link BlendStateParams}
   *
   * @param state - The state name or state options to convert
   */
  public static convert(state: string | BlendStateOptions): BlendStateParams {
    if (typeof state === 'string') {
      return BlendState[state] ? { ...BlendState[state] } : null
    }

    if (!state) {
      return null
    }

    const result: BlendStateParams = {}

    for (const key of params) {
      if (!(key in state)) {
        continue
      }
      switch (key) {
        case 'colorBlendFunction':
        case 'alphaBlendFunction':
          result[key] = valueOfBlendFunction(state[key])
          break
        case 'colorSrcBlend':
        case 'alphaSrcBlend':
        case 'colorDstBlend':
        case 'alphaDstBlend':
          result[key] = valueOfBlend(state[key])
          break
        case 'enable':
          result[key] = state[key]
          break
        default:
          result[key] = state[key]
          break
      }
    }

    return result
  }

  /**
   * A default blend state where blending is disabled
   */
  public static readonly Default = Object.freeze<IBlendState>({
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
    enable: false,
  })

  /**
   * A blend state with disabled blending
   */
  public static readonly None = Object.freeze<IBlendState>({
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
    enable: false,
  })

  /**
   * A blend state for additive blending
   */
  public static readonly Additive = Object.freeze<IBlendState>({
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
    enable: true,
  })

  /**
   * A blend state for pre multiplied alpha blending
   */
  public static readonly AlphaBlend = Object.freeze<IBlendState>({
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
    enable: true,
  })

  /**
   * A blend state for non pre multiplied alpha blending
   */
  public static readonly NonPremultiplied = Object.freeze<IBlendState>({
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
    enable: true,
  })
}
