import { Device, ShaderProgram, ShaderUniform } from '@gglib/graphics'
import { IVec2, IVec3, IVec4, Mat4, Vec2, Vec3, Vec4 } from '@gglib/math'
import { LightData } from './Types'

export interface Binding<T> {
  // The uniform binding name
  name: string
  // The uniform type
  type: string
  // The value
  value: T
}

export interface LightBinding {
  Position: Binding<IVec4>
  Direction: Binding<IVec4>
  Color: Binding<IVec4>
  Misc: Binding<IVec4>
}

export class Binder {
  public Position: Binding<IVec3> = { name: 'Position', type: 'vec3', value: Vec3.createZero() }
  public Direction: Binding<IVec3> = { name: 'Direction', type: 'vec3', value: Vec3.createZero() }
  public World: Binding<Mat4> = { name: 'World', type: 'mat4', value: Mat4.createIdentity() }

  private transformBindings = [
    this.Position,
    this.Direction,
    this.World,
  ]

  public View: Binding<Mat4> = {
    name: 'View', type: 'mat4', value: Mat4.createIdentity(),
  }
  public Projection: Binding<Mat4> = {
    name: 'Projection', type: 'mat4', value: Mat4.createIdentity(),
  }
  public ViewProjection: Binding<Mat4> = {
    name: 'ViewProjection', type: 'mat4', value: Mat4.createIdentity(),
  }
  public CameraPosition: Binding<IVec3> = {
    name: 'CameraPosition', type: 'vec3', value: Vec3.createZero(),
  }
  public CameraDirection: Binding<IVec3> = {
    name: 'CameraDirection', type: 'vec3', value: Vec3.createZero(),
  }

  public TargetSize: Binding<IVec2> = {
    name: 'TargetSize', type: 'vec2', value: Vec2.createZero(),
  }
  public TargetPixelSize: Binding<IVec2> = {
    name: 'TargetPixelSize', type: 'vec2', value: Vec2.createZero(),
  }

  public ViewportSize: Binding<IVec2> = {
    name: 'ViewportSize', type: 'vec2', value: Vec2.createZero(),
  }
  public ViewportPixelSize: Binding<IVec2> = {
    name: 'ViewportPixelSize', type: 'vec2', value: Vec2.createZero(),
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
    this.ViewportPixelSize,
  ]

  public TimeNow: Binding<number> = {
    name: 'TimeNow', type: 'float', value: 0,
  }
  public TimeLast: Binding<number> = {
    name: 'TimeLast', type: 'float', value: 0,
  }
  private timeBindings = [
    this.TimeNow,
    this.TimeLast,
  ]

  public Lights = [
    this.buildLightBinding(0),
    this.buildLightBinding(1),
    this.buildLightBinding(2),
    this.buildLightBinding(3),
    this.buildLightBinding(4),
    this.buildLightBinding(5),
    this.buildLightBinding(6),
    this.buildLightBinding(7),
  ]
  private lightBindings = this.Lights.map((it) => {
    return [it.Position, it.Direction, it.Color, it.Misc]
  })

  public renderables: any[] = []

  public cameraFrustumVS: any = null
  public cameraFrustumWS: any = null

  public viewportBuffer0: any = null
  public viewportBuffer1: any = null
  public viewportBuffer2: any = null
  public viewportBuffer3: any = null

  constructor(public device: Device) {
  }

  private buildLightBinding(i: number): LightBinding {
    return {
      Position: { name: `Lights${i}Position`, type: 'vec4', value: Vec4.createZero() },
      Direction: { name: `Lights${i}Direction`, type: 'vec4', value: Vec4.createZero() },
      Color: { name: `Lights${i}Color`, type: 'vec4', value: Vec4.createZero() },
      Misc: { name: `Lights${i}Misc`, type: 'vec4', value: Vec4.createZero() },
    }
  }

  public updateCamera(world: Mat4, view: Mat4, proj: Mat4): Binder {
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
    return this
  }

  public updateView(view: {width: number, height: number}): Binder {
    this.ViewportSize.value.x = view.width
    this.ViewportSize.value.y = view.height
    this.ViewportPixelSize.value.x = 1.0 / view.width
    this.ViewportPixelSize.value.y = 1.0 / view.height
    return this
  }

  public updateTarget(target: {width: number, height: number}): Binder {
    this.TargetSize.value.x = target.width
    this.TargetSize.value.y = target.height
    this.TargetPixelSize.value.x = 1.0 / target.width
    this.TargetPixelSize.value.y = 1.0 / target.height
    return this
  }

  public updateTransform(world: Mat4): Binder {
    if (world) {
      world.getTranslation(this.Position.value)
      world.getForward(this.Direction.value)
      this.World.value.initFrom(world)
    }
    return this
  }

  public updateTime(total: number, elapsed: number = 0): Binder {
    this.TimeNow.value = total
    this.TimeLast.value = total - elapsed
    return this
  }

  public updateLights(lights: LightData[]) {
    for (let i = 0; i < lights.length; i++) {
      this.updateLight(lights[i], i)
    }
  }

  public updateLight(light: LightData, index: number) {
    let l = this.Lights[index]
    if (!l) {
      return
    }
    l.Color.value = light.color
    l.Position.value = light.position
    l.Direction.value = light.direction
    l.Misc.value = light.misc
  }

  public bindTransform(program: ShaderProgram): Binder {
    program.use()
    this.bindUniforms(program, this.transformBindings)
    return this
  }

  public bindView(program: ShaderProgram): Binder {
    program.use()
    this.bindUniforms(program, this.viewBindings)
    return this
  }

  public bindTime(program: ShaderProgram): Binder {
    program.use()
    this.bindUniforms(program, this.timeBindings)
    return this
  }

  public bindLights(program: ShaderProgram): Binder {
    program.use()
    for (let lightBinding of this.lightBindings) {
      this.bindUniforms(program, lightBinding)
    }
    return this
  }

  public bindUniforms(program: ShaderProgram, bindings: Array<Binding<any>>) {
    let binding: Binding<any>
    let uniform: ShaderUniform
    for (binding of bindings) {
      uniform = program.uniforms[binding.name]
      if (!uniform || binding.type !== uniform.type) {
        continue
      }
      uniform.set(binding.value)
    }
  }
}
