module Glib.Render {

  import Mat4 = Vlib.Mat4;
  import Vec3 = Vlib.Vec3;
  import Vec2 = Vlib.Vec2;
  import extend = Glib.utils.extend;
  import Graphics = Glib.Graphics;
  import RenderTarget = Graphics.RenderTarget;

  function lightUniforms(i) {
    return [
      { key: 'Lights[' + i + '].Position', type: 'vec4', vkey: 'position' },
      { key: 'Lights[' + i + '].Direction', type: 'vec4', vkey: 'direction' },
      { key: 'Lights[' + i + '].Color', type: 'vec4', vkey: 'color' },
      { key: 'Lights[' + i + '].Misc', type: 'vec4', vkey: 'misc' }
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
    Position:Vec3 = Vec3.zero();
    Direction:Vec3 = Vec3.zero();
    World:Mat4 = Mat4.identity();
    transformUniforms = [
      { key: 'Position', type: 'vec3' },
      { key: 'Direction', type: 'vec3' },
      { key: 'World', type: 'mat4' }
    ];

    View:Mat4 = Mat4.identity();
    Projection:Mat4 = Mat4.identity();
    CameraPosition:Vec3 = Vec3.zero();
    CameraDirection:Vec3 = Vec3.zero();
    viewUniforms = [
      { key: 'View', type: 'mat4' },
      { key: 'Projection', type: 'mat4' },
      { key: 'CameraPosition', type: 'vec3' },
      { key: 'CameraDirection', type: 'vec3' },
      { key: 'ViewportSize', type: 'vec2' },
      { key: 'ViewportPixelSize', type: 'vec2' },
      { key: 'TargetSize', type: 'vec2' },
      { key: 'TargetPixelSize', type: 'vec2' }
    ];

    timeNow:number = 0;
    timeLast:number = 0;
    timeUniforms = [
      { key: 'TimeNow', type: 'float' },
      { key: 'TimeLast', type: 'float' }
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
        world.getTranslation(this.CameraPosition);
        world.getForward(this.CameraDirection);
      }
      if (view) {
        this.View.initFrom(view);
      }
      if (proj) {
        this.Projection.initFrom(proj);
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
        world.getTranslation(this.Position);
        world.getForward(this.Direction);
        this.World.initFrom(world);
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
