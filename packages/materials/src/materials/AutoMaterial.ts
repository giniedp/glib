// import { ContentLoader } from '@gglib/content'
// import {
//   BlendState,
//   CullState,
//   Device,
//   Effect,
//   Material,
//   MaterialOptions,
//   MaterialOptionsBase,
//   MaterialParameters,
//   Texture,
//   instantiateMaterialTextures,
// } from '@gglib/graphics'
// import { IMat, IVec3, IVec4, Mat4, Vec3 } from '@gglib/math'
// import {
//   DebugOutput,
//   ShadeFunctionBlinn,
//   ShadeFunctionCookTorrance,
//   ShadeFunctionLambert,
//   ShadeFunctionNone,
//   ShadeFunctionOptimized,
//   ShadeFunctionPBR,
//   ShadeFunctionPhong,
//   ShadeFunctionSzirmay,
// } from '../chunks'
// import { LightParams } from '../lights'
// import { MaterialProgramDefs, materialProgram } from '../programs'

// const defineMap = {
//   Alpha: 'ALPHA',
//   AlphaClip: 'ALPHA_CLIP',
//   FogColor: 'FOG',
//   VertexColor: 'V_COLOR',
//   IndexOfRefraction: 'INDEX_OF_REFRACTION',
//   Debug: 'DEBUG',

//   AmbientColor: 'AMBIENT_COLOR',
//   AmbientColorMap: 'AMBIENT_COLOR_MAP',
//   AmbientColorMapTransform: 'AMBIENT_COLOR_MAP_TRANSFORM',
//   AmbientColorMapScaleOffset: 'AMBIENT_COLOR_MAP_SCALE_OFFSET',

//   BaseColor: 'BASE_COLOR',
//   BaseColorMap: 'BASE_COLOR_MAP',
//   BaseColorMapTransform: 'BASE_COLOR_MAP_TRANSFORM',
//   BaseColorMapScaleOffset: 'BASE_COLOR_MAP_SCALE_OFFSET',

//   SpecularColor: 'SPECULAR_COLOR',
//   SpecularColorMap: 'SPECULAR_COLOR_MAP',
//   SpecularColorMapTransform: 'SPECULAR_COLOR_MAP_TRANSFORM',
//   SpecularColorMapScaleOffset: 'SPECULAR_COLOR_MAP_SCALE_OFFSET',

//   EmissiveColor: 'EMISSIVE_COLOR',
//   EmissiveColorMap: 'EMISSIVE_COLOR_MAP',
//   EmissiveColorMapTransform: 'EMISSIVE_COLOR_MAP_TRANSFORM',
//   EmissiveColorMapScaleOffset: 'EMISSIVE_COLOR_MAP_SCALE_OFFSET',

//   NormalMap: 'NORMAL_MAP',
//   NormalMapTransform: 'NORMAL_MAP_TRANSFORM',
//   NormalMapScaleOffset: 'NORMAL_MAP_SCALE_OFFSET',

//   OcclusionMap: 'OCCLUSION_MAP',
//   OcclusionMapTransform: 'OCCLUSION_MAP_TRANSFORM',
//   OcclusionMapScaleOffset: 'OCCLUSION_MAP_SCALE_OFFSET',

//   ParallaxMap: 'PARALLAX_MAP',
//   ParallaxMapTransform: 'PARALLAX_MAP_TRANSFORM',
//   ParallaxMapScaleOffset: 'PARALLAX_MAP_SCALE_OFFSET',

//   Metallic: 'METALLIC',
//   Roughness: 'ROUGHNESS',

//   MetallicRoughnessMap: 'METALLIC_ROUGHNESS_MAP',
//   MetallicRoughnessMapTransform: 'METALLIC_ROUGHNESS_MAP_TRANSFORM',
//   MetallicRoughnessMapScaleOffset: 'METALLIC_ROUGHNESS_MAP_SCALE_OFFSET',

//   SmoothnessMap: 'SMOOTHNESS_MAP',
//   SmoothnessMapTransform: 'SMOOTHNESS_MAP_TRANSFORM',
//   SmoothnessMapScaleOffset: 'SMOOTHNESS_MAP_SCALE_OFFSET',
//   SmoothnessMapChannel: 'SMOOTHNESS_MAP_CHANNEL',

//   Skinning: 'SKINNING',
//   SkinningJointCount: 'SKINNING_JOINT_COUNT',
//   SkinningWeightCount: 'SKINNING_WEIGHT_COUNT',

