import { ContentLoader } from '@gglib/content'
import {
  BlendState,
  CullState,
  Device,
  Effect,
  Material,
  MaterialOptions,
  MaterialOptionsBase,
  MaterialParameters,
  Texture,
  instantiateMaterialTextures,
} from '@gglib/graphics'
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
import { DefaultProgramDefs, materialProgram } from '../programs'

const defineMap = {
  Alpha: 'ALPHA',
  AlphaClip: 'ALPHA_CLIP',
  FogColor: 'FOG',
  VertexColor: 'V_COLOR',

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
  MetallicRoughnessMapScaleOffset: 'METALLIC_ROUGHNESS_MAP_SCALE_OFFSET',

  Skinning: 'SKINNING',
  SkinningJointCount: 'SKINNING_JOINT_COUNT',
  SkinningWeightCount: 'SKINNING_WEIGHT_COUNT',
}

/**
 * @public
 */
export type ShadeFunction =
  | ShadeFunctionNone
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
export interface AutoMaterialParams extends MaterialParameters {
  World: IMat
  View: IMat
  Projection: IMat
  CameraPosition: IVec3

  VertexColor: boolean
  FogColor: number[] | IVec3
  FogParams: number[]
  Alpha: number
  AlphaClip: number

  AmbientColor: number[] | IVec3
  AmbientMap: Texture
  AmbientMapScaleOffset: number[] | IVec4

  DiffuseColor: number[] | IVec4
  DiffuseMap: Texture
  DiffuseMapScaleOffset: number[] | IVec4
  DiffuseMapCoord: number

  SpecularColor: number[] | IVec3
  SpecularPower: number
  SpecularMap: Texture
  SpecularMapScaleOffset: number[] | IVec4
  SpecularMapCoord: number

  EmissionColor: number[] | IVec3
  EmissionMap: Texture
  EmissionMapScaleOffset: number[] | IVec4
  EmissionMapCoord: number

  NormalMap: Texture
  NormalMapScaleOffset: number[] | IVec4
  NormalMapCoord: number

  OcclusionMap: Texture
  OcclusionMapScaleOffset: number[] | IVec4
  OcclusionMapCoord: number

  ParallaxMap: Texture
  ParallaxMapScaleOffset: number[] | IVec4
  ParallaxMapCoord: number
  ParallaxScaleBias: number[]

  MetallicRoughness: number[]
  MetallicRoughnessMap: Texture
  MetallicRoughnessMapScaleOffset: number[] | IVec4
  MetallicRoughnessMapCoord: number

  Skinning: boolean
  SkinningJointCount: number
  SkinningWeightCount: number
  'Joints[0]': Float32Array
}

/**
 * @public
 */
export class AutoMaterial extends Material<AutoMaterialParams> {
  public static registerLoader() {
    ContentLoader.registerMaterial({
      name: 'AutoMaterial',
      type: AutoMaterial,
    })
  }

  private shadeFunction: ShadeFunction = 'shadeNone'
  public get ShadeFunction(): ShadeFunction {
    return this.shadeFunction
  }
  public set ShadeFunction(name: ShadeFunction) {
    if (this.shadeFunction !== name) {
      this.shadeFunction = name
      this.needsUpdate = true
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
      this.needsUpdate = true
      this.lights.length = v
      for (let i = 0; i < v; i++) {
        const index = i
        this.lights[index] =
          this.lights[index] ||
          (new Proxy(new LightParams(), {
            set: (target, key, value) => {
              target[key] = value
              target.assign(index, this.parameters)
              return true
            },
          }) as any)
      }
    }
  }

  /**
   * Enables and disables the skinning
   */
  public get Skinning(): boolean {
    return !!this.parameters.Skinning
  }
  public set Skinning(v: boolean) {
    if (this.parameters.Skinning !== v) {
      this.parameters.Skinning = v
      this.needsUpdate = true
    }
  }

  public get SkinningJointCount(): number {
    return this.parameters.SkinningJointCount ?? 16
  }
  public set SkinningJointCount(v: number) {
    if (this.parameters.SkinningJointCount !== v) {
      this.parameters.SkinningJointCount = v
      this.needsUpdate = true
    }
  }

  public get SkinningWeightCount(): number {
    return this.parameters.SkinningWeightCount ?? 4
  }
  public set SkinningWeightCount(v: number) {
    if (this.parameters.SkinningWeightCount !== v) {
      this.parameters.SkinningWeightCount = v
      this.needsUpdate = true
    }
  }

