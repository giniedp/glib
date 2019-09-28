import { Device, Material, ShaderEffect, Texture } from '@gglib/graphics'
import { IMat, IVec3, IVec4, Mat4 } from '@gglib/math'
import {
  ShadeFunctionBlinn,
  ShadeFunctionCookTorrance,
  ShadeFunctionLambert,
  ShadeFunctionNone,
  ShadeFunctionOptimized,
  ShadeFunctionPBR,
  ShadeFunctionPhong,
  ShadeFunctionSzirmay,
} from '../chunks'
import { LightParams } from '../lights'
import { defaultProgram, DefaultProgramDefs } from '../programs'

const defineMap = {
  Alpha: 'ALPHA',
  AlphaClip: 'ALPHA_CLIP',
  FogColor: 'FOG',
  VertexColor: 'V_COLOR1',

  AmbientColor: 'AMBIENT_COLOR',
  AmbientMap: 'AMBIENT_MAP',
  AmbientMapScaleOffset: 'AMBIENT_MAP_SCALE_OFFSET',

  DiffuseColor: 'DIFFUSE_COLOR',
  DiffuseMap: 'DIFFUSE_MAP',
  DiffuseMapScaleOffset: 'DIFFUSE_MAP_SCALE_OFFSET',

  SpecularPower: 'SPECULAR_POWER',
  SpecularColor: 'SPECULAR_COLOR',
  SpecularMap: 'SPECULAR_MAP',
  SpecularMapScaleOffset: 'SPECULAR_MAP_SCALE_OFFSET',

  EmissionColor: 'EMISSION_COLOR',
  EmissionMap: 'EMISSION_MAP',
  EmissionMapScaleOffset: 'EMISSION_MAP_SCALE_OFFSET',

  NormalMap: 'NORMAL_MAP',
  NormalMapScaleOffset: 'NORMAL_MAP_SCALE_OFFSET',

  OcclusionMap: 'OCCLUSION_MAP',
  OcclusionMapScaleOffset: 'OCCLUSION_MAP_SCALE_OFFSET',

  ParallaxMap: 'PARALLAX_MAP',
  ParallaxMapScaleOffset: 'PARALLAX_MAP_SCALE_OFFSET',

  MetallicRoughness: 'METALLIC_ROUGHNESS',
  MetallicRoughnessMap: 'METALLIC_ROUGHNESS_MAP',
}

/**
 * @public
 */
export type ShadeFunction = ShadeFunctionNone
  | ShadeFunctionPBR
  | ShadeFunctionBlinn
  | ShadeFunctionCookTorrance
  | ShadeFunctionPhong
  | ShadeFunctionOptimized
  | ShadeFunctionLambert
  | ShadeFunctionSzirmay

const tempMat4 = Mat4.createIdentity()

/**
 * @public
 */