//   ShadeFunction: 'SHADE_FUNCTION'
// }

// /**
//  * @public
//  */
// export type ShadeFunction =
//   | ShadeFunctionNone
//   | ShadeFunctionPBR
//   | ShadeFunctionBlinn
//   | ShadeFunctionCookTorrance
//   | ShadeFunctionPhong
//   | ShadeFunctionOptimized
//   | ShadeFunctionLambert
//   | ShadeFunctionSzirmay

// const tempMat4 = Mat4.createIdentity()

// /**
//  * @public
//  */
// export interface AutoMaterialParams extends MaterialParameters {
//   World: IMat
//   View: IMat
//   Projection: IMat
//   CameraPosition: IVec3
//   ViewProjectionInverse: IMat
//   Debug: DebugOutput

//   VertexColor: boolean
//   FogColor: number[] | IVec3
//   FogParams: number[]
//   Alpha: number
//   AlphaClip: number
//   IndexOfRefraction: number

//   AmbientColor: number[] | IVec3
//   AmbientColorMap: Texture
//   AmbientColorMapTransform: IMat
//   AmbientColorMapScaleOffset: number[] | IVec4

//   BaseColor: number[] | IVec4
//   BaseColorMap: Texture
//   BaseColorMapCoord: number
//   BaseColorMapTransform: IMat
//   BaseColorMapScaleOffset: number[] | IVec4

//   Metallic: number
//   Roughness: number

//   MetallicRoughnessMap: Texture
//   MetallicRoughnessMapCoord: number
//   MetallicRoughnessMapTransform: IMat
//   MetallicRoughnessMapScaleOffset: number[] | IVec4

//   SmoothnessMap: Texture
//   SmoothnessMapCoord: number
//   SmoothnessMapTransform: IMat
//   SmoothnessMapScaleOffset: number[] | IVec4
//   SmoothnessMapChannel: string

//   SpecularColor: number[] | IVec3
//   SpecularColorMap: Texture
//   SpecularColorMapCoord: number
//   SpecularColorMapTransform: IMat
//   SpecularColorMapScaleOffset: number[] | IVec4

//   EmissiveColor: number[] | IVec3
//   EmissiveColorMap: Texture
//   EmissiveColorMapCoord: number
//   EmissiveColorMapTransform: IMat
//   EmissiveColorMapScaleOffset: number[] | IVec4

//   NormalMap: Texture
//   NormalMapCoord: number
//   NormalMapTransform: IMat
//   NormalMapScaleOffset: number[] | IVec4

//   OcclusionMap: Texture
//   OcclusionMapCoord: number
//   OcclusionMapTransform: IMat
//   OcclusionMapScaleOffset: number[] | IVec4

//   ParallaxMap: Texture
//   ParallaxMapCoord: number
//   ParallaxMapTransform: IMat
//   ParallaxMapScaleOffset: number[] | IVec4
//   ParallaxScaleBias: number[]

//   IrradianceMap: Texture
//   EnvironmentMap: Texture
//   EnvironmentLUT: Texture
//   EnvironmentIntensity: number

//   Skinning: boolean
//   SkinningJointCount: number
//   SkinningWeightCount: number
//   'Joints[0]': Float32Array

//   ShadeFunction: ShadeFunction
// }

// /**
//  * @public
//  */
// export class AutoMaterial extends Material<AutoMaterialParams> {
//   public static registerLoader() {
//     ContentLoader.registerMaterial({
//       name: 'AutoMaterial',
//       type: AutoMaterial,
//     })
//   }

//   private shadeFunction: ShadeFunction = 'shadeNone'
//   public get ShadeFunction(): ShadeFunction {
//     return this.shadeFunction
//   }
//   public set ShadeFunction(name: ShadeFunction) {
//     if (this.shadeFunction !== name) {
//       this.shadeFunction = name
//       this.needsUpdate = true
//     }
//   }

//   /**
//    * Gets and sets the world matrix
//    */
//   public get World(): IMat {
//     return this.parameters.World
//   }
//   public set World(v: IMat) {
//     this.parameters.World = v
//   }

//   /**
//    * Gets and sets the view matrix
//    */
//   public get View(): IMat {
//     return this.parameters.View
//   }
//   public set View(v: IMat) {
//     this.parameters.View = v
//     if (v) {
//       Mat4.invert(v, tempMat4)
//       this.parameters.CameraPosition = tempMat4.getTranslation(this.parameters.CameraPosition)
//       this.parameters.CameraDirection = tempMat4.getForward(this.parameters.CameraDirection)
//     } else {
//       this.parameters.CameraPosition = Vec3.clone(Vec3.Zero)
//       this.parameters.CameraDirection = Vec3.clone(Vec3.NegativeUnitZ)
//     }
//   }

