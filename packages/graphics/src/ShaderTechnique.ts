import { copy } from '@gglib/utils'
import { Device } from './Device'
import { ShaderPass, ShaderPassOptions } from './ShaderPass'

/**
 * Constructor options for {@link ShaderTechnique}
 *
 * @public
 */
export interface ShaderTechniqueOptions {
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
  passes: Array<ShaderPassOptions | ShaderPass>
}

/**
 * Defines a sequence of {@link ShaderPass}es
 *
 * @public
 */
export class ShaderTechnique {
  /**
   * A symbol identifying the `ShaderTechniqueOptions` type.
   */
  public static OptionsSymbol = Symbol('ShaderTechniqueOptions')

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
  public passes: ShaderPass[] = []
  /**
   * Arbitrary meta data or info about the shader technique
   */
  public meta: Record<string, any>

  private passesByName = new Map<string, ShaderPass>()

  constructor(device: Device, options: ShaderTechniqueOptions) {
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    for (let pass of options.passes) {
      if (pass instanceof ShaderPass) {
        this.passes.push(pass)
      } else {
        this.passes.push(new ShaderPass(device, pass))
      }
    }
    for (const pass of this.passes) {
      if (pass.name) {
        this.passesByName.set(pass.name, pass)
      }
    }
  }

  /**
   * Gets a {@link ShaderPass} by name or index
   */
  public pass(passIdentifier: string | number): ShaderPass {
    let result: ShaderPass
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
  public clone(): ShaderTechnique {
    return new ShaderTechnique(this.device, {
      name: this.name,
      meta: copy(true, this.meta),
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
}
