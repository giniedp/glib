import { Device, ShaderProgram, ShaderUniformBinding } from '@gglib/graphics'
import { IVec2, IVec3, IVec4, Mat4, Vec2, Vec3, Vec4 } from '@gglib/math'
import { LightSourceData } from './Types'

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
export class UniformBinder {

  /**
   * A vector that is applied to a uniform with `"Position"` binding name
   */
  public readonly Position: ShaderUniformBinding<IVec3> = {
    name: 'Position', type: 'vec3', value: Vec3.createZero(),
  }

  /**
   * A vector that is applied to a uniform with `"Direction"` binding name
   */
  public readonly Direction: ShaderUniformBinding<IVec3> = {
    name: 'Direction', type: 'vec3', value: Vec3.createZero(),
  }

  /**
   * A matrix that is applied to a uniform with `"World"` binding name
   */
  public readonly World: ShaderUniformBinding<Mat4> = {
    name: 'World', type: 'mat4', value: Mat4.createIdentity(),
  }

  private transformBindings = [
    this.Position,
    this.Direction,
    this.World,
  ]

  /**
   * A matrix that is applied to a uniform with `"View"` binding name
   */
  public readonly View: ShaderUniformBinding<Mat4> = {
    name: 'View', type: 'mat4', value: Mat4.createIdentity(),
  }

  /**
   * A matrix that is applied to a uniform with `"Projection"` binding name
   */
  public readonly Projection: ShaderUniformBinding<Mat4> = {
    name: 'Projection', type: 'mat4', value: Mat4.createIdentity(),
  }

  /**
   * A matrix that is applied to a uniform with `"ViewProjection"` binding name
   */
  public readonly ViewProjection: ShaderUniformBinding<Mat4> = {
    name: 'ViewProjection', type: 'mat4', value: Mat4.createIdentity(),
  }

  /**
   * A vector that is applied to a uniform with `"CameraPosition"` binding name
   */
  public readonly CameraPosition: ShaderUniformBinding<IVec3> = {
    name: 'CameraPosition', type: 'vec3', value: Vec3.createZero(),
  }

  /**
   * A vector that is applied to a uniform with `"CameraDirection"` binding name
   */
  public readonly CameraDirection: ShaderUniformBinding<IVec3> = {
    name: 'CameraDirection', type: 'vec3', value: Vec3.createZero(),
  }

  /**
   * A vector that is applied to a uniform with `"TargetSize"` binding name
   */
  public readonly TargetSize: ShaderUniformBinding<IVec2> = {
    name: 'TargetSize', type: 'vec2', value: Vec2.createZero(),
  }

  /**
   * A vector that is applied to a uniform with `"TargetPixelSize"` binding name
   */
  public readonly TargetPixelSize: ShaderUniformBinding<IVec2> = {
    name: 'TargetPixelSize', type: 'vec2', value: Vec2.createZero(),
  }

  /**
   * A vector that is applied to a uniform with `"ViewportSize"` binding name
   */
  public readonly ViewportSize: ShaderUniformBinding<IVec2> = {
    name: 'ViewportSize', type: 'vec2', value: Vec2.createZero(),
  }

  /**
   * A vector that is applied to a uniform with `"ViewportPixelSize"` binding name
   */
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

  /**
   * A number value that is applied to a uniform with `"TimeNow"` binding name
   */
  public readonly TimeNow: ShaderUniformBinding<number> = {
    name: 'TimeNow', type: 'float', value: 0,
  }

  /**
   * A number value that is applied to a uniform with `"TimeLast"` binding name
   */
  public readonly TimeLast: ShaderUniformBinding<number> = {
    name: 'TimeLast', type: 'float', value: 0,
  }
  private timeBindings = [
    this.TimeNow,
    this.TimeLast,
  ]

  /**
   * A collection of light source bindings
   */
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

  /**
   * Updates camera binding values
   *
   * @param transform - The transform matrix
   * @param view - The view matrix
   * @param proj - The projection matrix
   */
  public updateCamera(transform: Mat4, view: Mat4, proj: Mat4): UniformBinder {
    if (transform) {
      transform.getTranslation(this.CameraPosition.value)
      transform.getForward(this.CameraDirection.value)
    }
    if (view) {
      this.View.value.initFrom(view)
    }
    if (proj) {
      this.Projection.value.initFrom(proj)
    }
    if (view && proj) {
      Mat4.premultiply(this.View.value, this.Projection.value, this.ViewProjection.value)
    }
    return this
  }

  /**
   * Updates viewport binding values
   *
   * @param view - The viewport dimensions
   */
  public updateViewportSize(view: {width: number, height: number}): UniformBinder {
    this.ViewportSize.value.x = view.width
    this.ViewportSize.value.y = view.height
    this.ViewportPixelSize.value.x = 1.0 / view.width
    this.ViewportPixelSize.value.y = 1.0 / view.height
    return this
  }

  /**
   * Updates render target binding values
   *
   * @param target - The render target dimensions
   */
  public updateTargetSize(target: {width: number, height: number}): UniformBinder {
    this.TargetSize.value.x = target.width
    this.TargetSize.value.y = target.height
    this.TargetPixelSize.value.x = 1.0 / target.width
    this.TargetPixelSize.value.y = 1.0 / target.height
    return this
  }

  /**
   * Updates transform binding values
   *
   * @param world - The transform matrix
   */
  public updateTransform(world: Mat4): UniformBinder {
    if (world) {
      world.getTranslation(this.Position.value)
      world.getForward(this.Direction.value)
      this.World.value.initFrom(world)
    }
    return this
  }

  /**
   * Updates time binding values
   *
   * @param total - The total (game) time
   * @param elapsed - The last frame time
   */
  public updateTime(total: number, elapsed: number = 0): UniformBinder {
    this.TimeNow.value = total
    this.TimeLast.value = total - elapsed
    return this
  }

  /**
   * Updates binding values for multiple lights
   *
   * @param lights - The light sources providing values to bind
   */
  public updateLights(lights: LightSourceData[]) {
    for (let i = 0; i < lights.length; i++) {
      this.updateLight(lights[i], i)
    }
  }

  public updateLight(light: LightSourceData, index: number) {
    let l = this.Lights[index]
    if (!l) {
      return
    }
    l.Color.value = light.color
    l.Position.value = light.position
    l.Direction.value = light.direction
  }

  /**
   * Applies per object binding values to the program
   *
   * @param program - The program which uniforms should receive new values
   */
  public applyTransform(program: ShaderProgram): this {
    program.bind()
    program.applyBindings(this.transformBindings)
    return this
  }

  /**
   * Applies per view binding values to the program
   *
   * @param program - The program which uniforms should receive new values
   */
  public applyView(program: ShaderProgram): this {
    program.bind()
    program.applyBindings(this.viewBindings)
    return this
  }

  /**
   * Applies per frame binding values to the program
   *
   * @param program - The program which uniforms should receive new values
   */
  public applyTime(program: ShaderProgram): this {
    program.bind()
    program.applyBindings(this.timeBindings)
    return this
  }

  /**
   * Applies per light binding values to the program
   *
   * @param program - The program which uniforms should receive new values
   */
  public applyLights(program: ShaderProgram): this {
    program.bind()
    for (let lightBinding of this.lightBindings) {
      program.applyBindings(lightBinding)
    }
    return this
  }
}
