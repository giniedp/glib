module Glib.Rendering {

  import Mat4 = Vlib.Mat4;
  import Vec3 = Vlib.Vec3;
  import Vec2 = Vlib.Vec2;
  import extend = Glib.utils.extend;
  import Graphics = Glib.Graphics;

  function lightUniforms(i) {
    return [
      { key: 'lights[' + i + '].position', type: 'vec3', vkey: 'position' },
      { key: 'lights[' + i + '].direction', type: 'vec3', vkey: 'direction' },
      { key: 'lights[' + i + '].color', type: 'vec4', vkey: 'color' },
      { key: 'lights[' + i + '].misc', type: 'vec4', vkey: 'misc' },
      { key: 'lights[' + i + '].type', type: 'int', vkey: 'type' }
    ];
  }

  function commitUniforms(program:Graphics.ShaderProgram, srcUniforms:any, values:any){
    var i, src, dst;
    for(i = 0; i < srcUniforms.length; i += 1){
      src = srcUniforms[i];
      dst = program.uniforms[src.key];
      if (dst && (dst.type === src.type)){
        dst.set(values[src.vkey || src.key]);
      }
    }
  }

  export class Context {
    position:Vec3 = Vec3.zero();
    direction:Vec3 = Vec3.zero();
    world:Mat4 = Mat4.identity();
    transformUniforms = [
      { key: 'position', type: 'vec3' },
      { key: 'direction', type: 'vec3' },
      { key: 'world', type: 'mat4' }
    ];

    view:Mat4 = Mat4.identity();
    projection:Mat4 = Mat4.identity();
    cameraPosition:Vec3 = Vec3.zero();
    cameraDirection:Vec3 = Vec3.zero();
    viewUniforms = [
      { key: 'view', type: 'mat4' },
      { key: 'projection', type: 'mat4' },
      { key: 'cameraPosition', type: 'vec3' },
      { key: 'cameraDirection', type: 'vec3' }
    ];

    timeNow:number = 0;
    timeLast:number = 0;
    timeUniforms = [
      { key: 'timeNow', type: 'float' },
      { key: 'timeLast', type: 'float' }
    ];

    maxLights: number = 4;
    lightUniforms = [];

    lights = [];
    renderables = [];

    cameraFrustumVS = null;
    cameraFrustumWS = null;

    viewportPixelSize = null;
    viewportBuffer0 = null;
    viewportBuffer1 = null;
    viewportBuffer2 = null;
    viewportBuffer3 = null;

    constructor(opts:any={}) {
      extend(this, opts);

      this.lightUniforms = [];
      for (var i = 0; i < this.maxLights; i += 1){
        this.lightUniforms.push(lightUniforms(i));
      }
    }

    setCamera(world:Mat4, view:Mat4, proj:Mat4):Context{
      if (world) {
        world.getTranslation(this.cameraPosition);
        world.getForward(this.cameraDirection);
      }
      if (view) {
        this.view.initFrom(view);
      }
      if (proj) {
        this.projection.initFrom(proj);
      }
      return this;
    }

    setTransform(world:Mat4):Context {
      if (world) {
        world.getTranslation(this.position);
        world.getForward(this.direction);
        this.world.initFrom(world);
      }
      return this;
    }

    setTime(total:number, elapsed:number=0):Context{
      this.timeNow = total;
      this.timeLast = total - elapsed;
      return this;
    }

    commitTransform(program):Context{
      program.use();
      commitUniforms(program, this.transformUniforms, this);
      return this;
    }

    commitView(program):Context{
      program.use();
      commitUniforms(program, this.viewUniforms, this);
      return this;
    }

    commitTime(program):Context{
      program.use();
      commitUniforms(program, this.timeUniforms, this);
      return this;
    }

    commitLights(program):Context{
      program.use();
      var i, lights = this.lights;
      for(i = 0; i < lights.length; i += 1){
        commitUniforms(program, this.lightUniforms[i], this.lights[i]);
      }
      return this;
    }
  }
}