  private joints: Float32Array
  public set Joints(v: Mat4[]) {
    this.Skinning = true
    this.SkinningJointCount = Math.max(v.length, this.SkinningJointCount)
    if (!this.joints || this.joints.length > v.length * 16) {
      this.joints = new Float32Array(v.length * 16)
    }
    for (let i = 0; i < v.length; i++) {
      v[i].toArray(this.joints, i * 16)
    }
    this.parameters['Joints[0]'] = this.joints
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

  public get Blend(): boolean {
    return !!this.parameters.Blend
  }
  public set Blend(v: boolean) {
    if (this.parameters.Blend !== v) {
      this.parameters.Blend = v
      this.needsUpdate = true
    }
  }

  public get DoubleSided(): boolean {
    return !!this.parameters.DoubleSided
  }
  public set DoubleSided(v: boolean) {
    if (this.parameters.DoubleSided !== v) {
      this.parameters.DoubleSided = v
      this.needsUpdate = true
    }
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
  public get DiffuseColor(): number[] | IVec4 {
    return this.parameters.DiffuseColor
  }
  public set DiffuseColor(v: number[] | IVec4) {
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

  public get DiffuseMapCoord(): number {
    return this.parameters.DiffuseMapCoord
  }
  public set DiffuseMapUV(v: number) {
    if (this.parameters.DiffuseMapCoord !== v) {
      this.parameters.DiffuseMapCoord = v
      this.needsUpdate = true
    }
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

  public get SpecularMapCoord(): number {
    return this.parameters.SpecularMapCoord
  }
  public set SpecularMapCoord(v: number) {
    if (this.parameters.SpecularMapCoord !== v) {
      this.parameters.SpecularMapCoord = v
      this.needsUpdate = true
    }
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

  public get EmissionMapCoord(): number {
    return this.parameters.EmissionMapCoord
  }
  public set EmissionMapCoord(v: number) {
    if (this.parameters.EmissionMapCoord !== v) {
      this.parameters.EmissionMapCoord = v
      this.needsUpdate = true
    }
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

  public get NormalMapCoord(): number {
    return this.parameters.NormalMapCoord
  }
  public set NormalMapCoord(v: number) {
    if (this.parameters.NormalMapCoord !== v) {
      this.parameters.NormalMapCoord = v
      this.needsUpdate = true
    }
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

  public get OcclusionMapCoord(): number {
    return this.parameters.OcclusionMapCoord
  }
  public set OcclusionMapCoord(v: number) {
    if (this.parameters.OcclusionMapCoord !== v) {
      this.parameters.OcclusionMapCoord = v
      this.needsUpdate = true
    }
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

  public get ParallaxMapCoord(): number {
    return this.parameters.ParallaxMapCoord
  }
  public set ParallaxMapCoord(v: number) {
    if (this.parameters.ParallaxMapCoord !== v) {
      this.parameters.ParallaxMapCoord = v
      this.needsUpdate = true
    }
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

  private parallaxOcclusionSamples = 0
  public get ParallaxOcclusionSamples(): number {
    return this.parallaxOcclusionSamples
  }
  public set ParallaxOcclusionSamples(v: number) {
    if (this.ParallaxOcclusionSamples !== v) {
      this.parallaxOcclusionSamples = v
      this.needsUpdate = true
    }
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

  public get MetallicRoughnessMapCoord(): number {
    return this.parameters.MetallicRoughnessMapCoord
  }
  public set MetallicRoughnessMapCoord(v: number) {
    if (this.parameters.MetallicRoughnessMapCoord !== v) {
      this.parameters.MetallicRoughnessMapCoord = v
      this.needsUpdate = true
    }
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
      this.needsUpdate = true
    }
  }

  public get effect() {
    if (this.needsUpdate || this._effect == null) {
      this.updateEffect()
    }
    return this._effect
  }

  private defines: DefaultProgramDefs = {}
  private lights: LightParams[] = []
  private needsUpdate = true
  protected _effect: Effect

  public constructor(device: Device, options?: MaterialOptionsBase<AutoMaterialParams>) {
    super(device, (options as any) || {})
  }

  protected createParameters(options: MaterialOptions): void {
    const params = {
      ...((options.parameters || {}) as AutoMaterialParams),
    }
    for (const key in params) {
      if (!(key in this)) {
        console.warn(`AutoMaterial: Unknown parameter "${key}"`)
        delete params[key]
      }
    }
    instantiateMaterialTextures(this.device, params)
    this.parameters = new Proxy(params, {
      set: (target, name, value): boolean => {
        this.setParamValue(target, name, value)
        return true
      },
    })
  }

  protected createEffect(options: MaterialOptions) {
    // nothing to create here, will be created on demand
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
    const old = params[name]
    params[name] = value
    if (name in defineMap) {
      this.needsUpdate ||= (old == null && value != null) || (value == null && old != null)
    }
  }

  private updateEffect() {
    this._effect?.dispose()
    this._effect = null
    this.updateDefines()
    // console.debug(`AutoMaterial:`, this.defines)
    this._effect = this.device.createEffect({
      techniques: [
        {
          passes: [
            {
              blendState: this.Blend ? BlendState.AlphaBlend : null,
              cullState: this.DoubleSided ? CullState.CullNone : null,
              program: materialProgram(this.defines),
            },
          ],
        },
      ],
    })
    this.needsUpdate = false
  }

  private updateDefines() {
    for (const key in this.defines) {
      delete this.defines[key]
    }
    for (const param in this.parameters) {
      const defineKey = defineMap[param]
      if (!defineKey) {
        continue
      }
      if (this.parameters[param] != null) {
        this.defines[defineKey] = true
      }
    }
    if (this.useTangentPlane) {
      delete this.defines.V_TANGENT
      this.defines.V_TANGENT_PLANE = true
    } else if (this.NormalMap) {
      this.defines.V_TANGENT = true
      delete this.defines.V_TANGENT_PLANE
    } else {
      delete this.defines.V_TANGENT
    }
    if (this.LightCount > 0) {
      this.defines.LIGHT = true
      this.defines.LIGHT_COUNT = this.LightCount
    } else {
      delete this.defines.LIGHT
      delete this.defines.LIGHT_COUNT
    }
    this.defines.SHADE_FUNCTION = this.ShadeFunction

    if (this.parallaxOcclusionSamples > 0) {
      this.defines.PARALLAX_OCCLUSION = true
      this.defines.PARALLAX_OCCLUSION_SAMPLES = this.parallaxOcclusionSamples | 0
    } else {
      delete this.defines.PARALLAX_OCCLUSION
      delete this.defines.PARALLAX_OCCLUSION_SAMPLES
    }

    if (this.Skinning) {
      this.defines.SKINNING = true
      this.defines.SKINNING_JOINT_COUNT = this.SkinningJointCount
      this.defines.SKINNING_WEIGHT_COUNT = this.SkinningWeightCount
    } else {
      delete this.defines.SKINNING
      delete this.defines.SKINNING_JOINT_COUNT
      delete this.defines.SKINNING_WEIGHT_COUNT
    }

    if (this.DiffuseMapCoord > 0) {
      this.defines.DIFFUSE_MAP_UV = `vTexture${this.DiffuseMapCoord}.xy`
      this.defines[`V_TEXTURE${this.DiffuseMapCoord}`] = true
    }
    if (this.SpecularMapCoord > 0) {
      this.defines.SPECULAR_MAP_UV = `vTexture${this.SpecularMapCoord}.xy`
      this.defines[`V_TEXTURE${this.SpecularMapCoord}`] = true
    }
    if (this.EmissionMapCoord > 0) {
      this.defines.EMISSION_MAP_UV = `vTexture${this.EmissionMapCoord}.xy`
      this.defines[`V_TEXTURE${this.EmissionMapCoord}`] = true
    }
    if (this.NormalMapCoord > 0) {
      this.defines.NORMAL_MAP_UV = `vTexture${this.NormalMapCoord}.xy`
      this.defines[`V_TEXTURE${this.NormalMapCoord}`] = true
    }
    if (this.OcclusionMapCoord > 0) {
      this.defines.OCCLUSION_MAP_UV = `vTexture${this.OcclusionMapCoord}.xy`
      this.defines[`V_TEXTURE${this.OcclusionMapCoord}`] = true
    }
    if (this.ParallaxMapCoord > 0) {
      this.defines.PARALLAX_MAP_UV = `vTexture${this.ParallaxMapCoord}.xy`
      this.defines[`V_TEXTURE${this.ParallaxMapCoord}`] = true
    }
    if (this.MetallicRoughnessMapCoord > 0) {
      this.defines.METALLIC_ROUGHNESS_MAP_UV = `vTexture${this.MetallicRoughnessMapCoord}.xy`
      this.defines[`V_TEXTURE${this.MetallicRoughnessMapCoord}`] = true
    }
  }
}