export class AutoMaterial extends Material {

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
   * Enables and disables the vertex color
   *
   * @remarks
   * Changing this value forces the shader to recompile.
   * Setting to `null` or `false` disables the vertex color.
   */
  public get VertexColor(): boolean {
    return this.parameters.VertexColor
  }
  public set VertexColor(v: boolean) {
    this.parameters.VertexColor = v
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
   * Gets and sets the ambient color.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   */
  public get AmbientColor(): number[] | IVec3 {
    return this.parameters.AmbientColor
  }
  public set AmbientColor(v: number[] | IVec3) {
    this.parameters.AmbientColor = v
  }

  /**
   * Gets and sets the diffuse color.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
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
   * Gets and sets the ambient texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   */
  public get AmbientMap(): Texture {
    return this.parameters.AmbientMap
  }
  public set AmbientMap(v: Texture) {
    this.parameters.AmbientMap = v
  }

  public get AmbientMapScaleOffset(): number[] | IVec4 {
    return this.parameters.AmbientMapScaleOffset
  }
  public set AmbientMapScaleOffset(v: number[] | IVec4) {
    this.parameters.AmbientMapScaleOffset = v
  }

  /**
   * Gets and sets the diffuse texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   */
  public get DiffuseMap(): Texture {
    return this.parameters.DiffuseMap
  }
  public set DiffuseMap(v: Texture) {
    this.parameters.DiffuseMap = v
  }

  public get DiffuseMapScaleOffset(): number[] | IVec4 {
    return this.parameters.DiffuseMapScaleOffset
  }
  public set DiffuseMapScaleOffset(v: number[] | IVec4) {
    this.parameters.DiffuseMapScaleOffset = v
  }

  /**
   * Gets and sets the specular texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   */
  public get SpecularMap(): Texture {
    return this.parameters.SpecularMap
  }
  public set SpecularMap(v: Texture) {
    this.parameters.SpecularMap = v
  }

  public get SpecularMapScaleOffset(): number[] | IVec4 {
    return this.parameters.SpecularMapScaleOffset
  }
  public set SpecularMapScaleOffset(v: number[] | IVec4) {
    this.parameters.SpecularMapScaleOffset = v
  }

  /**
   * Gets and sets the emission texture.
   *
   * @remarks
   * Changing this value from or to `null` forces the shader to recompile.
   */
  public get EmissionMap(): Texture {
    return this.parameters.EmissionMap
  }
  public set EmissionMap(v: Texture) {
    this.parameters.EmissionMap = v
  }

  public get EmissionMapScaleOffset(): number[] | IVec4 {
    return this.parameters.EmissionMapScaleOffset
  }
  public set EmissionMapScaleOffset(v: number[] | IVec4) {
    this.parameters.EmissionMapScaleOffset = v
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

  public get NormalMapScaleOffset(): number[] | IVec4 {
    return this.parameters.NormalMapScaleOffset
  }
  public set NormalMapScaleOffset(v: number[] | IVec4) {
    this.parameters.NormalMapScaleOffset = v
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

  public get OcclusionMapScaleOffset(): number[] | IVec4 {
    return this.parameters.OcclusionMapScaleOffset
  }
  public set OcclusionMapScaleOffset(v: number[] | IVec4) {
    this.parameters.OcclusionMapScaleOffset = v
  }

  public get ParallaxMap(): Texture {
    return this.parameters.ParallaxMap
  }
  public set ParallaxMap(v: Texture) {
    this.parameters.ParallaxMap = v
  }

  public get ParallaxMapScaleOffset(): number[] | IVec4 {
    return this.parameters.ParallaxMapScaleOffset
  }
  public set ParallaxMapScaleOffset(v: number[] | IVec4) {
    this.parameters.ParallaxMapScaleOffset = v
  }

  public get ParallaxScale(): number {
    const params = this.parameters.ParallaxScaleBias || [0.04, 1]
    return params ? params[0] : 0
  }
  public set ParallaxScale(v: number) {
    const params = this.parameters.ParallaxScaleBias || [0.04, 1]
    params[0] = v
    this.parameters.ParallaxScaleBias = params
  }

  public get ParallaxBias(): number {
    const params = this.parameters.ParallaxScaleBias || [0.04, 1]
    return params ? params[1] : 0
  }
  public set ParallaxBias(v: number) {
    const params = this.parameters.ParallaxScaleBias || [0.04, 1]
    params[1] = v
    this.parameters.ParallaxScaleBias = params
  }

  public get ParallaxOcclusionSamples(): number {
    return this.defines.PARALLAX_OCCLUSION_SAMPLES || 0
  }
  public set ParallaxOcclusionSamples(v: number) {
    if (this.ParallaxOcclusionSamples === v) {
      return
    }
    if (v > 0) {
      this.defines.PARALLAX_OCCLUSION = true
      this.defines.PARALLAX_OCCLUSION_SAMPLES = (v || 0).toFixed(0) as any
    } else {
      delete this.defines.PARALLAX_OCCLUSION
      delete this.defines.PARALLAX_OCCLUSION_SAMPLES
    }
    this.hasChanged = true
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

  public get Metallic(): number {
    const params = this.parameters.MetallicRoughness || [1, 1]
    return params ? params[0] : 0
  }
  public set Metallic(v: number) {
    const params = this.parameters.MetallicRoughness || [1, 1]
    params[0] = v
    this.parameters.MetallicRoughness = params
  }

  public get Roughness(): number {
    const params = this.parameters.MetallicRoughness || [1, 1]
    return params ? params[1] : 0
  }
  public set Roughness(v: number) {
    const params = this.parameters.MetallicRoughness || [1, 1]
    params[1] = v
    this.parameters.MetallicRoughness = params
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
