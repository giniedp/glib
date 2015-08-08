module Glib.Graphics {

  import Mat4 = Vlib.Mat4;
  import Vec3 = Vlib.Vec3;
  import Vec2 = Vlib.Vec2;
  import extend = Glib.utils.extend;

  function lightUniforms(i) {
    return [
      { key: 'lights[' + i + '].position', type: 'vec3', vkey: 'position' },
      { key: 'lights[' + i + '].direction', type: 'vec3', vkey: 'direction' },
      { key: 'lights[' + i + '].color', type: 'vec4', vkey: 'color' },
      { key: 'lights[' + i + '].misc', type: 'vec4', vkey: 'misc' },
      { key: 'lights[' + i + '].type', type: 'int', vkey: 'type' }
    ];
  }

  function applyUniforms(program:ShaderProgram, srcUniforms:any, values:any){
    var i, src, dst;
    for(i = 0; i < srcUniforms.length; i += 1){
      src = srcUniforms[i];
      dst = program.uniforms[src.key];
      if (dst && (dst.type === src.type)){
        dst.set(values[src.vkey || src.key]);
      }
    }
  }

  export class RenderContext {
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

    maxLights: number = 3;
    lightUniforms = [];

    lights = [];
    renderables = [];

    // TODO:
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

    setCamera(world:Mat4, view:Mat4, proj:Mat4){
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

    setTransform(world:Mat4) {
      if (world) {
        world.getTranslation(this.position);
        world.getForward(this.direction);
        this.world.initFrom(world);
      }
      return this;
    }

    setTime(total:number, elapsed:number=0){
      this.timeNow = total;
      this.timeLast = total - elapsed;
    }

    applyTransform(program){
      program.use();
      applyUniforms(program, this.transformUniforms, this);
    }

    applyView(program){
      program.use();
      applyUniforms(program, this.viewUniforms, this);
    }

    applyTime(program){
      program.use();
      applyUniforms(program, this.timeUniforms, this);
    }

    applyLights(program){
      program.use();
      var i, lights = this.lights;
      for(i = 0; i < lights.length; i += 1){
        applyUniforms(program, this.lightUniforms[i], this.lights[i]);
      }
    }
  }
}
