import { Device, Material, ShaderEffect, Texture } from '@gglib/graphics'
import { IMat, IVec3, IVec4, Mat4 } from '@gglib/math'
import { defaultProgram, DefaultProgramDefs } from '../programs'
import { SHADE_NON_FUNCTION, SHADE_PBR_FUNCTION, SHADE_BLINN_FUNCTION, SHADE_COOK_TORRANCE_FUNCTION, SHADE_PHONG_FUNCTION, SHADE_OPTIMIZED_FUNCTION, SHADE_LAMBERT_FUNCTION, SHADE_SZIRMAY_FUNCTION } from '../chunks';

export interface AutoMaterialLight {
  Position: number[]
  Direction: number[]
  Color: number[]
  Misc: number[]
}

const defineMap = {
  Alpha: 'ALPHA',
  AlphaClip: 'ALPHA_CLIP',
  FogColor: 'FOG',

  DiffuseColor: 'DIFFUSE_COLOR',
  DiffuseMap: 'DIFFUSE_MAP',
  DiffuseMapOffsetScale: 'DIFFUSE_MAP_OFFSET_SCALE',

  SpecularPower: 'SPECULAR_POWER',
  SpecularColor: 'SPECULAR_COLOR',
  SpecularMap: 'SPECULAR_MAP',
  SpecularMapOffsetScale: 'SPECULAR_MAP_OFFSET_SCALE',

  EmissionColor: 'EMISSION_COLOR',
  EmissionMap: 'EMISSION_MAP',
  EmissionMapOffsetScale: 'EMISSION_MAP_OFFSET_SCALE',

  NormalMap: 'NORMAL_MAP',
  NormalMapOffsetScale: 'NORMAL_MAP_OFFSET_SCALE',

  OcclusionMap: 'OCCLUSION_MAP',
  OcclusionMapOffsetScale: 'OCCLUSION_MAP_OFFSET_SCALE',

  MetallicRoughness: 'METALLIC_ROUGHNESS',
  MetallicRoughnessMap: 'METALLIC_ROUGHNESS_MAP',
}

export type ShadeFunction = SHADE_NON_FUNCTION
  | SHADE_PBR_FUNCTION
  | SHADE_BLINN_FUNCTION
  | SHADE_COOK_TORRANCE_FUNCTION
  | SHADE_PHONG_FUNCTION
  | SHADE_OPTIMIZED_FUNCTION
  | SHADE_LAMBERT_FUNCTION
  | SHADE_SZIRMAY_FUNCTION

const tempMat4 = Mat4.createIdentity()

export class AutoMaterial extends Material {

