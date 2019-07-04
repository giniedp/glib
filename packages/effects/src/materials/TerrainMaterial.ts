import { Device, Material, ShaderEffect, Texture } from '@gglib/graphics'
import { IMat, IVec3, Mat4 } from '@gglib/math'
import { LightParams } from '../lights'
import { defaultProgram, DefaultProgramDefs } from '../programs'
import { ShadeFunction } from './AutoMaterial'

const defineMap = {
  Alpha: 'ALPHA',
  AlphaClip: 'ALPHA_CLIP',
  FogColor: 'FOG',

  TintMap: 'SPLATTING_TINT',

  DiffuseMap: 'SPLATTING_BASE',
  DiffuseMapA: 'SPLATTING_ALPHA',
  DiffuseMapSlope: 'SPLATTING_SLOPE',
}

const tempMat4 = Mat4.createIdentity()

/**
 * @public
 */
export class TerrainMaterial extends Material {

  public get ShadeFunction(): ShadeFunction {
    return this.defines.SHADE_FUNCTION as any
  }
  public set ShadeFunction(name: ShadeFunction) {
    if (this.ShadeFunction !== name) {
      this.defines.SHADE_FUNCTION = name
      this.hasChanged = true
    }
  }

  /**
   * Gets and sets the world matrix
   */
  public get World(): IMat {
    return this.parameters.World
  }
  public set World(v: IMat) {
    this.parameters.World = v
  }

  /**
   * Gets and sets the view matrix
   */
  public get View(): IMat {
    return this.parameters.View
  }
  public set View(v: IMat) {
    Mat4.invert(v, tempMat4)
    this.parameters.View = v
    this.parameters.CameraPosition = tempMat4.getTranslation()
    this.parameters.CameraDirection = tempMat4.getForward()
  }

  /**
   * Gets and sets the projection matrix
   */
  public get Projection(): IMat {
    return this.parameters.Projection
  }
  public set Projection(v: IMat) {
    this.parameters.Projection = v
  }

  /**
   * The number of simultanious lights
   *
   * @remarks
   * Changing this value forces the shader to recompile. This value must be set
   * before `getLight()` can be used.
   */
  public get LightCount() {
    return this.lights.length
  }
  public set LightCount(v: number) {
    if (this.LightCount !== v) {
      this.hasChanged = true
      if (v > 0) {
        this.defines.LIGHT = true
        this.defines.LIGHT_COUNT = v
      } else {
        delete this.defines.LIGHT
        delete this.defines.LIGHT_COUNT
      }
      this.lights.length = v
      for (let i = 0; i < v; i++) {
        const index = i
        this.lights[index] = this.lights[index] || new Proxy(new LightParams(), {
          set: (target, key, value) => {
            target[key] = value
            target.assign(index, this.parameters)
            return true
          },
        }) as any
      }
    }
  }

  /**
   * Gets and sets the fog color
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * Setting to `null` disables the fog effect
   */
  public get FogColor(): number[] | IVec3 {
    return this.parameters.FogColor
  }
  public set FogColor(v: number[] | IVec3) {
    this.parameters.FogColor = v
  }

  /**
   * Gets and sets the fog start distance
   *
   * @remarks
   * Requires the the fog effect to be enabled via `FogColor` parameter.
   */
  public get FogStart(): number {
    const params = this.parameters.FogParams
    return params ? params[0] : 0
  }
  public set FogStart(v: number) {
    const params = this.parameters.FogParams || [0, 0, 0, 0]
    params[0] = v
    this.parameters.FogParams = params
  }

  /**
   * Gets and sets the fog end distance
   *
   * @remarks
   * Requires the the fog effect to be enabled via `FogColor` parameter.
   */
  public get FogEnd(): number {
    const params = this.parameters.FogParams
    return params ? params[1] : 0
  }
  public set FogEnd(v: number) {
    const params = this.parameters.FogParams || [0, 0, 0, 0]
    params[1] = v
    this.parameters.FogParams = params
  }

  /**
   * Gets and sets the fog density
   *
   * @remarks
   * Requires the the fog effect to be enabled via `FogColor` parameter.
   */
  public get FogDensity(): number {
    const params = this.parameters.FogParams
    return params ? params[2] : 0
  }
  public set FogDensity(v: number) {
    const params = this.parameters.FogParams || [0, 0, 0, 0]
    params[2] = v
    this.parameters.FogParams = params
  }

  /**
   * Gets and sets the fog type
   *
   * @remarks
   * Requires the the fog effect to be enabled via `FogColor` parameter.
   */
  public get FogType(): number {
    const params = this.parameters.FogParams
    return params ? params[3] : 0
  }
  public set FogType(v: number) {
    const params = this.parameters.FogParams || [0, 0, 0, 0]
    params[3] = v
    this.parameters.FogParams = params
  }

  /**
   * Gets and sets the alpha value
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * Setting to `null` disables the alpha function.
   */
  public get Alpha(): number {
    return this.parameters.Alpha
  }
  public set Alpha(v: number) {
    this.parameters.Alpha = v
  }

  /**
   * Gets and sets the alpha clip value
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * Setting to `null` disables the alpha clip function.
   */
  public get AlphaClip(): number {
    return this.parameters.AlphaClip
  }
  public set AlphaClip(v: number) {
    this.parameters.AlphaClip = v
  }

  public get SplatMap(): Texture {
    return this.parameters.SplatMap
  }
  public set SplatMap(v: Texture) {
    this.parameters.SplatMap = v
  }

