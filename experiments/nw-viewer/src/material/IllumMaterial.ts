import {
  BlendState,
  CommonBlocks,
  CullState,
  DepthState,
  Device,
  Effect,
  type EffectOptions,
  type MaterialOptions,
  materialSchemaClass,
  RenderVariant,
  SamplerState,
  ShaderConstants,
  type ShaderModuleOptions,
  TRUE,
} from '@gglib/graphics'
import { Mat4, Vec2, vec4, Vec4 } from '@gglib/math'
import { type NwMaterialProps } from './GltfExtension'
import SCHEMA from './IllumMaterial.meta'
import WGSL from './IllumMaterial.wgsl'
import WGSL_VCOL from './IllumVertColor.wgsl'
import { TextureModifier } from './TexMod'
import { type FeatureFlag, getShaderConstants, MaterialLayerMasks } from './common'

import { MtlFlag } from './types'
import { MtlUtil, paramVec4, paramVec3, paramValue } from './utils'

export function illumShaderOptions(constants: Record<string, number>): ShaderModuleOptions {
  return {
    name: 'Illum Shader',
    wgsl: {
      source: constants['VERTCOLORS'] ? WGSL_VCOL : WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
    },
    glsl: null,
  }
}

export function illumEffectOptions(constants: Record<string, number>): EffectOptions {
  return {
    name: 'Illum Effect',
    meta: {},
    program: {
      shader: illumShaderOptions(constants),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceTransformBlock: 'object',
    },
  }
}

interface PublicParams {
  BackDiffuseMultiplier: string //      | number | 1361  |
  BlendFactor: string //                | number | 27121 |
  BlendFalloff: string //               | number | 27121 |
  BlendLayer2Diffuse: string //         | vec3   | 27100 |
  BlendLayer2Smoothness: string //      | number | 27099 |
  BlendLayer2Specular: string //        | number | 27121 |
  BlendLayer2Tiling: string //          | number | 27121 |
  BlendMaskTiling: string //            | number | 27121 |
  ColorMaskAlphaInf: string //          | number | 4445  |
  ColorMaskOverride: string //          | number | 4445  |
  ColorMaskStrength: string //          | number | 4445  |
  DecalAlphaMult: string //             | number | 1597  |
  DecalDiffuseOpacity: string //        | number | 1597  |
  DecalFalloff: string //               | number | 1597  |
  DepthFixupThreshold: string //        | number | 19    |
  DetailBumpScale: string //            | number | 26130 |
  DetailDiffuseScale: string //         | number | 26130 |
  DetailGlossScale: string //           | number | 26130 |
  DissolveColor: string //              | vec4   | 1208  |
  DissolveEdgeThickness: string //      | number | 1208  |
  DissolvePercentage: string //         | number | 1208  |
  EmittanceMapGamma: string //          | number | 81849 |
  FresnelBias: string //                | number | 22    |
  FresnelPower: string //               | number | 10    |
  FresnelScale: string //               | number | 22    |
  GlossFromDiffuseAmount: string //     | number | 22    |
  GlossFromDiffuseBrightness: string // | number | 22    |
  GlossFromDiffuseContrast: string //   | number | 22    |
  GlossFromDiffuseOffset: string //     | number | 22    |
  HeightBias: string //                 | number | 8591  |
  IndirectColor: string //              | vec3   | 90411 |
  Mask_A_Color: string //               | vec3   | 260   |
  Mask_A_Gloss: string //               | number | 9904  |
  Mask_A_GlossShift: string //          | number | 9527  |
  Mask_A_SpecColor_Override: string //  | number | 9398  |
  Mask_A_SpecColor: string //           | vec4   | 9644  |
  Mask_A_SpecColorOverride: string //   | number | 246   |
  Mask_A: string //                     | number | 117   |
  Mask_B_Color: string //               | vec3   | 9904  |
  Mask_B_Override: string //            | number | 9644  |
  Mask_B: string //                     | number | 9644  |
  Mask_G_Color: string //               | vec3   | 9904  |
  Mask_G_Override: string //            | number | 9644  |
  Mask_G: string //                     | number | 9644  |
  Mask_R_Color: string //               | vec3   | 9904  |
  Mask_R_Override: string //            | number | 9644  |
  Mask_R: string //                     | number | 9644  |
  NormalViewDependency: string //       | number | 1347  |
  ObmDisplacement: string //            | number | 2485  |
  PomDisplacement: string //            | number | 8381  |
  Rim_Blend_Center_Alpha: string //     | number | 2     |
  Rim_Blend_Center_Color: string //     | vec4   | 2     |
  Rim_Blend_Color_Blend: string //      | number | 2     |
  Rim_Blend_Fill_Alpha: string //       | number | 2     |
  Rim_Blend_Fill_Color: string //       | vec4   | 2     |
  Rim_Blend_Fill_Width: string //       | number | 2     |
  Rim_Blend_Major_Alpha: string //      | number | 2     |
  Rim_Blend_Major_Color: string //      | vec4   | 2     |
  Rim_Blend_Major_Width: string //      | number | 2     |
  Rim_Blend_Smoothness: string //       | number | 2     |
  Rim_Center_Color: string //           | vec4   | 515   |
  Rim_Center_Intensity: string //       | number | 515   |
  Rim_Color_Blend: string //            | number | 515   |
  Rim_Fill_Color: string //             | vec4   | 515   |
  Rim_Fill_Intensity: string //         | number | 515   |
  Rim_Fill_Width: string //             | number | 515   |
  Rim_Major_Color: string //            | vec4   | 515   |
  Rim_Major_Intensity: string //        | number | 515   |
  Rim_Major_Width: string //            | number | 515   |
  Rim_Smoothness: string //             | number | 515   |
  RoughnessBoost: string //             | number | 2362  |
  RoughnessMaxFootprint: string //      | number | 2362  |
  SelfShadowStrength: string //         | number | 8591  |
  SSSIndex: string //                   | number | 88792 |
  SSSSpecularCutoff: string //          | number | 531   |
  TessellationDispBias: string //       | number | 42    |
  TessellationFaceCull: string //       | number | 45    |
  TessellationFactor: string //         | number | 45    |
  TessellationFactorMax: string //      | number | 45    |
  TessellationFactorMin: string //      | number | 45    |
  TessellationHeightScale: string //    | number | 42    |
  TransmittanceColor: string //         | vec4   | 1347  |
}

