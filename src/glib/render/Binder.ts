module Glib.Render {

  import Mat4 = Vlib.Mat4;
  import Vec3 = Vlib.Vec3;
  import Vec2 = Vlib.Vec2;
  import extend = Glib.utils.extend;
  import Graphics = Glib.Graphics;
  import RenderTarget = Graphics.RenderTarget;

  function lightUniforms(i) {
    return [
      { key: 'lights[' + i + '].position', type: 'vec3', vkey: 'position' },
      { key: 'lights[' + i + '].direction', type: 'vec3', vkey: 'direction' },
      { key: 'lights[' + i + '].color', type: 'vec4', vkey: 'color' },
      { key: 'lights[' + i + '].misc', type: 'vec4', vkey: 'misc' },
      { key: 'lights[' + i + '].type', type: 'int', vkey: 'type' }
    ];
  }

  function bindUniforms(program:Graphics.ShaderProgram, srcUniforms:any, values:any){
    var i, src, dst;
    for(i = 0; i < srcUniforms.length; i += 1){
      src = srcUniforms[i];
      dst = program.uniforms[src.key];
      if (dst && (dst.type === src.type)){
        dst.set(values[src.vkey || src.key]);
      }
    }
  }

  export class Binder {
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
      { key: 'cameraDirection', type: 'vec3' },
      { key: 'viewportSize', type: 'vec2' },
      { key: 'viewportPixelSize', type: 'vec2' },
      { key: 'targetSize', type: 'vec2' },
      { key: 'targetPixelSize', type: 'vec2' }
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

    targetSize = [0, 0];
    targetPixelSize = [0, 0];
    
    viewportSize = [0, 0];
    viewportPixelSize = [0, 0];

    viewportBuffer0 = null;
    viewportBuffer1 = null;
    viewportBuffer2 = null;
    viewportBuffer3 = null;

    constructor(public device:Graphics.Device, opts:any={}) {
      extend(this, opts);

      this.lightUniforms = [];
      for (var i = 0; i < this.maxLights; i += 1){
        this.lightUniforms.push(lightUniforms(i));
      }
    }

    setCamera(world:Mat4, view:Mat4, proj:Mat4):Binder{
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

    setView(view: {width:number, height:number}) {
      this.viewportSize[0] = view.width;
      this.viewportSize[1] = view.height;
      this.viewportPixelSize[0] = 1.0 / view.width;
      this.viewportPixelSize[1] = 1.0 / view.height;
    }

    setTarget(target: {width:number, height:number}) {
      this.viewportSize[0] = target.width;
      this.viewportSize[1] = target.height;
      this.viewportPixelSize[0] = 1.0 / target.width;
      this.viewportPixelSize[1] = 1.0 / target.height;
    }

    setTransform(world:Mat4):Binder {
      if (world) {
        world.getTranslation(this.position);
        world.getForward(this.direction);
        this.world.initFrom(world);
      }
      return this;
    }

    setTime(total:number, elapsed:number=0):Binder{
      this.timeNow = total;
      this.timeLast = total - elapsed;
      return this;
    }

    bindTransform(program):Binder{
      program.use();
      bindUniforms(program, this.transformUniforms, this);
      return this;
    }

    bindView(program):Binder{
      program.use();
      bindUniforms(program, this.viewUniforms, this);
      return this;
    }

    bindTime(program):Binder{
      program.use();
      bindUniforms(program, this.timeUniforms, this);
      return this;
    }

    bindLights(program):Binder{
      program.use();
      var i, lights = this.lights;
      for(i = 0; i < lights.length; i += 1){
        bindUniforms(program, this.lightUniforms[i], this.lights[i]);
      }
      return this;
    }

  }
}
