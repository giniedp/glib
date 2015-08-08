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
    parameters?: any,
    techniques?: MaterialTechniqueOptions[]|MaterialTechnique|MaterialTechnique[]
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
    device:Device;
    gl:any;
    parameters:Object;
    techniques:MaterialTechnique[];
    technique:MaterialTechnique;

    constructor(device:Device, params:MaterialOptions) {
      this.device = device;
      this.gl = device.context;
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

      this.useTechnique(0);
    }

    useTechnique(indexOrName:number|string):Material {
      if (typeof indexOrName === "string") {
        this.useTechniqueByName(indexOrName);
      } else {
        this.useTechniqueByIndex(indexOrName);
      }
      return this;
    }

    useTechniqueByName(name:string):Material {
      for (var tech of this.techniques) {
        if (tech.name == name) {
          this.technique = tech;
          return this;
        }
      }
      return this;
    }

    useTechniqueByIndex(index:number):Material {
      this.technique = this.techniques[index];
      return this;
    }
  }
}