  public get TintMap(): Texture {
    return this.parameters.TintMap
  }
  public set TintMap(v: Texture) {
    this.parameters.TintMap = v
  }

  public get DiffuseMap(): Texture {
    return this.parameters.DiffuseMap
  }
  public set DiffuseMap(v: Texture) {
    this.parameters.DiffuseMap = v
  }

  public get DiffuseMapR(): Texture {
    return this.parameters.DiffuseMapR
  }
  public set DiffuseMapR(v: Texture) {
    this.parameters.DiffuseMapR = v
  }

  public get DiffuseMapG(): Texture {
    return this.parameters.DiffuseMapG
  }
  public set DiffuseMapG(v: Texture) {
    this.parameters.DiffuseMapG = v
  }

  public get DiffuseMapB(): Texture {
    return this.parameters.DiffuseMapB
  }
  public set DiffuseMapB(v: Texture) {
    this.parameters.DiffuseMapB = v
  }

  public get DiffuseMapA(): Texture {
    return this.parameters.DiffuseMapA
  }
  public set DiffuseMapA(v: Texture) {
    this.parameters.DiffuseMapA = v
  }

  public get DiffuseMapSlope(): Texture {
    return this.parameters.DiffuseMapSlope
  }
  public set DiffuseMapSlope(v: Texture) {
    this.parameters.DiffuseMapSlope = v
  }

  public get NormalMap(): Texture {
    return this.parameters.NormalMap
  }
  public set NormalMap(v: Texture) {
    this.parameters.NormalMap = v
  }

  public get NormalMapR(): Texture {
    return this.parameters.NormalMapR
  }
  public set NormalMapR(v: Texture) {
    this.parameters.NormalMapR = v
  }

  public get NormalMapG(): Texture {
    return this.parameters.NormalMapG
  }
  public set NormalMapG(v: Texture) {
    this.parameters.NormalMapG = v
  }

  public get NormalMapB(): Texture {
    return this.parameters.NormalMapB
  }
  public set NormalMapB(v: Texture) {
    this.parameters.NormalMapB = v
  }

  public get NormalMapA(): Texture {
    return this.parameters.NormalMapA
  }
  public set NormalMapA(v: Texture) {
    this.parameters.NormalMapA = v
  }

  public get NormalMapSlope(): Texture {
    return this.parameters.NormalMapSlope
  }
  public set NormalMapSlope(v: Texture) {
    this.parameters.NormalMapSlope = v
  }

  public get Brightness(): number {
    return this.parameters.Brightness
  }
  public set Brightness(v: number) {
    this.parameters.Brightness = v
  }

  public get Saturation(): number {
    return this.parameters.Saturation
  }
  public set Saturation(v: number) {
    this.parameters.Saturation = v
  }

  public get Pertubation(): number {
    return this.parameters.Pertubation
  }
  public set Pertubation(v: number) {
    this.parameters.Pertubation = v
  }

  public get Tiling(): number {
    return this.parameters.Tiling
  }
  public set Tiling(v: number) {
    this.parameters.Tiling = v
  }

  private useTangentPlane = true
  public get UseTangentPlane() {
    return this.useTangentPlane
  }
  public set UseTangentPlane(v: boolean) {
    if (this.useTangentPlane !== v) {
      this.useTangentPlane = v
      this.hasChanged = true
    }
  }

  public get effect() {
    if (this.hasChanged || this.$effect == null) {
      this.updateEffect()
    }
    return this.$effect
  }

  private defines: DefaultProgramDefs = {}
  private lights: LightParams[] = []
  private hasChanged = true
  private $effect: ShaderEffect

  constructor(device: Device) {
    super(device, {
      effect: null,
      parameters: new Proxy({}, {
        set: (target, name, value): boolean => {
          this.setParamValue(target, name, value)
          return true
        },
      }),
    })
  }

  /**
   * Gets the light at given index
   *
   * @param index - The index of the light
   */
  public getLight(index: number): LightParams {
    return this.lights[index]
  }

  private setParamValue(params: any, name: string | number | symbol, value: any) {
    const def = defineMap[name]
    const old = params[name]
    params[name] = value

    if (def) {
      const hasChanged = old == null && value != null || value == null && old != null
      if (!hasChanged) {
        return
      }
      if (value != null) {
        this.defines[def] = true
      } else {
        delete this.defines[def]
      }
      this.hasChanged = true
    }

    if (typeof name === 'string' && /Normal/.test(name)) {
      const hadNormals = this.defines.SPLATTING_NORMAL
      const hasNormals = !!(
        this.NormalMap || this.NormalMapA || this.NormalMapB || this.NormalMapG || this.NormalMapR || this.NormalMapSlope
      )
      this.defines.SPLATTING_NORMAL = hasNormals
      if (hadNormals !== hasNormals) {
        this.hasChanged = true
      }
    }
  }

  private updateEffect() {
    this.defines.SPLATTING = true
    this.defines.V_TEXTURE1 = true

    if (this.useTangentPlane) {
      delete this.defines.V_TANGENT
      this.defines.V_TANGENT_PLANE = true
    } else if (this.NormalMap) {
      this.defines.V_TANGENT = true
      delete this.defines.V_TANGENT_PLANE
    } else {
      delete this.defines.V_TANGENT
    }

    if (this.$effect) {
      this.$effect.techniques.forEach((t) => {
        t.passes.forEach((p) => {
          p.program.destroy()
        })
      })
      this.$effect = null
    }

    this.$effect = this.device.createEffect({
      program: defaultProgram(this.defines),
    })
    this.hasChanged = false
  }
}
