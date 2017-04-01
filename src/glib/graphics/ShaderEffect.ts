module Glib.Graphics {

  export interface ShaderEffectOptions {
    /**
     * The name of an effect
     */
    name?:string
    /**
     * The parameter set of an effect
     */
    parameters?: any
    /**
     * A program (or constructor options) for an effect
     */
    program?:ShaderProgram|ShaderProgramOptions
    /**
     * A collection of programs of an effect
     */
    techniques?: (ShaderTechniqueOptions|ShaderTechnique)[]|ShaderTechnique
    /**
     * The name or index of the default technique of an effect
     */
    technique?: string|number
  }

  function makeArray(arg:any):any {
    if (Array.isArray(arg)) {
      return arg
    } else if (arg) {
      return [arg]
    } else {
      return []
    }
  }

  export class ShaderEffect {
    /**
     * The name of the effect
     */
    name:string
    /**
     * The graphics device
     */
    device:Device
    /**
     * The effect parameters
     */
    parameters:Object
    /**
     * The technique collection
     */
    techniques:ShaderTechnique[]
    /**
     * The technique that is currently active
     */
    technique:ShaderTechnique

    /**
     * 
     */
    constructor(device:Device, options:ShaderEffectOptions) {
      this.device = device
      this.name = options.name
      this.parameters = options.parameters || {}
      this.techniques = [] 

      let techniques = makeArray(options.techniques)
      if (options.program) {
        techniques.push({
          name: 'TECHNIQUE' + techniques.length,
          passes: [{ program: options.program }]
        })
      }
      for (let technique of techniques) {
        if (technique instanceof ShaderTechnique) {
          this.techniques.push(technique)
        } else {
          this.techniques.push(new ShaderTechnique(device, technique)) 
        }
      }

      this.technique = this.getTechnique(options.technique || 0)
    }

    /**
     * 
     */
    useTechnique(techniqueIdentifier: number|string):ShaderEffect {
      this.technique = this.getTechnique(techniqueIdentifier)
      return this
    }
    
    /**
     * Gets a technique by name or index
     */
    getTechnique(techniqueIdentifier:string|number):ShaderTechnique {
      if (typeof techniqueIdentifier === 'number') {
        let result = this.techniques[techniqueIdentifier]
        if (result) return result
      } 
      for (let tech of this.techniques) {
        if (tech.name == techniqueIdentifier) return tech
      }
      throw `Technique '${techniqueIdentifier}' not found`
    }
    
    pass(passIdentifier:string|number):ShaderPass {
      if (typeof passIdentifier === 'number') {
        let result = this.technique.passes[passIdentifier]
        if (result) return result
      }
      for (let pass of this.technique.passes) {
        if (pass.name == passIdentifier) return pass
      }
      throw `Pass '${passIdentifier}' not found`
    }

    /**
     * Draws a mesh with the current technique
     */
    drawMesh(mesh:ModelMesh) {
      for (let pass of this.technique.passes) {
        pass.commit(this.parameters) // TODO:
        mesh.draw(pass.program)
      }
    }

    /**
     * Returns a clone of this effect
     */
    clone():ShaderEffect {
      return new ShaderEffect(this.device, {
        name: this.name,
        parameters: utils.copy(true, this.parameters),
        techniques: this.techniques.map(function(it) { return it.clone() }),
        technique: this.techniques.indexOf(this.technique)
      })
    }
  }
}
