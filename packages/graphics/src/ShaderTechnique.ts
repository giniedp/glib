import { copy } from '@gglib/core'
import { Device } from './Device'
import { ShaderPass, ShaderPassOptions } from './ShaderPass'

/**
 * ShaderTechnique constructor options
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
  meta?: { [key: string]: any }
  /**
   * Collection of passes of this technique
   */
  passes?: Array<ShaderPassOptions|ShaderPass>
}

/**
 * @public
 */
export class ShaderTechnique {
  /**
   *
   */
  public device: Device
  /**
   * The identifying name of this technique
   */
  public name: string
  /**
   * Collection of passes of this technique
   */
  public passes: ShaderPass[]
  /**
   * Arbitrary meta data or info about the shader technique
   */
  public meta: { [key: string]: any }
  /**
   *
   */
  constructor(device: Device, options: ShaderTechniqueOptions= {}) {
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    this.passes = []
    for (let pass of options.passes) {
      if (pass instanceof ShaderPass) {
        this.passes.push(pass)
      } else {
        this.passes.push(new ShaderPass(device, pass))
      }
    }
  }

  public pass(passIdentifier: string|number): ShaderPass {
    if (typeof passIdentifier === 'number') {
      let result = this.passes[passIdentifier]
      if (result) { return result }
    }
    for (let pass of this.passes) {
      if (pass.name === passIdentifier) { return pass }
    }
    throw new Error(`Pass '${passIdentifier}' not found`)
  }

  public clone(): ShaderTechnique {
    return new ShaderTechnique(this.device, {
      name: this.name,
      meta: copy(true, this.meta),
      passes: this.passes.map((it) => it.clone()),
    })
  }
}
