module Glib.Graphics {

  export interface MaterialPassOptions {
    material?: Material,
    name?:string,
    program?: ShaderProgram|ShaderProgramOptions,
    cullState?: string|CullStateOptions,
    blendState?: string|BlendStateOptions,
    depthState?: string|DepthStateOptions,
    offsetState?: string|OffsetStateOptions,
    stencilState?: string|StencilStateOptions
  }

  export class MaterialPass {
    device:Device;
    gl:any;
    name:string;
    program:ShaderProgram;
    material:Material;
    cullState:CullStateOptions;
    blendState:BlendStateOptions;
    depthState:DepthStateOptions;
    offsetState:OffsetStateOptions;
    stencilState:StencilStateOptions;

    constructor(device:Device, data:MaterialPassOptions) {
      this.device = device;
      this.gl = device.context;
      this.name = data.name;
      this.material = data.material;
      this.cullState = CullState.convert(data.cullState);
      this.blendState = BlendState.convert(data.blendState);
      this.depthState = DepthState.convert(data.depthState);
      this.offsetState = OffsetState.convert(data.offsetState);
      this.stencilState = StencilState.convert(data.stencilState);

      var program = data.program;
      if (program instanceof ShaderProgram) {
        this.program = program;
      } else {
        this.program = new ShaderProgram(device, program);
      }
    }

    commit():MaterialPass {
      this.program.use();
      var device = this.device;
      if (this.stencilState) {
        device.stencilState = this.stencilState;
      }
      if (this.offsetState) {
        device.offsetState = this.offsetState;
      }
      if (this.blendState) {
        device.blendState = this.blendState;
      }
      if (this.depthState) {
        device.depthState = this.depthState;
      }
      if (this.cullState) {
        device.cullState = this.cullState;
      }
      this.program.commit(this.material.parameters);
      return this;
    }
  }
}