//   /**
//    * Gets and sets the projection matrix
//    */
//   public get Projection(): IMat {
//     return this.parameters.Projection
//   }
//   public set Projection(v: IMat) {
//     this.parameters.Projection = v
//   }

//   /**
//    * The number of simultanious lights
//    *
//    * @remarks
//    * Changing this value forces the shader to recompile. This value must be set
//    * before `getLight()` can be used.
//    */
//   public get LightCount() {
//     return this.lights.length
//   }
//   public set LightCount(v: number) {
//     if (this.LightCount !== v) {
//       this.needsUpdate = true
//       this.lights.length = v
//       for (let i = 0; i < v; i++) {
//         const index = i
//         this.lights[index] =
//           this.lights[index] ||
//           (new Proxy(new LightParams(), {
//             set: (target, key, value) => {
//               target[key] = value
//               target.assign(index, this.parameters)
//               return true
//             },
//           }) as any)
//       }
//     }
//   }

//   /**
//    * Enables and disables the skinning
//    */
//   public get Skinning(): boolean {
//     return !!this.parameters.Skinning
//   }
//   public set Skinning(v: boolean) {
//     if (this.parameters.Skinning !== v) {
//       this.parameters.Skinning = v
//       this.needsUpdate = true
//     }
//   }

//   public get SkinningJointCount(): number {
//     return this.parameters.SkinningJointCount ?? 16
//   }
//   public set SkinningJointCount(v: number) {
//     if (this.parameters.SkinningJointCount !== v) {
//       this.parameters.SkinningJointCount = v
//       this.needsUpdate = true
//     }
//   }

//   public get SkinningWeightCount(): number {
//     return this.parameters.SkinningWeightCount ?? 4
//   }
//   public set SkinningWeightCount(v: number) {
//     if (this.parameters.SkinningWeightCount !== v) {
//       this.parameters.SkinningWeightCount = v
//       this.needsUpdate = true
//     }
//   }

//   private joints: Float32Array
//   public set Joints(v: Mat4[]) {
//     this.Skinning = true
//     this.SkinningJointCount = Math.max(v.length, this.SkinningJointCount)
//     if (!this.joints || this.joints.length > v.length * 16) {
//       this.joints = new Float32Array(v.length * 16)
//     }
//     for (let i = 0; i < v.length; i++) {
//       v[i].toArray(this.joints, i * 16)
//     }
//     this.parameters['Joints[0]'] = this.joints
//   }

//   public get Debug(): DebugOutput {
//     return this.parameters.Debug
//   }
//   public set Debug(v: DebugOutput) {
//     this.parameters.Debug = v
//   }

//   /**
//    * Enables and disables the vertex color
//    *
//    * @remarks
//    * Changing this value forces the shader to recompile.
//    * Setting to `null` or `false` disables the vertex color.
//    */
//   public get VertexColor(): boolean {
//     return this.parameters.VertexColor
//   }
//   public set VertexColor(v: boolean) {
//     this.parameters.VertexColor = v
//   }

//   /**
//    * Gets and sets the fog color
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    * Setting to `null` disables the fog effect
//    */
//   public get FogColor(): number[] | IVec3 {
//     return this.parameters.FogColor
//   }
//   public set FogColor(v: number[] | IVec3) {
//     this.parameters.FogColor = v
//   }

//   /**
//    * Gets and sets the fog start distance
//    *
//    * @remarks
//    * Requires the the fog effect to be enabled via `FogColor` parameter.
//    */
//   public get FogStart(): number {
//     const params = this.parameters.FogParams
//     return params ? params[0] : 0
//   }
//   public set FogStart(v: number) {
//     const params = this.parameters.FogParams || [0, 0, 0, 0]
//     params[0] = v
//     this.parameters.FogParams = params
//   }

//   /**
//    * Gets and sets the fog end distance
//    *
//    * @remarks
//    * Requires the the fog effect to be enabled via `FogColor` parameter.
//    */
//   public get FogEnd(): number {
//     const params = this.parameters.FogParams
//     return params ? params[1] : 0
//   }
//   public set FogEnd(v: number) {
//     const params = this.parameters.FogParams || [0, 0, 0, 0]
//     params[1] = v
//     this.parameters.FogParams = params
//   }

