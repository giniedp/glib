module Glib.Render {

  export interface Binding<T> {
    // The uniform binding name
    name:string
    // The uniform type
    type:string
    // The value
    value: T
  }

  export class Binder {
    Position:Binding<IVec3> = { name: 'Position', type: 'vec3', value: Vec3.zero() }
    Direction:Binding<IVec3> = { name: 'Direction', type: 'vec3', value: Vec3.zero() }
    World:Binding<Mat4> = { name: 'World', type: 'mat4', value: Mat4.identity() }

    private transformBindings = [ 
      this.Position, 
      this.Direction, 
      this.World
    ];

    View:Binding<Mat4> = { 
      name: 'View', type: 'mat4', value: Mat4.identity() 
    }
    Projection:Binding<Mat4> = {
      name: 'Projection', type: 'mat4', value: Mat4.identity() 
    }
    ViewProjection:Binding<Mat4> = {
      name: 'ViewProjection', type: 'mat4', value: Mat4.identity() 
    }
    CameraPosition:Binding<IVec3> = { 
      name: 'CameraPosition', type: 'vec3', value: Vec3.zero() 
    }
    CameraDirection:Binding<IVec3> = { 
      name: 'CameraDirection', type: 'vec3', value: Vec3.zero() 
    }

    TargetSize:Binding<IVec2> = { 
      name: 'TargetSize', type: 'vec2', value: Vec2.zero() 
    }
    TargetPixelSize:Binding<IVec2> = { 
      name: 'TargetPixelSize', type: 'vec2', value: Vec2.zero() 
    }
    
    ViewportSize:Binding<IVec2> = { 
      name: 'ViewportSize', type: 'vec2', value: Vec2.zero() 
    }
    ViewportPixelSize:Binding<IVec2> = { 
      name: 'ViewportPixelSize', type: 'vec2', value: Vec2.zero() 
    }

    private viewBindings = [
      this.View,
      this.Projection,
      this.ViewProjection,
      this.CameraPosition,
      this.CameraDirection,
      this.TargetSize,
      this.TargetPixelSize,
      this.ViewportSize,
      this.ViewportPixelSize
    ];

    TimeNow:Binding<number> = { 
      name: 'TimeNow', type: 'float', value: 0 
    }
    TimeLast:Binding<number> = { 
      name: 'TimeLast', type: 'float', value: 0 
    }
    private timeBindings = [
      this.TimeNow,
      this.TimeLast
    ]
 
    Lights = [
      this.buildLightBinding(0),
      this.buildLightBinding(1),
      this.buildLightBinding(2),
      this.buildLightBinding(3),
      this.buildLightBinding(4),
      this.buildLightBinding(5),
      this.buildLightBinding(6),
      this.buildLightBinding(7)
    ]
    private lightBindings = this.Lights.map(function(it) {
      return [it.Position, it.Direction, it.Color, it.Misc]
    })

    renderables = [];

    cameraFrustumVS = null;
    cameraFrustumWS = null;

    viewportBuffer0 = null;
    viewportBuffer1 = null;
    viewportBuffer2 = null;
    viewportBuffer3 = null;

    constructor(public device:Graphics.Device) {
    }

    buildLightBinding(i) {
      return {
        Position: { name: `Lights${i}Position`, type: 'vec4', value: Vec4.zero() } as Binding<IVec4>,
        Direction: { name: `Lights${i}Direction`, type: 'vec4', value: Vec4.zero() } as Binding<IVec4>,
        Color: { name: `Lights${i}Color`, type: 'vec4', value: Vec4.zero() } as Binding<IVec4>,
        Misc: { name: `Lights${i}Misc`, type: 'vec4', value: Vec4.zero() } as Binding<IVec4>
      }
    }
    updateCamera(world: Mat4, view: Mat4, proj: Mat4):Binder{
      if (world) {
        world.getTranslation(this.CameraPosition.value)
        world.getForward(this.CameraDirection.value)
      }
      if (view) {
        this.View.value.initFrom(view)
      }
      if (proj) {
        this.Projection.value.initFrom(proj)
      }
      if (view && proj) {
        Mat4.multiply(this.View.value, this.Projection.value, this.ViewProjection.value)
      }
      return this;
    }

    updateView(view: {width: number, height: number}):Binder {
      this.ViewportSize.value.x = view.width
      this.ViewportSize.value.y = view.height
      this.ViewportPixelSize.value.x = 1.0 / view.width
      this.ViewportPixelSize.value.y = 1.0 / view.height
      return this
    }

    updateTarget(target: {width: number, height: number}):Binder {
      this.TargetSize.value.x = target.width
      this.TargetSize.value.y = target.height
      this.TargetPixelSize.value.x = 1.0 / target.width
      this.TargetPixelSize.value.y = 1.0 / target.height
      return this
    }

    updateTransform(world: Mat4):Binder {
      if (world) {
        world.getTranslation(this.Position.value)
        world.getForward(this.Direction.value)
        this.World.value.initFrom(world)
      }
      return this;
    }

    updateTime(total: number, elapsed: number=0):Binder{
      this.TimeNow.value = total
      this.TimeLast.value = total - elapsed
      return this;
    }

    updateLights(lights: LightData[]) {
      for (let i = 0; i < lights.length; i++) {
        this.updateLight(lights[i], i)
      }
    }

    updateLight(light: LightData, index: number) {
      let l = this.Lights[index]
      if (!l) return
      l.Color.value = light.color  
      l.Position.value = light.position
      l.Direction.value = light.direction
      l.Misc.value = light.misc
    }

    bindTransform(program:Graphics.ShaderProgram):Binder{
      program.use()
      this.bindUniforms(program, this.transformBindings)
      return this
    }

    bindView(program:Graphics.ShaderProgram):Binder{
      program.use()
      this.bindUniforms(program, this.viewBindings)
      return this
    }

    bindTime(program:Graphics.ShaderProgram):Binder{
      program.use()
      this.bindUniforms(program, this.timeBindings)
      return this
    }

    bindLights(program:Graphics.ShaderProgram):Binder{
      program.use();
      for (let lightBinding of this.lightBindings) {
        this.bindUniforms(program, lightBinding)
      }
      return this
    }

    bindUniforms(program:Graphics.ShaderProgram, bindings:Binding<any>[]){
      let binding:Binding<any>, uniform:Graphics.ShaderUniform
      for (binding of bindings) {
        uniform = program.uniforms[binding.name]
        if (!uniform || binding.type !== uniform.type) continue
        uniform.set(binding.value)
      }
    }
  }
}
