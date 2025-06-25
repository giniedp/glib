import { Device } from './Device'
import { EffectPass, EffectPassOptions } from './EffectPass'

/**
 * Constructor options for {@link EffectTechnique}
 *
 * @public
 */
export interface EffectTechniqueOptions {
  /**
   * The identifying name of this technique
   */
  name?: string
  /**
   * Arbitrary meta data or info about the shader technique
   */
  meta?: Record<string, any>
  /**
   * Collection of passes of this technique
   */
  passes: Array<EffectPassOptions | EffectPass>
}

/**
 * Defines a sequence of {@link EffectPass}es
 *
 * @public
 */
export class EffectTechnique {
  /**
   * A symbol identifying the `EffectTechniqueOptions` type.
   */
  public static OptionsSymbol = Symbol('EffectTechniqueOptions')

  /**
   * The graphics device
   */
  public device: Device

  /**
   * The user defined name of this technique
   */
  public name: string

  /**
   * Collection of passes of this technique
   */
  public passes: EffectPass[] = []

  /**
   * Arbitrary meta data or info about the shader technique
   */
  public meta: Record<string, any>

  /**
   * Shorthand to access the first pass
   */
  public get pass0() {
    if (this.passes.length === 0) {
      throw new Error('No passes defined in this technique')
    }
    return this.passes[0]
  }

  /**
   * Shorthand to access the first pass program
   */
  public get program0() {
    return this.pass0.program
  }

  private passesByName = new Map<string, EffectPass>()

  constructor(device: Device, options: EffectTechniqueOptions) {
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    for (let pass of options.passes) {
      if (pass instanceof EffectPass) {
        this.passes.push(pass)
      } else {
        this.passes.push(new EffectPass(device, pass))
      }
    }
    for (const pass of this.passes) {
      if (pass.name) {
        this.passesByName.set(pass.name, pass)
      }
    }
  }

  /**
   * Gets a {@link EffectPass} by name or index
   */
  public pass(passIdentifier: string | number): EffectPass {
    let result: EffectPass
    if (typeof passIdentifier === 'number') {
      result = this.passes[passIdentifier]
    } else {
      result = this.passesByName.get(passIdentifier)
    }
    if (!result) {
      throw new Error(`Pass '${passIdentifier}' not found`)
    }
    return result
  }

  /**
   * Creates a clone of this technique
   *
   * @remarks
   * Clones each underlying shader pass and creates a new shader technique
   */
  public clone(): EffectTechnique {
    return new EffectTechnique(this.device, {
      name: this.name,
      meta: { ...(this.meta || {}) },
      passes: this.passes.map((it) => it.clone()),
    })
  }

  /**
   * Checks if all shader passes are ready
   *
   * @remarks
   * If no passes are defined, this will return true
   */
  public isReady() {
    if (!this.passes?.length) {
      return true
    }
    for (const pass of this.passes) {
      if (!pass.isReady()) {
        return false
      }
    }
    return true
  }

  public dispose() {
    if (this.passes) {
      for (const pass of this.passes) {
        pass.dispose()
      }
    }
    this.passes = []
    this.passesByName.clear()
    this.device = null
  }
}