//   /**
//    * Gets and sets the fog density
//    *
//    * @remarks
//    * Requires the the fog effect to be enabled via `FogColor` parameter.
//    */
//   public get FogDensity(): number {
//     const params = this.parameters.FogParams
//     return params ? params[2] : 0
//   }
//   public set FogDensity(v: number) {
//     const params = this.parameters.FogParams || [0, 0, 0, 0]
//     params[2] = v
//     this.parameters.FogParams = params
//   }

//   /**
//    * Gets and sets the fog type
//    *
//    * @remarks
//    * Requires the the fog effect to be enabled via `FogColor` parameter.
//    */
//   public get FogType(): number {
//     const params = this.parameters.FogParams
//     return params ? params[3] : 0
//   }
//   public set FogType(v: number) {
//     const params = this.parameters.FogParams || [0, 0, 0, 0]
//     params[3] = v
//     this.parameters.FogParams = params
//   }

//   public get Blend(): boolean {
//     return !!this.parameters.Blend
//   }
//   public set Blend(v: boolean) {
//     if (this.parameters.Blend !== v) {
//       this.parameters.Blend = v
//       this.needsUpdate = true
//     }
//   }

//   public get DoubleSided(): boolean {
//     return !!this.parameters.DoubleSided
//   }
//   public set DoubleSided(v: boolean) {
//     if (this.parameters.DoubleSided !== v) {
//       this.parameters.DoubleSided = v
//       this.needsUpdate = true
//     }
//   }

//   /**
//    * Gets and sets the alpha value
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    * Setting to `null` disables the alpha function.
//    */
//   public get Alpha(): number {
//     return this.parameters.Alpha
//   }
//   public set Alpha(v: number) {
//     this.parameters.Alpha = v
//   }

//   /**
//    * Gets and sets the alpha clip value
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    * Setting to `null` disables the alpha clip function.
//    */
//   public get AlphaClip(): number {
//     return this.parameters.AlphaClip
//   }
//   public set AlphaClip(v: number) {
//     this.parameters.AlphaClip = v
//   }

//   public get IndexOfRefraction(): number {
//     return this.parameters.IndexOfRefraction
//   }
//   public set IndexOfRefraction(v: number) {
//     this.parameters.IndexOfRefraction = v
//   }

//   /**
//    * Gets and sets the ambient color.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    */
//   public get AmbientColor(): number[] | IVec3 {
//     return this.parameters.AmbientColor
//   }
//   public set AmbientColor(v: number[] | IVec3) {
//     this.parameters.AmbientColor = v
//   }

//   /**
//    * Gets and sets the diffuse color.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    */
//   public get BaseColor(): number[] | IVec4 {
//     return this.parameters.BaseColor
//   }
//   public set BaseColor(v: number[] | IVec4) {
//     this.parameters.BaseColor = v
//   }

//   /**
//    * Gets and sets the specular color.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    */
//   public get SpecularColor(): number[] | IVec3 {
//     return this.parameters.SpecularColor
//   }
//   public set SpecularColor(v: number[] | IVec3) {
//     this.parameters.SpecularColor = v
//   }

//   public get Roughness(): number {
//     return this.parameters.Roughness
//   }
//   public set Roughness(v: number) {
//     this.parameters.Roughness = v
//   }

//   /**
//    * Gets and sets the emission color.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    * `EmissiveColor` and `EmissiveColorMap` are mutually exclusive. Make sure there is either
//    * `EmissiveColor` OR `EmissiveColorMap` enabled, but not both.
//    */
//   public get EmissiveColor(): number[] | IVec3 {
//     return this.parameters.EmissiveColor
//   }
//   public set EmissiveColor(v: number[] | IVec3) {
//     this.parameters.EmissiveColor = v
//   }

//   /**
//    * Gets and sets the ambient texture.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    */
//   public get AmbientColorMap(): Texture {
//     return this.parameters.AmbientColorMap
//   }
//   public set AmbientColorMap(v: Texture) {
//     this.parameters.AmbientColorMap = v
//   }

//   public get AmbientColorMapScaleOffset(): number[] | IVec4 {
//     return this.parameters.AmbientColorMapScaleOffset
//   }
//   public set AmbientColorMapScaleOffset(v: number[] | IVec4) {
//     this.parameters.AmbientColorMapScaleOffset = v
//   }

//   public get AmbientColorMapTransform(): IMat {
//     return this.parameters.AmbientColorMapTransform
//   }
//   public set AmbientColorMapTransform(v: IMat) {
//     this.parameters.AmbientColorMapTransform = v
//   }