  public get ShadeFunction(): ShadeFunction {
    return this.defines.SHADE_FUNCTION
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
        this.lights[index] = new Proxy({}, {
          set: (target, key, value) => {
            target[key] = value
            this.parameters[`Lights${index}${key.toString()}`] = value
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

  public get SpecularPower(): number {
    return this.parameters.SpecularPower
  }
  public set SpecularPower(v: number) {
    this.parameters.SpecularPower = v
  }

  /**
   * Gets and sets the diffuse color.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * `DiffuseColor` and `DiffuseMap` are mutually exclusive. Make sure there is either
   * `DiffuseColor` OR `DiffuseMap` enabled, but not both.
   */
  public get DiffuseColor(): number[] | IVec3 {
    return this.parameters.DiffuseColor
  }
  public set DiffuseColor(v: number[] | IVec3) {
    this.parameters.DiffuseColor = v
  }

  /**
   * Gets and sets the specular color.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * `SpecularColor` and `SpecularMap` are mutually exclusive. Make sure there is either
   * `SpecularColor` OR `SpecularMap` enabled, but not both.
   */
  public get SpecularColor(): number[] | IVec3 {
    return this.parameters.SpecularColor
  }
  public set SpecularColor(v: number[] | IVec3) {
    this.parameters.SpecularColor = v
  }

  /**
   * Gets and sets the emission color.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * `EmissionColor` and `EmissionMap` are mutually exclusive. Make sure there is either
   * `EmissionColor` OR `EmissionMap` enabled, but not both.
   */
  public get EmissionColor(): number[] | IVec3 {
    return this.parameters.EmissionColor
  }
  public set EmissionColor(v: number[] | IVec3) {
    this.parameters.EmissionColor = v
  }

  /**
   * Gets and sets the diffuse texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * `DiffuseColor` and `DiffuseMap` are mutually exclusive. Make sure there is either
   * `DiffuseColor` OR `DiffuseMap` enabled, but not both.
   */
  public get DiffuseMap(): Texture {
    return this.parameters.DiffuseMap
  }
  public set DiffuseMap(v: Texture) {
    this.parameters.DiffuseMap = v
  }

  public get DiffuseMapOffsetScale(): number[] | IVec4 {
    return this.parameters.DiffuseMapOffsetScale
  }
  public set DiffuseMapOffsetScale(v: number[] | IVec4) {
    this.parameters.DiffuseMapOffsetScale = v
  }

  /**
   * Gets and sets the specular texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * `SpecularColor` and `SpecularMap` are mutually exclusive. Make sure there is either
   * `SpecularColor` OR `SpecularMap` enabled, but not both.
   */
  public get SpecularMap(): Texture {
    return this.parameters.SpecularMap
  }
  public set SpecularMap(v: Texture) {
    this.parameters.SpecularMap = v
  }

  public get SpecularMapOffsetScale(): number[] | IVec4 {
    return this.parameters.SpecularMapOffsetScale
  }
  public set SpecularMapOffsetScale(v: number[] | IVec4) {
    this.parameters.SpecularMapOffsetScale = v
  }

  /**
   * Gets and sets the emission texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * `EmissionColor` and `EmissionMap` are mutually exclusive. Make sure there is either
   * `EmissionColor` OR `EmissionMap` enabled, but not both.
   */
  public get EmissionMap(): Texture {
    return this.parameters.EmissionMap
  }
  public set EmissionMap(v: Texture) {
    this.parameters.EmissionMap = v
  }

  public get EmissionMapOffsetScale(): number[] | IVec4 {
    return this.parameters.EmissionMapOffsetScale
  }
  public set EmissionMapOffsetScale(v: number[] | IVec4) {
    this.parameters.EmissionMapOffsetScale = v
  }

  /**
   * Gets and sets the normal texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   */
  public get NormalMap(): Texture {
    return this.parameters.NormalMap
  }
  public set NormalMap(v: Texture) {
    this.parameters.NormalMap = v
  }

  public get NormalMapOffsetScale(): number[] | IVec4 {
    return this.parameters.NormalMapOffsetScale
  }
  public set NormalMapOffsetScale(v: number[] | IVec4) {
    this.parameters.NormalMapOffsetScale = v
  }

  /**
   * Gets and sets the occlusion texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   */
  public get OcclusionMap(): Texture {
    return this.parameters.OcclusionMap
  }
  public set OcclusionMap(v: Texture) {
    this.parameters.OcclusionMap = v
  }

  public get OcclusionMapOffsetScale(): number[] | IVec4 {
    return this.parameters.OcclusionMapOffsetScale
  }
  public set OcclusionMapOffsetScale(v: number[] | IVec4) {
    this.parameters.OcclusionMapOffsetScale = v
  }

  /**
   * Gets and sets the metallic roughness texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * This is only useful if the `ShadeFunction` is set to `shadePbr`
   */
  public get MetallicRoughnessMap(): Texture {
    return this.parameters.MetallicRoughnessMap
  }
  public set MetallicRoughnessMap(v: Texture) {
    this.parameters.MetallicRoughnessMap = v
  }

  /**
   * Gets and sets the metallic roughness values.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   * This is only useful if the `ShadeFunction` is set to `shadePbr`
   */
  public get MetallicRoughness(): number[] {
    return this.parameters.MetallicRoughness
  }
  public set MetallicRoughness(v: number[]) {
    this.parameters.MetallicRoughness = v
  }

  private useTangentPlane = false
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
  private lights: AutoMaterialLight[] = []
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
   * @param index The index of the light
   */
  public getLight(index: number): AutoMaterialLight {
    return this.lights[index]
  }

  private setParamValue(params: any, name: string | number | symbol, value: any) {
    const def = defineMap[name]
    const old = params[name]
    params[name] = value
    if (!def) {
      return
    }
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

  private updateEffect() {
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
