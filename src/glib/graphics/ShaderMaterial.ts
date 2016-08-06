module Glib.Graphics {

  export interface ShaderTechniqueOptions {
    name: string,
    passes: MaterialPassOptions[]
  }
  export interface ShaderTechnique {
    name: string,
    passes: ShaderPass[]
  }
  export interface ShaderMaterialOptions {
    name?:string,
    //effect?:any,
    
    program?:ShaderProgram|ShaderProgramOptions,
    parameters?: any,

    technique?: string|number,
    techniques?: ShaderTechniqueOptions[]|ShaderTechnique|ShaderTechnique[],
    blendState?: any
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

  export class ShaderMaterial {
    name:string
    device:Device
    gl:any
    parameters:Object
    techniques:ShaderTechnique[]
    technique:ShaderTechnique

    constructor(device:Device, options:ShaderMaterialOptions) {
      this.device = device
      this.gl = device.context
      this.name = options.name
      this.parameters = options.parameters || {}
      this.techniques = makeArray(options.techniques)

      for (let tech of this.techniques) {
        for (let i in tech.passes) {
          let pass = tech.passes[i]
          if (pass instanceof ShaderPass) continue
          tech.passes[i] = new ShaderPass(device, {
            material: this,
            program: pass
          })
        }
      }

      if (options.program) {
        let pass = new ShaderPass(device, {
          material: this,
          program: options.program
        })
        this.techniques.push({
          name: 'technique' + this.techniques.length,
          passes: [pass]
        })
      }

      this.technique = this.findTechnique(options.technique || 0)
    }

    useTechnique(nameOrIndex:number|string):ShaderMaterial {
      this.technique = this.findTechnique(nameOrIndex)
      return this
    }
    
    findTechnique(nameOrIndex:string|number):ShaderTechnique {
      if (typeof nameOrIndex === 'number') {
        return this.techniques[nameOrIndex]
      } else if (typeof nameOrIndex === 'string') {
        for (var tech of this.techniques) {
          if (tech.name == nameOrIndex) {
            return tech
          }
        }
      }
      throw `Technique '${nameOrIndex}' does not exist on this material`
    }
    
    findPass(techniqueIdentifier:string|number, nameOrIndex:string|number=0):ShaderPass {
      var tech = this.findTechnique(techniqueIdentifier)
      var result: ShaderPass
      if (typeof nameOrIndex === 'number') {
        result = tech.passes[nameOrIndex]
      } else if (typeof nameOrIndex === 'string') {
        for (var pass of tech.passes) {
          if (pass.name == nameOrIndex) {
            result = pass
          }
        }
      }
      if (!result) {
        throw `Pass '${nameOrIndex}' on Technique '${techniqueIdentifier}' does not exist`
      }
      return result
    }
    
    findProgram(techniqueIdentifier:string|number=0, nameOrIndex:string|number=0):ShaderProgram {
      return this.findPass(techniqueIdentifier, nameOrIndex).program
    }

    drawMesh(mesh:ModelMesh) {
      for (let pass of this.technique.passes) {
        pass.commit()
        mesh.draw(pass.program)
      }
    }
  }
}