//   /**
//    * Gets and sets the diffuse texture.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    */
//   public get BaseColorMap(): Texture {
//     return this.parameters.BaseColorMap
//   }
//   public set BaseColorMap(v: Texture) {
//     this.parameters.BaseColorMap = v
//   }

//   public get BaseColorMapTransform(): IMat {
//     return this.parameters.BaseColorMapTransform
//   }
//   public set BaseColorMapTransform(v: IMat) {
//     this.parameters.BaseColorMapTransform = v
//   }

//   public get BaseColorMapScaleOffset(): number[] | IVec4 {
//     return this.parameters.BaseColorMapScaleOffset
//   }
//   public set BaseColorMapScaleOffset(v: number[] | IVec4) {
//     this.parameters.BaseColorMapScaleOffset = v
//   }

//   public get BaseColorMapCoord(): number {
//     return this.parameters.BaseColorMapCoord
//   }
//   public set BaseColorMapUV(v: number) {
//     if (this.parameters.BaseColorMapCoord !== v) {
//       this.parameters.BaseColorMapCoord = v
//       this.needsUpdate = true
//     }
//   }

//   public get SpecularColorMap(): Texture {
//     return this.parameters.SpecularColorMap
//   }
//   public set SpecularColorMap(v: Texture) {
//     this.parameters.SpecularColorMap = v
//   }

//   public get SpecularColorMapTransform(): IMat {
//     return this.parameters.SpecularColorMapTransform
//   }
//   public set SpecularColorMapTransform(v: IMat) {
//     this.parameters.SpecularColorMapTransform = v
//   }

//   public get SpecularColorMapScaleOffset(): number[] | IVec4 {
//     return this.parameters.SpecularColorMapScaleOffset
//   }
//   public set SpecularColorMapScaleOffset(v: number[] | IVec4) {
//     this.parameters.SpecularColorMapScaleOffset = v
//   }

//   public get SpecularColorMapCoord(): number {
//     return this.parameters.SpecularColorMapCoord
//   }
//   public set SpecularColorMapCoord(v: number) {
//     if (this.parameters.SpecularColorMapCoord !== v) {
//       this.parameters.SpecularColorMapCoord = v
//       this.needsUpdate = true
//     }
//   }

//   public get SmoothnessMap(): Texture {
//     return this.parameters.SmoothnessMap
//   }
//   public set SmoothnessMap(v: Texture) {
//     this.parameters.SmoothnessMap = v
//   }

//   public get SmoothnessMapChannel(): string {
//     return this.parameters.SmoothnessMapChannel
//   }
//   public set SmoothnessMapChannel(v: string) {
//     this.parameters.SmoothnessMapChannel = v
//   }

//   public get SmoothnessMapTransform(): IMat {
//     return this.parameters.SmoothnessMapTransform
//   }
//   public set SmoothnessMapTransform(v: IMat) {
//     this.parameters.SmoothnessMapTransform = v
//   }

//   public get SmoothnessMapScaleOffset(): number[] | IVec4 {
//     return this.parameters.SmoothnessMapScaleOffset
//   }
//   public set SmoothnessMapScaleOffset(v: number[] | IVec4) {
//     this.parameters.SmoothnessMapScaleOffset = v
//   }

//   public get SmoothnessMapCoord(): number {
//     return this.parameters.SmoothnessMapCoord
//   }
//   public set SmoothnessMapCoord(v: number) {
//     if (this.parameters.SmoothnessMapCoord !== v) {
//       this.parameters.SmoothnessMapCoord = v
//       this.needsUpdate = true
//     }
//   }

//   /**
//    * Gets and sets the emission texture.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    */
//   public get EmissiveColorMap(): Texture {
//     return this.parameters.EmissiveColorMap
//   }
//   public set EmissiveColorMap(v: Texture) {
//     this.parameters.EmissiveColorMap = v
//   }

//   public get EmissiveColorMapTransform(): IMat {
//     return this.parameters.EmissiveColorMapTransform
//   }
//   public set EmissiveColorMapTransform(v: IMat) {
//     this.parameters.EmissiveColorMapTransform = v
//   }

//   public get EmissiveColorMapScaleOffset(): number[] | IVec4 {
//     return this.parameters.EmissiveColorMapScaleOffset
//   }
//   public set EmissiveColorMapScaleOffset(v: number[] | IVec4) {
//     this.parameters.EmissiveColorMapScaleOffset = v
//   }