const illum = new MtlUtil('Illum', {
  knowsDeform: true,
  knownMaps: [
    '[1] Custom',
    'Bumpmap',
    'Custom',
    'Decal',
    'Detail',
    'Diffuse',
    'Emittance',
    'Heightmap',
    'Occlusion',
    'Opacity',
    'SecondSmoothness',
    'Smoothness',
    'Specular',
    'Specular2',
  ],
  knownMods: ['Diffuse', 'Custom', 'Decal', 'Detail', 'Emittance'],
  knownFlags: [
    'BLENDLAYER',
    'COLOR_SAMPLER_OVERLAY_MASK',
    'DECAL',
    'DETAIL_MAPPING',
    'EMISSIVE_DECAL',
    'EMITTANCE_MAP',
    'NORMAL_MAP',
    'OCCLUSION_MAP',
    'OFFSET_BUMP_MAPPING',
    'OVERLAY_MASK',
    'PARALLAX_OCCLUSION_MAPPING',
    'SAA_FILTERING',
    'SPECULAR_MAP',
    'TRANSMITTANCE',
    'VERTCOLORS',
  ],
})

export class IllumMaterial extends materialSchemaClass(SCHEMA) {
  private modDiffuse: TextureModifier | null = null
  private modCustom: TextureModifier | null = null
  private modDetail: TextureModifier | null = null
  private modEmittance: TextureModifier | null = null
  private modDecalEmissive: TextureModifier | null = null

  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'Illum Material',
      effect: null,
      meta: options,
    })

    const { params, attrs, texMaps, texMods, shaderFlags, deformWave0, deformWave1 } = illum.resolve<PublicParams>(
      options?.properties,
    )
    this.name = `${attrs.Shader} (${attrs.Name})`

    // #if %BLENDLAYER
    //   #if %DIRTLAYER
    //     #undefine %DIRTLAYER
    //   #endif
    //   #if %DECAL
    //     #undefine %DECAL
    //   #endif
    //   #if %RIM_DIFFUSE_LIGHTING
    //     #undefine %RIM_DIFFUSE_LIGHTING
    //   #endif
    //   #if %RIM_SPEC_LIGHTING
    //     #undefine %RIM_SPEC_LIGHTING
    //   #endif
    //   #if %RIM_BLEND
    //     #undefine %RIM_BLEND
    //   #endif
    //   #if %OVERLAY_MASK
    //     #undefine %OVERLAY_MASK
    //   #endif
    //   #if %COLOR_SAMPLER_OVERLAY_MASK
    //     #undefine %COLOR_SAMPLER_OVERLAY_MASK
    //   #endif
    // #endif
    if (shaderFlags.has('BLENDLAYER')) {
      shaderFlags.delete('DIRTLAYER')
      shaderFlags.delete('DECAL')
      shaderFlags.delete('RIM_DIFFUSE_LIGHTING')
      shaderFlags.delete('RIM_SPEC_LIGHTING')
      shaderFlags.delete('RIM_BLEND')
      shaderFlags.delete('OVERLAY_MASK')
      shaderFlags.delete('COLOR_SAMPLER_OVERLAY_MASK')
    }

    // #if %DECAL
    //   #if %SUBSURFACE_SCATTERING
    //     #undefine %SUBSURFACE_SCATTERING
    //   #endif
    // #endif
    if (shaderFlags.has('DECAL')) {
      shaderFlags.delete('SUBSURFACE_SCATTERING')
    }

    // #if %NORMAL_MAP && %DETAIL_MAPPING && %FX_DISSOLVE && %BLENDLAYER && %EMITTANCE_MAP && %SUBSURFACE_SCATTERING && %ALLOW_SPECULAR_ANTIALIASING && %TRANSMITTANCE
    // 	#undefine %TRANSMITTANCE
    // #endif
    // #if %NORMAL_MAP && %SPECULAR_MAP && %DETAIL_MAPPING && %BLENDLAYER && %EMITTANCE_MAP && %SUBSURFACE_SCATTERING
    // 	#undefine %DETAIL_MAPPING
    // #endif
    // #if %NORMAL_MAP && %DETAIL_MAPPING && %BLENDLAYER && %EMITTANCE_MAP && %SUBSURFACE_SCATTERING && %ALLOW_SPECULAR_ANTIALIASING && %TRANSMITTANCE
    // 	#undefine %TRANSMITTANCE
    // #endif

    const shaderConst = getShaderConstants(shaderFlags)

    this.effects[RenderVariant.Forward] = new Effect(device, illumEffectOptions(shaderConst))
    this.effect.cullState = CullState.CullBack
    this.effect.blendState = BlendState.Opaque
    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_2SIDED) {
      this.effect.cullState = CullState.None
    }

    this.layer = MaterialLayerMasks.Illum
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)
    this.DeformWave0 = deformWave0
    this.DeformWave1 = deformWave1

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_ADDITIVE) {
      // never seen
    }

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_NODRAW) {
      this.noRender = true
    }

    if (!(attrs.MtlFlags & MtlFlag.MTL_FLAG_NOSHADOW) && !attrs.Opacity) {
      // shadow proxy
      // https://www.cryengine.com/docs/static/engines/cryengine-3/categories/1114113/pages/21268752
      this.noRender = true
    }
  }

  private setDefaults() {
    this.DiffuseColor = Vec4.create(1, 1, 1, 1)
    this.SpecularColor = Vec4.create(1, 1, 1, 1)
    this.EmissiveColor = Vec4.create()
    this.DetailTiling = Vec2.create(1, 1)

    this.EmittanceMapGamma = 1.0
    this.ObmDisplacement = 0.004
    this.DepthFixupThreshold = 0.05
    this.PomDisplacement = 0.025

    this.HeightBias = 1.0
    this.SelfShadowStrength = 3.0

    this.DetailBumpScale = 0.5
    this.DetailDiffuseScale = 0.5
    this.DetailGlossScale = 0.5
    this.BackDiffuseMultiplier = 1.0

    this.SssIndex = 0
    this.DecalFalloff = 1.0
    this.DecalAlphaMult = 1.0
    this.DecalDiffuseOpacity = 1.0

    this.SssSpecularCutoff = 1.0
    this.NormalViewDependency = 0.0

    this.TransmittanceColor = Vec4.create(1, 1, 0.6, 1.0)
    this.RoughnessBoost = 2.0
    this.RoughnessMaxFootprint = 0.3
    this.DissolvePercentage = 0
    this.DissolveEdgeThickness = 0
    this.DissolveColor = Vec4.create(1, 1, 1, 1)

    this.BlendMaskTiling = 1.0
    this.BlendFactor = 8.0
    this.BlendLayer2Tiling = 1.0
    this.BlendFalloff = 32
    this.BlendLayer2Smoothness = 10
    this.BlendLayer2Specular = Vec4.create(0.23, 0.23, 0.23, 0)
    this.BlendLayer2Diffuse = Vec4.create(1, 1, 1, 1)

    this.RimMajorColor = Vec4.create(1, 1, 1, 1)
    this.RimMajorIntensity = 1
    this.RimMajorWidth = 1
    this.RimFillIntensity = 0.4
    this.RimFillWidth = 1
    this.RimFillColor = Vec4.create(1, 1, 1, 1)
    this.RimSmoothness = 1

    this.UvModDiffuse = Mat4.createIdentity()
    this.UvModCustom = Mat4.createIdentity()
    this.UvModDetail = Mat4.createIdentity()
    this.UvModEmittance = Mat4.createIdentity()
    this.UvModDecalEmissive = Mat4.createIdentity()

    this.SamplerLinear = SamplerState.LinearWrap
    this.SamplerPoint = SamplerState.PointWrap
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    if (!maps) {
      return
    }

    // == EFTT_DIFFUSE
    // - diffuseMap
    // - diffuseMap_Decal
    if (maps.Diffuse) {
      this.DiffuseMap = maps.Diffuse as any
    }

    // == EFTT_NORMALS
    // - normalMap
    if (maps.Bumpmap) {
      this.NormalMap = maps.Bumpmap as any
    }

    // == EFTT_SPECULAR
    // - specularMap
    if (maps.Specular) {
      this.SpecularMap = maps.Specular as any
    }

    // == EFTT_ENV
    // - envMap
    if (maps.Environment) {
      // TODO:
    }

    // == EFTT_DETAIL_OVERLAY
    // - detailMap
    if (maps.Detail) {
      this.DetailMap = maps.Detail as any
    }

    // == EFTT_SECOND_SMOOTHNESS
    // - translucencyMap
    if (maps.SecondSmoothness) {
      this.TranslucencyMap = maps.SecondSmoothness as any
    }

    // == EFTT_HEIGHT
    // - heightMap
    if (maps.Heightmap) {
      this.HeightMap = maps.Heightmap as any
    }

    // == EFTT_DECAL_OVERLAY
    // - decalMap
    // - emissiveIntensity
    if (maps.Decal) {
      this.DecalEmissiveMap = maps.Decal as any
    }

    // == EFTT_SUBSURFACE
    // - subsurfaceMap
    // - HeightMap2
    if (maps.SubSurface) {
      this.SubsurfaceMap = maps.SubSurface as any
    }

    // == EFTT_CUSTOM
    // - DiffuseMap2
    if (maps.Custom) {
      this.DiffuseMap2 = maps.Custom as any
    }

    // == EFTT_CUSTOM_SECONDARY
    // - BumpMap2
    if (maps['[1] Custom']) {
      this.NormalMap2 = maps['[1] Custom'] as any
    }

    // == EFTT_OPACITY
    // - opacityMap
    // - BlendMap
    // - DecalOpacityMap
    if (maps.Opacity) {
      this.OpacityMap = maps.Opacity as any
    }

    // == EFTT_SMOOTHNESS
    // - smoothnessMap
    if (maps.Smoothness) {
      this.SmoothnessMap = maps.Smoothness as any
    }

    // == EFTT_EMITTANCE
    // - emittanceMap
    if (maps.Emittance) {
      this.EmittanceMap = maps.Emittance as any
    }

    // == EFTT_OCCLUSION
    // - OcclusionMap
    if (maps.Occlusion) {
      this.OcclusionMap = maps.Occlusion as any
    }

    // == EFTT_SPECULAR_2
    // - SpecularMap2
    if (maps.Specular2) {
      this.SpecularMap2 = maps.Specular2 as any
    }
  }

  private setModifiers(mods: NwMaterialProps['mods']) {
    if (!mods) {
      return
    }

    if (TextureModifier.isModified(mods.Diffuse)) {
      this.modDiffuse = new TextureModifier(mods.Diffuse)
      this.EnabledUvModDiffuse = TRUE
      this.updateModDiffuse(0)
    }

    if (TextureModifier.isModified(mods.Custom)) {
      this.modCustom = new TextureModifier(mods.Custom)
      this.EnabledUvModCustom = TRUE
      this.updateModCustom(0)
    }

    if (TextureModifier.isModified(mods.Detail)) {
      this.modDetail = new TextureModifier(mods.Detail)
      this.EnabledUvModDetail = TRUE
      this.updateModDetail(0)
    }

    if (TextureModifier.isModified(mods.Emittance)) {
      this.modEmittance = new TextureModifier(mods.Emittance)
      this.EnabledUvModEmittance = TRUE
      this.updateModEmittance(0)
    }

    if (TextureModifier.isModified(mods.Decal)) {
      this.modDecalEmissive = new TextureModifier(mods.Decal)
      this.EnabledUvModDecalEmissive = TRUE
      this.updateModDecalEmissive(0)
    }
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    if (attrs.Diffuse) {
      this.DiffuseColor = paramVec4(attrs.Diffuse)
    }

    if (attrs.Specular) {
      this.SpecularColor = paramVec4(attrs.Specular)
    }

    if (attrs.Emissive) {
      this.EmissiveColor = paramVec4(attrs.Emissive)
    }

    if (attrs.Emittance) {
      this.EmissiveColor = paramVec4(attrs.Emittance)
    }

    if (attrs.AlphaTest < 1) {
      this.AlphaTestRef = attrs.AlphaTest
      this.EnabledAlphaTest = TRUE
    }

    if (attrs.Opacity < 1 || flags.has('DECAL')) {
      let opacity = attrs.Opacity ?? 1
      this.DecalDiffuseOpacity = opacity
      this.DiffuseColor.w = opacity
      this.isTransparent = !this.EnabledAlphaTest
      this.EnabledAlphaBlend = TRUE
      this.effect.blendState = BlendState.Alpha
      this.effect.depthState = DepthState.GreaterEqualNoWrite
    }

    if (attrs.Shininess) {
      this.SpecularColor.w = attrs.Shininess / 255
    }
  }

  private setPublicParams(params: PublicParams) {
    // this.IndirectColor = paramColor(para.IndirectColor, this.IndirectColor)
    this.SssIndex = paramValue(params.SSSIndex, this.SssIndex)
    this.EmittanceMapGamma = paramValue(params.EmittanceMapGamma, this.EmittanceMapGamma)
    this.BlendMaskTiling = paramValue(params.BlendMaskTiling, this.BlendMaskTiling)
    this.BlendFactor = paramValue(params.BlendFactor, this.BlendFactor)
    this.BlendFalloff = paramValue(params.BlendFalloff, this.BlendFalloff)
    this.BlendLayer2Tiling = paramValue(params.BlendLayer2Tiling, this.BlendLayer2Tiling)
    this.BlendLayer2Specular = paramVec4(params.BlendLayer2Specular, this.BlendLayer2Specular)
    this.BlendLayer2Diffuse = paramVec4(params.BlendLayer2Diffuse, this.BlendLayer2Diffuse)
    this.BlendLayer2Smoothness = paramValue(params.BlendLayer2Smoothness, this.BlendLayer2Smoothness)
    this.DetailGlossScale = paramValue(params.DetailGlossScale, this.DetailGlossScale)
    this.DetailBumpScale = paramValue(params.DetailBumpScale, this.DetailBumpScale)
    this.DetailDiffuseScale = paramValue(params.DetailDiffuseScale, this.DetailDiffuseScale)
    // TODO: Mask params
    this.SelfShadowStrength = paramValue(params.SelfShadowStrength, this.SelfShadowStrength)
    this.HeightBias = paramValue(params.HeightBias, this.HeightBias)
    this.PomDisplacement = paramValue(params.PomDisplacement, this.PomDisplacement)
    this.ColorMaskOverride = paramValue(params.ColorMaskOverride, this.ColorMaskOverride)
    this.ColorMaskStrength = paramValue(params.ColorMaskStrength, this.ColorMaskStrength)
    this.ColorMaskAlphaInf = paramValue(params.ColorMaskAlphaInf, this.ColorMaskAlphaInf)
    this.ObmDisplacement = paramValue(params.ObmDisplacement, this.ObmDisplacement)
    this.RoughnessBoost = paramValue(params.RoughnessBoost, this.RoughnessBoost)
    this.RoughnessMaxFootprint = paramValue(params.RoughnessMaxFootprint, this.RoughnessMaxFootprint)
    this.DecalDiffuseOpacity = paramValue(params.DecalDiffuseOpacity, this.DecalDiffuseOpacity)
    this.DecalFalloff = paramValue(params.DecalFalloff, this.DecalFalloff)
    this.DecalAlphaMult = paramValue(params.DecalAlphaMult, this.DecalAlphaMult)
    this.BackDiffuseMultiplier = paramValue(params.BackDiffuseMultiplier, this.BackDiffuseMultiplier)
    this.NormalViewDependency = paramValue(params.NormalViewDependency, this.NormalViewDependency)
    this.TransmittanceColor = paramVec4(params.TransmittanceColor, this.TransmittanceColor)
    this.DissolveColor = paramVec4(params.DissolveColor, this.DissolveColor)
    this.DissolveEdgeThickness = paramValue(params.DissolveEdgeThickness, this.DissolveEdgeThickness)
    this.DissolvePercentage = paramValue(params.DissolvePercentage, this.DissolvePercentage)
    this.SssSpecularCutoff = paramValue(params.SSSSpecularCutoff, this.SssSpecularCutoff)
    this.RimMajorWidth = paramValue(params.Rim_Major_Width, this.RimMajorWidth)
    this.RimMajorIntensity = paramValue(params.Rim_Major_Intensity, this.RimMajorIntensity)
    this.RimMajorColor = paramVec4(params.Rim_Major_Color, this.RimMajorColor)
    this.RimSmoothness = paramValue(params.Rim_Smoothness, this.RimSmoothness)

    // this.RimCenterIntensity = paramValue(para.Rim_Center_Intensity, this.RimCenterIntensity)
    this.RimFillIntensity = paramValue(params.Rim_Fill_Intensity, this.RimFillIntensity)
    // this.RimCenterColor = paramColor(para.Rim_Center_Color, this.RimCenterColor)
    this.RimFillWidth = paramValue(params.Rim_Fill_Width, this.RimFillWidth)
    this.RimFillColor = paramVec4(params.Rim_Fill_Color, this.RimFillColor)

    // this.RimColorBlend = paramValue(para.Rim_Color_Blend, this.RimColorBlend)
    // this.TessellationFactorMax = paramValue(para.TessellationFactorMax, this.TessellationFactorMax)
    // this.TessellationFaceCull = paramValue(para.TessellationFaceCull, this.TessellationFaceCull
    // this.TessellationFactor = paramValue(para.TessellationFactor, this.TessellationFactor)
    // this.TessellationFactorMin = paramValue(para.TessellationFactorMin, this.TessellationFactorMin)
    // this.TessellationDispBias = paramValue(para.TessellationDispBias, this.TessellationDispBias)
    // this.TessellationHeightScale = paramValue(para.TessellationHeightScale, this.TessellationHeightScale)
    // this.FresnelScale = paramValue(para.FresnelScale, this.FresnelScale)
    // this.FresnelBias = paramValue(para.FresnelBias, this.FresnelBias
    // this.GlossFromDiffuseBrightness = paramValue(para.GlossFromDiffuseBrightness, this.GlossFromDiffuseBrightness)
    // this.GlossFromDiffuseOffset = paramValue(para.GlossFromDiffuseOffset, this.GlossFromDiffuseOffset)
    // this.GlossFromDiffuseAmount = paramValue(para.GlossFromDiffuseAmount, this.GlossFromDiffuseAmount)
    // this.GlossFromDiffuseContrast = paramValue(para.GlossFromDiffuseContrast, this.GlossFromDiffuseContrast)
    this.DepthFixupThreshold = paramValue(params.DepthFixupThreshold, this.DepthFixupThreshold)

    // this.FresnelPower = paramValue(para.FresnelPower, this.FresnelPower)
    // this.RimBlendFillColor = paramColor(para.Rim_Blend_Fill_Color, this.RimBlendFillColor)
    // this.RimBlendMajorAlpha = paramValue(para.Rim_Blend_Major_Alpha, this.RimBlendMajorAlpha

    // this.RimBlendMajorWidth = paramValue(para.Rim_Blend_Major_Width, this.RimBlendMajorWidth)
    // this.RimBlendFillAlpha = paramValue(para.Rim_Blend_Fill_Alpha, this.RimBlendFillAlpha)
    // this.RimBlendColorBlend = paramValue(para.Rim_Blend_Color_Blend, this.RimBlendColorBlend

    // this.RimBlendMajorColor = paramColor(para.Rim_Blend_Major_Color, this.RimBlendMajorColor)
    // this.RimBlendCenterColor = paramColor(para.Rim_Blend_Center_Color, this.RimBlendCenterColor)
    // this.RimBlendFillWidth = paramValue(para.Rim_Blend_Fill_Width, this.RimBlendFillWidth

    // this.RimBlendCenterAlpha = paramValue(para.Rim_Blend_Center_Alpha, this.RimBlendCenterAlpha)
    // this.RimBlendSmoothness = paramValue(para.Rim_Blend_Smoothness, this.RimBlendSmoothness)
    this.MaskR = paramValue(params.Mask_R, this.MaskR)
    this.MaskROverride = paramValue(params.Mask_R_Override, this.MaskROverride)
    this.MaskRColor = paramVec3(params.Mask_R_Color, this.MaskRColor)
    this.MaskG = paramValue(params.Mask_G, this.MaskG)
    this.MaskGOverride = paramValue(params.Mask_G_Override, this.MaskGOverride)
    this.MaskGColor = paramVec3(params.Mask_G_Color, this.MaskGColor)
    this.MaskB = paramValue(params.Mask_B, this.MaskB)
    this.MaskBOverride = paramValue(params.Mask_B_Override, this.MaskBOverride)
    this.MaskBColor = paramVec3(params.Mask_B_Color, this.MaskBColor)
    this.MaskA = paramValue(params.Mask_A, this.MaskA)
    // TODO: Mask_A_Color isn't actually used?
    this.MaskASpecColor = paramVec3(params.Mask_A_Color, this.MaskASpecColor)
    this.MaskAGloss = paramValue(params.Mask_A_Gloss, this.MaskAGloss)
    this.MaskAGlossShift = paramValue(params.Mask_A_GlossShift, this.MaskAGlossShift)
    this.MaskASpecColor = paramVec3(params.Mask_A_SpecColor, this.MaskASpecColor)
    this.MaskASpecColorOverride = paramValue(params.Mask_A_SpecColor_Override, this.MaskASpecColorOverride)
  }

  private frame: number
  public update(time: number, delta: number, frame: number) {
    if (this.frame === frame) {
      return
    }
    this.frame = frame

    if (this.modDiffuse && this.modDiffuse.isAnimated) {
      this.updateModDiffuse(time)
    }

    if (this.modCustom && this.modCustom.isAnimated) {
      this.updateModCustom(time)
    }

    if (this.modDetail && this.modDetail.isAnimated) {
      this.updateModDetail(time)
    }

    if (this.modEmittance && this.modEmittance.isAnimated) {
      this.updateModEmittance(time)
    }

    if (this.modDecalEmissive && this.modDecalEmissive.isAnimated) {
      this.updateModDecalEmissive(time)
    }
  }

  private updateModDiffuse(time: number) {
    this.modDiffuse.update(time)
    this.UvModDiffuse = this.modDiffuse.matrix
  }
  private updateModCustom(time: number) {
    this.modCustom.update(time)
    this.UvModCustom = this.modCustom.matrix
  }
  private updateModDetail(time: number) {
    this.modDetail.update(time)
    this.UvModDetail = this.modDetail.matrix
  }
  private updateModEmittance(time: number) {
    this.modEmittance.update(time)
    this.UvModEmittance = this.modEmittance.matrix
  }
  private updateModDecalEmissive(time: number) {
    this.modDecalEmissive.update(time)
    this.UvModDecalEmissive = this.modDecalEmissive.matrix
  }
}
