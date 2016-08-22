module Glib.Graphics {

  /**
   * ShaderTechnique constructor options
   */
  export interface ShaderTechniqueOptions {
    /**
     * The identifying name of this technique
     */
    name?: string
    /**
     * Arbitrary meta data or info about the shader technique
     */
    meta?: Object
    /**
     * Collection of passes of this technique
     */
    passes?: (ShaderPassOptions|ShaderPass)[]
  }
  
  export class ShaderTechnique {
    /**
     * 
     */
    device: Device
    /**
     * The identifying name of this technique
     */
    name: string
    /**
     * Collection of passes of this technique
     */
    passes: ShaderPass[]
    /**
     * Arbitrary meta data or info about the shader technique
     */
    meta: Object
    /**
     * 
     */
    constructor(device:Device, options:ShaderTechniqueOptions={}) {
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

    pass(passIdentifier:string|number):ShaderPass {
      if (typeof passIdentifier === 'number') {
        let result = this.passes[passIdentifier]
        if (result) return result
      }
      for (let pass of this.passes) {
        if (pass.name == passIdentifier) return pass
      }
      throw `Pass '${passIdentifier}' not found`
    }

    clone(): ShaderTechnique {
      return new ShaderTechnique(this.device, {
        name: this.name,
        meta: utils.copy(true, this.meta),
        passes: this.passes.map(function(it) { return it.clone() })
      })
    }
  }
}