//   public get EmissiveColorMapCoord(): number {
//     return this.parameters.EmissiveColorMapCoord
//   }
//   public set EmissiveColorMapCoord(v: number) {
//     if (this.parameters.EmissiveColorMapCoord !== v) {
//       this.parameters.EmissiveColorMapCoord = v
//       this.needsUpdate = true
//     }
//   }

//   /**
//    * Gets and sets the normal texture.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    */
//   public get NormalMap(): Texture {
//     return this.parameters.NormalMap
//   }
//   public set NormalMap(v: Texture) {
//     this.parameters.NormalMap = v
//   }

//   public get NormalMapTransform(): IMat {
//     return this.parameters.NormalMapTransform
//   }
//   public set NormalMapTransform(v: IMat) {
//     this.parameters.NormalMapTransform = v
//   }

//   public get NormalMapScaleOffset(): number[] | IVec4 {
//     return this.parameters.NormalMapScaleOffset
//   }
//   public set NormalMapScaleOffset(v: number[] | IVec4) {
//     this.parameters.NormalMapScaleOffset = v
//   }

//   public get NormalMapCoord(): number {
//     return this.parameters.NormalMapCoord
//   }
//   public set NormalMapCoord(v: number) {
//     if (this.parameters.NormalMapCoord !== v) {
//       this.parameters.NormalMapCoord = v
//       this.needsUpdate = true
//     }
//   }

//   /**
//    * Gets and sets the occlusion texture.
//    *
//    * @remarks
//    * Changing this value from or to `null` forces the shader to recompile.
//    */
//   public get OcclusionMap(): Texture {
//     return this.parameters.OcclusionMap
//   }
//   public set OcclusionMap(v: Texture) {
//     this.parameters.OcclusionMap = v
//   }

//   public get OcclusionMapTransform(): IMat {
//     return this.parameters.OcclusionMapTransform
//   }
//   public set OcclusionMapTransform(v: IMat) {
//     this.parameters.OcclusionMapTransform = v
//   }

//   public get OcclusionMapScaleOffset(): number[] | IVec4 {
//     return this.parameters.OcclusionMapScaleOffset
//   }
//   public set OcclusionMapScaleOffset(v: number[] | IVec4) {
//     this.parameters.OcclusionMapScaleOffset = v
//   }

//   public get OcclusionMapCoord(): number {
//     return this.parameters.OcclusionMapCoord
//   }
//   public set OcclusionMapCoord(v: number) {
//     if (this.parameters.OcclusionMapCoord !== v) {
//       this.parameters.OcclusionMapCoord = v
//       this.needsUpdate = true
//     }
//   }

//   public get ParallaxMap(): Texture {
//     return this.parameters.ParallaxMap
//   }
//   public set ParallaxMap(v: Texture) {
//     this.parameters.ParallaxMap = v
//   }

//   public get ParallaxMapTransform(): IMat {
//     return this.parameters.ParallaxMapTransform
//   }
//   public set ParallaxMapTransform(v: IMat) {
//     this.parameters.ParallaxMapTransform = v
//   }

//   public get ParallaxMapScaleOffset(): number[] | IVec4 {
//     return this.parameters.ParallaxMapScaleOffset
//   }
//   public set ParallaxMapScaleOffset(v: number[] | IVec4) {
//     this.parameters.ParallaxMapScaleOffset = v
//   }

//   public get ParallaxMapCoord(): number {
//     return this.parameters.ParallaxMapCoord
//   }
//   public set ParallaxMapCoord(v: number) {
//     if (this.parameters.ParallaxMapCoord !== v) {
//       this.parameters.ParallaxMapCoord = v
//       this.needsUpdate = true
//     }
//   }

//   public get ParallaxScale(): number {
//     const params = this.parameters.ParallaxScaleBias || [0.04, 1]
//     return params ? params[0] : 0
//   }
//   public set ParallaxScale(v: number) {
//     const params = this.parameters.ParallaxScaleBias || [0.04, 1]
//     params[0] = v
//     this.parameters.ParallaxScaleBias = params
//   }

//   public get ParallaxBias(): number {
//     const params = this.parameters.ParallaxScaleBias || [0.04, 1]
//     return params ? params[1] : 0
//   }
//   public set ParallaxBias(v: number) {
//     const params = this.parameters.ParallaxScaleBias || [0.04, 1]
//     params[1] = v
//     this.parameters.ParallaxScaleBias = params
//   }

