import { Device, ShaderProgram, ShaderUniform, ShaderUniformBinding } from '@gglib/graphics'
import { IVec2, IVec3, IVec4, Mat4, Vec2, Vec3, Vec4 } from '@gglib/math'
import { LightData } from './Types'

/**
 * @public
 */
export interface LightBinding {
  Color: ShaderUniformBinding<IVec4 | ArrayLike<number>>
  Position: ShaderUniformBinding<IVec4 | ArrayLike<number>>
  Direction: ShaderUniformBinding<IVec4 | ArrayLike<number>>
}

/**
 * @public
 */
export class Binder {
  public readonly Position: ShaderUniformBinding<IVec3> = {
    name: 'Position', type: 'vec3', value: Vec3.createZero(),
  }
  public readonly Direction: ShaderUniformBinding<IVec3> = {
    name: 'Direction', type: 'vec3', value: Vec3.createZero(),
  }
  public readonly World: ShaderUniformBinding<Mat4> = {
    name: 'World', type: 'mat4', value: Mat4.createIdentity(),
  }

  private transformBindings = [
    this.Position,
    this.Direction,
    this.World,
  ]

  public readonly View: ShaderUniformBinding<Mat4> = {
    name: 'View', type: 'mat4', value: Mat4.createIdentity(),
  }
  public readonly Projection: ShaderUniformBinding<Mat4> = {
    name: 'Projection', type: 'mat4', value: Mat4.createIdentity(),
  }
  public readonly ViewProjection: ShaderUniformBinding<Mat4> = {
    name: 'ViewProjection', type: 'mat4', value: Mat4.createIdentity(),
  }
  public readonly CameraPosition: ShaderUniformBinding<IVec3> = {
    name: 'CameraPosition', type: 'vec3', value: Vec3.createZero(),
  }
  public readonly CameraDirection: ShaderUniformBinding<IVec3> = {
    name: 'CameraDirection', type: 'vec3', value: Vec3.createZero(),
  }

  public readonly TargetSize: ShaderUniformBinding<IVec2> = {
    name: 'TargetSize', type: 'vec2', value: Vec2.createZero(),
  }
  public readonly TargetPixelSize: ShaderUniformBinding<IVec2> = {
    name: 'TargetPixelSize', type: 'vec2', value: Vec2.createZero(),
  }

  public readonly ViewportSize: ShaderUniformBinding<IVec2> = {
    name: 'ViewportSize', type: 'vec2', value: Vec2.createZero(),
  }
  public readonly ViewportPixelSize: ShaderUniformBinding<IVec2> = {
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

  public readonly TimeNow: ShaderUniformBinding<number> = {
    name: 'TimeNow', type: 'float', value: 0,
  }
  public readonly TimeLast: ShaderUniformBinding<number> = {
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
    return [it.Color, it.Position, it.Direction]
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
      Color: { name: `Lights${i}Color`, type: 'vec4', value: Vec4.createZero() },
      Position: { name: `Lights${i}Position`, type: 'vec4', value: Vec4.createZero() },
      Direction: { name: `Lights${i}Direction`, type: 'vec4', value: Vec4.createZero() },
    }
  }

  public setCamera(world: Mat4, view: Mat4, proj: Mat4): Binder {
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

  public setViewportSize(view: {width: number, height: number}): Binder {
    this.ViewportSize.value.x = view.width
    this.ViewportSize.value.y = view.height
    this.ViewportPixelSize.value.x = 1.0 / view.width
    this.ViewportPixelSize.value.y = 1.0 / view.height
    return this
  }

  public setTargetSize(target: {width: number, height: number}): Binder {
    this.TargetSize.value.x = target.width
    this.TargetSize.value.y = target.height
    this.TargetPixelSize.value.x = 1.0 / target.width
    this.TargetPixelSize.value.y = 1.0 / target.height
    return this
  }

  public setTransform(world: Mat4): Binder {
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
  }

  public applyTransform(program: ShaderProgram): this {
    program.use()
    program.applyBindings(this.transformBindings)
    return this
  }

  public applyView(program: ShaderProgram): this {
    program.use()
    program.applyBindings(this.viewBindings)
    return this
  }

  public applyTime(program: ShaderProgram): this {
    program.use()
    program.applyBindings(this.timeBindings)
    return this
  }

  public applyLights(program: ShaderProgram): this {
    program.use()
    for (let lightBinding of this.lightBindings) {
      program.applyBindings(lightBinding)
    }
    return this
  }
}
