module Glib.Graphics {

  export interface MaterialTechniqueOptions {
    name: string,
    passes: MaterialPassOptions[]
  }
  export interface MaterialTechnique {
    name: string,
    passes: MaterialPass[]
  }
  export interface MaterialOptions {
    name?:string,
    effect?:any,
    technique?: string|number,
    parameters?: any,
    techniques?: MaterialTechniqueOptions[]|MaterialTechnique|MaterialTechnique[],
    blendState?: any
  }

  function makeArray(arg:any):any {
    if (Array.isArray(arg)) {
      return arg;
    } else if (arg) {
      return [arg];
    } else {
      return [];
    }
  }

  export class Material {
    name:string;
    device:Device;
    gl:any;
    parameters:Object;
    techniques:MaterialTechnique[];
    technique:MaterialTechnique;

    constructor(device:Device, params:MaterialOptions) {
      this.device = device;
      this.gl = device.context;
      this.name = params.name;
      this.parameters = params.parameters || {};
      this.techniques = makeArray(params.techniques);

      this.techniques.forEach(function (tech) {
        tech.passes.forEach(function (pass, pIndex) {

          if (pass instanceof MaterialPass) {
            return;
          }
          tech.passes[pIndex] = new MaterialPass(device, {
            material: this,
            program: pass
          });
        }, this);
      }, this);
      
      this.technique = this.findTechnique(params.technique || 0);
    }

    useTechnique(nameOrIndex:number|string):Material {
      this.technique = this.findTechnique(nameOrIndex);
      return this;
    }
    
    findTechnique(nameOrIndex:string|number):MaterialTechnique {
      if (typeof nameOrIndex === 'number') {
        return this.techniques[nameOrIndex];
      } else if (typeof nameOrIndex === 'string') {
        for (var tech of this.techniques) {
          if (tech.name == nameOrIndex) {
            return tech;
          }
        }
      }
      throw `Technique '${nameOrIndex}' does not exist on this material`;
    }
    
    findPass(techniqueIdentifier:string|number, nameOrIndex:string|number=0):MaterialPass {
      var tech = this.findTechnique(techniqueIdentifier);
      var result: MaterialPass;
      if (typeof nameOrIndex === 'number') {
        result = tech.passes[nameOrIndex];
      } else if (typeof nameOrIndex === 'string') {
        for (var pass of tech.passes) {
          if (pass.name == nameOrIndex) {
            result = pass;
          }
        }
      }
      if (!result) {
        throw `Pass '${nameOrIndex}' on Technique '${techniqueIdentifier}' does not exist`;
      }
      return result;
    }
    
    findProgram(techniqueIdentifier:string|number, nameOrIndex:string|number=0):ShaderProgram {
      return this.findPass(techniqueIdentifier, nameOrIndex).program;
    }
  }
}