//   private parallaxOcclusionSamples = 0
//   public get ParallaxOcclusionSamples(): number {
//     return this.parallaxOcclusionSamples
//   }
//   public set ParallaxOcclusionSamples(v: number) {
//     if (this.ParallaxOcclusionSamples !== v) {
//       this.parallaxOcclusionSamples = v
//       this.needsUpdate = true
//     }
//   }

//   public get Metallic(): number {
//     return this.parameters.Metallic ?? 1
//   }
//   public set Metallic(v: number) {
//     this.parameters.Metallic = v
//   }

//   public get MetallicRoughnessMap(): Texture {
//     return this.parameters.MetallicRoughnessMap
//   }
//   public set MetallicRoughnessMap(v: Texture) {
//     this.parameters.MetallicRoughnessMap = v
//   }

//   public get MetallicRoughnessMapTransform(): IMat {
//     return this.parameters.MetallicRoughnessMapTransform
//   }
//   public set MetallicRoughnessMapTransform(v: IMat) {
//     this.parameters.MetallicRoughnessMapTransform = v
//   }

//   public get MetallicRoughnessMapCoord(): number {
//     return this.parameters.MetallicRoughnessMapCoord
//   }
//   public set MetallicRoughnessMapCoord(v: number) {
//     if (this.parameters.MetallicRoughnessMapCoord !== v) {
//       this.parameters.MetallicRoughnessMapCoord = v
//       this.needsUpdate = true
//     }
//   }

//   public get IrradianceMap(): Texture {
//     return this.parameters.IrradianceMap
//   }
//   public set IrradianceMap(v: Texture) {
//     this.parameters.IrradianceMap = v
//   }

//   public get EnvironmentMap(): Texture {
//     return this.parameters.EnvironmentMap
//   }
//   public set EnvironmentMap(v: Texture) {
//     const hasMap = !!this.parameters.EnvironmentMap
//     this.parameters.EnvironmentMap = v
//     if (hasMap !== !!v) {
//       this.needsUpdate = true
//     }
//   }

//   public get EnvironmentLUT(): Texture {
//     return this.parameters.EnvironmentLUT
//   }
//   public set EnvironmentLUT(v: Texture) {
//     this.parameters.EnvironmentLUT = v
//   }

//   public get EnvironmentIntensity(): number {
//     return this.parameters.EnvironmentIntensity
//   }
//   public set EnvironmentIntensity(v: number) {
//     this.parameters.EnvironmentIntensity = v
//   }

//   private useTangentPlane = false
//   public get UseTangentPlane() {
//     return this.useTangentPlane
//   }
//   public set UseTangentPlane(v: boolean) {
//     if (this.useTangentPlane !== v) {
//       this.useTangentPlane = v
//       this.needsUpdate = true
//     }
//   }

//   public get effect() {
//     if (this.needsUpdate || this._effect == null) {
//       this.updateEffect()
//     }
//     return this._effect
//   }

//   private defines: MaterialProgramDefs = {}
//   private lights: LightParams[] = []
//   public needsUpdate = true
//   protected _effect: Effect

//   public constructor(device: Device, options?: MaterialOptionsBase<Partial<AutoMaterialParams>>) {
//     super(device, (options as any) || {})
//   }

//   public updateCamera(view: Mat4, projection: Mat4) {
//     this.View = view
//     this.Projection = projection
//   }

//   protected override createParameters(options: MaterialOptions): void {
//     const params = {
//       ...((options.parameters || {}) as AutoMaterialParams),
//     }
//     for (const key in params) {
//       if (!(key in this)) {
//         console.warn(`AutoMaterial: Unknown parameter "${key}"`)
//         delete params[key]
//       }
//     }
//     const textures = instantiateMaterialTextures(this.device, params)
//     this.disposables.push(...textures)
//     this.parameters = new Proxy(params, {
//       set: (target, name, value): boolean => {
//         this.setParamValue(target, name, value)
//         return true
//       },
//     })
//   }

//   protected createEffect(options: MaterialOptions) {
//     // nothing to create here, will be created on demand
//   }

//   /**
//    * Gets the light at given index
//    *
//    * @param index - The index of the light
//    */
//   public getLight(index: number): LightParams {
//     return this.lights[index]
//   }

//   private setParamValue(params: any, name: string | number | symbol, value: any) {
//     const old = params[name]
//     params[name] = value
//     if (name in defineMap) {
//       let neededUpdate = this.needsUpdate
//       this.needsUpdate ||= (old == null && value != null) || (value == null && old != null)
//       if (!neededUpdate && this.needsUpdate) {
//         // console.log(name, old, value)
//       }
//     }
//   }

//   public updateEffect() {
//     this.needsUpdate = false
//     this._effect?.dispose()
//     this._effect = null
//     this.updateDefines(this.defines)
//     this._effect = this.device.createEffect({
//       techniques: [
//         {
//           passes: [
//             {
//               blendState: this.Blend ? BlendState.AlphaBlend : null,
//               cullState: this.DoubleSided ? CullState.CullNone : null,
//               program: materialProgram(this.defines, true),
//             },
//           ],
//         },
//       ],
//     })
//   }

//   public updateDefines(defines: MaterialProgramDefs) {
//     for (const key in defines) {
//       delete defines[key]
//     }
//     for (const param in this.parameters) {
//       const defineKey = defineMap[param]
//       if (!defineKey) {
//         continue
//       }
//       if (this.parameters[param] != null) {
//         defines[defineKey] = true
//       }
//     }
//     if (this.useTangentPlane) {
//       delete defines.V_TANGENT
//       defines.V_TANGENT_PLANE = true
//     }

//     if (this.NormalMap) {
//       //
//     }

//     if (this.LightCount > 0) {
//       defines.LIGHT = true
//       defines.LIGHT_COUNT = this.LightCount
//     } else {
//       delete defines.LIGHT
//       delete defines.LIGHT_COUNT
//     }
//     defines.SHADE_FUNCTION = this.ShadeFunction

//     if (this.parallaxOcclusionSamples > 0) {
//       defines.PARALLAX_OCCLUSION = true
//       defines.PARALLAX_OCCLUSION_SAMPLES = this.parallaxOcclusionSamples | 0
//     } else {
//       delete defines.PARALLAX_OCCLUSION
//       delete defines.PARALLAX_OCCLUSION_SAMPLES
//     }

//     if (this.Skinning) {
//       defines.SKINNING = true
//       defines.SKINNING_JOINT_COUNT = this.SkinningJointCount
//       defines.SKINNING_WEIGHT_COUNT = this.SkinningWeightCount
//     } else {
//       delete defines.SKINNING
//       delete defines.SKINNING_JOINT_COUNT
//       delete defines.SKINNING_WEIGHT_COUNT
//     }

//     if (this.SmoothnessMapChannel) {
//       defines.SMOOTHNESS_MAP_CHANNEL = this.SmoothnessMapChannel
//     }

//     if (this.BaseColorMapCoord > 0) {
//       defines.BASE_COLOR_MAP_UV = `vTexture${this.BaseColorMapCoord}.xy`
//       defines[`V_TEXTURE${this.BaseColorMapCoord}`] = true
//     }
//     if (this.SpecularColorMapCoord > 0) {
//       defines.SPECULAR_COLOR_MAP_UV = `vTexture${this.SpecularColorMapCoord}.xy`
//       defines[`V_TEXTURE${this.SpecularColorMapCoord}`] = true
//     }
//     if (this.EmissiveColorMapCoord > 0) {
//       defines.EMISSIVE_COLOR_MAP_UV = `vTexture${this.EmissiveColorMapCoord}.xy`
//       defines[`V_TEXTURE${this.EmissiveColorMapCoord}`] = true
//     }
//     if (this.NormalMapCoord > 0) {
//       defines.NORMAL_MAP_UV = `vTexture${this.NormalMapCoord}.xy`
//       defines[`V_TEXTURE${this.NormalMapCoord}`] = true
//     }
//     if (this.OcclusionMapCoord > 0) {
//       defines.OCCLUSION_MAP_UV = `vTexture${this.OcclusionMapCoord}.xy`
//       defines[`V_TEXTURE${this.OcclusionMapCoord}`] = true
//     }
//     if (this.ParallaxMapCoord > 0) {
//       defines.PARALLAX_MAP_UV = `vTexture${this.ParallaxMapCoord}.xy`
//       defines[`V_TEXTURE${this.ParallaxMapCoord}`] = true
//     }
//     if (this.MetallicRoughnessMapCoord > 0) {
//       defines.METALLIC_ROUGHNESS_MAP_UV = `vTexture${this.MetallicRoughnessMapCoord}.xy`
//       defines[`V_TEXTURE${this.MetallicRoughnessMapCoord}`] = true
//     }
//     if (this.EnvironmentMap) {
//       defines.ENVIRONMENT_MAP = true
//     }
//   }
// }
