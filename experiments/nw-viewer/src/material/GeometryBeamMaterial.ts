import {
  BlendState,
  CommonBlocks,
  CullState,
  DepthState,
  Device,
  Effect,
  materialSchemaClass,
  RenderVariant,
  SamplerState,
  ShaderConstants,
  TRUE,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Mat4, vec4, Vec4 } from '@gglib/math'
import { Noise3DKey } from '../content'
import SCHEMA from './GeometryBeamMaterial.meta'
import WGSL from './GeometryBeamMaterial.wgsl'
import type { NwMaterialProps } from './GltfExtension'
import { TextureModifier } from './TexMod'
import { getShaderConstants, MaterialLayerMasks, type FeatureFlag } from './common'
import { MtlUtil, paramVec4, paramValue } from './utils'

export function geometryBeamShaderOptions(constants: Record<string, number>): ShaderModuleOptions {
  return {
    name: 'Geometry Beam Shader',
    wgsl: {
      source: WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
    },
    glsl: null,
  }
}

export function geometryBeamEffectOptions(constants: Record<string, number>): EffectOptions {
  return {
    name: 'Geometry Beam Effect',
    meta: {},
    program: {
      shader: geometryBeamShaderOptions(constants),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceTransformBlock: 'object',
    },
  }
}

type PublicParams = {
  AmbStrength: string //               | number
  fadingFeaturing: string //           | number
  SoftIntersectionFactor: string //    | number
  StartColor: string //                | vec4
  FinalMultiplier: string //           | number
  viewDependencyFactor: string //      | number
  baseUVScale: string //               | number
  EndColor: string //                  | vec4
  dustTimeScale: string //             | number
  uvRot: string //                     | number
  turbRatio: string //                 | number
  dustUVScale: string //               | number
  turbStrength: string //              | number
  BackgroudAlphaNoiseSpeedZ: string // | number
  BackgroudAlphaNoiseSpeedX: string // | number
  BackgroudAlphaNoiseSpeedY: string // | number
  FadeOutDistance: string //           | number
  SunColorInfluence: string //         | number
  uvVigFeaturing: string //            | number
  FogColorInfluence: string //         | number
  VolumetricScale: string //           | number
}

const util = new MtlUtil('Geometrybeam', {
  knowsDeform: true,
  knownMaps: ['Diffuse', 'Bumpmap', 'Specular', 'Smoothness'],
  knownMods: ['Diffuse'],
  knownFlags: [
    'APPLY_FOG_COLOR',
    'APPLY_SUN_COLOR',
    'ENABLE_FADEOUT',
    'GRADIENT_ALPHA',
    'NOISE',
    'UV_VIGNETTING',
    'VERTICAL_GRADIENT',
  ],
})
export class GeometryBeamMaterial extends materialSchemaClass(SCHEMA) {
  private modDiffuse: TextureModifier | null = null

  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'Geometry Beam Material',
      effect: null,
      meta: options,
    })

    const { attrs, params, texMaps, texMods, shaderFlags, deformWave0, deformWave1 } = util.resolve<PublicParams>(
      options?.properties,
    )
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    this.effects[RenderVariant.Forward] = new Effect(device, geometryBeamEffectOptions(shaderConst))
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.AdditiveAlpha
    this.isTransparent = true

    this.layer = MaterialLayerMasks.GeometryBeam
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)
    this.DeformWave0 = deformWave0
    this.DeformWave1 = deformWave1
  }

  private setDefaults() {
    this.Noise3DTex =
      this.device[Noise3DKey] ||
      this.device.createTexture({
        name: 'noise3D',
        type: 'Texture3D',
        width: 16,
        height: 16,
        depth: 16,
        format: 'RGBA8_UNORM',
      })

    this.SamplerLinear = SamplerState.LinearWrap
    this.SamplerPoint = SamplerState.PointWrap

    this.DiffuseColor = Vec4.create(1, 1, 1, 1)
    this.StartColor = new Vec4(1.0, 1.0, 1.0, 1.0)
    this.EndColor = new Vec4(1.0, 1.0, 1.0, 1.0)
    this.FinalMultiplier = 1.0
    this.SoftIntersectionFactor = 1.0
    this.ViewDependencyFactor = 2.0
    this.FadingFeaturing = 0.55
    this.AmbStrength = 0.12
    this.BaseUVScale = 1.0
    this.DustUVScale = 0.6
    this.DustTimeScale = 1.0
    this.TurbStrength = 1.0
    this.TurbRatio = 0.55
    this.UvRot = 0.0
    this.BackgroundAlphaNoiseSpeedX = 0.1
    this.BackgroundAlphaNoiseSpeedY = 0.05
    this.BackgroundAlphaNoiseSpeedZ = 0.15
    this.UvVigFeaturing = 4.0
    this.VolumetricScale = 0.7
    this.SunColorInfluence = 0.5
    this.FogColorInfluence = 0.0
    this.FadeOutDistande = 0.2

    this.UvModDiffuse = Mat4.createIdentity()
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    if (!maps) {
      return
    }

    // NAME       count modCount
    // Diffuse    295   290
    // Specular   294   0
    // Bumpmap    29    0
    // Emittance  18    0
    // Heightmap  6     0
    // Smoothness 1     0
    if (maps.Diffuse) {
      this.DiffuseMap = maps.Diffuse as any
    }

    if (maps.Specular) {
      this.SpecularMap = maps.Specular as any
    }

    if (maps.Bumpmap) {
      this.NormalMap = maps.Bumpmap as any
    }

    if (maps.Smoothness) {
      this.SmoothnessMap = maps.Bumpmap as any
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

    // if (TextureModifier.isModified(mods.Custom)) {
    //   this.modCustom = new TextureModifier(mods.Custom)
    //   this.EnabledUvModCustom = TRUE
    //   this.updateModCustom(0)
    // }

    // if (TextureModifier.isModified(mods.Detail)) {
    //   this.modDetail = new TextureModifier(mods.Detail)
    //   this.EnabledUvModDetail = TRUE
    //   this.updateModDetail(0)
    // }

    // if (TextureModifier.isModified(mods.Emittance)) {
    //   this.modEmittance = new TextureModifier(mods.Emittance)
    //   this.EnabledUvModEmittance = TRUE
    //   this.updateModEmittance(0)
    // }

    // if (TextureModifier.isModified(mods.Decal)) {
    //   this.modDecalEmissive = new TextureModifier(mods.Decal)
    //   this.EnabledUvModDecalEmissive = TRUE
    //   this.updateModDecalEmissive(0)
    // }
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    this.DiffuseColor = paramVec4(attrs.Diffuse, Vec4.One)
  }

  private setPublicParams(params: PublicParams) {
    this.AmbStrength = paramValue(params.AmbStrength, this.AmbStrength)
    this.BackgroundAlphaNoiseSpeedX = paramValue(params.BackgroudAlphaNoiseSpeedX, this.BackgroundAlphaNoiseSpeedX)
    this.BackgroundAlphaNoiseSpeedY = paramValue(params.BackgroudAlphaNoiseSpeedY, this.BackgroundAlphaNoiseSpeedY)
    this.BackgroundAlphaNoiseSpeedZ = paramValue(params.BackgroudAlphaNoiseSpeedZ, this.BackgroundAlphaNoiseSpeedZ)
    this.EndColor = paramVec4(params.EndColor, this.EndColor)
    this.FadeOutDistande = paramValue(params.FadeOutDistance, this.FadeOutDistande)
    this.FinalMultiplier = paramValue(params.FinalMultiplier, this.FinalMultiplier)
    this.SoftIntersectionFactor = paramValue(params.SoftIntersectionFactor, this.SoftIntersectionFactor)
    this.StartColor = paramVec4(params.StartColor, this.StartColor)
    this.SunColorInfluence = paramValue(params.SunColorInfluence, this.SunColorInfluence)
    this.BaseUVScale = paramValue(params.baseUVScale, this.BaseUVScale)
    this.DustTimeScale = paramValue(params.dustTimeScale, this.DustTimeScale)
    this.DustUVScale = paramValue(params.dustUVScale, this.DustUVScale)
    this.FadingFeaturing = paramValue(params.fadingFeaturing, this.FadingFeaturing)
    this.TurbRatio = paramValue(params.turbRatio, this.TurbRatio)
    this.TurbStrength = paramValue(params.turbStrength, this.TurbStrength)
    this.UvRot = paramValue(params.uvRot, this.UvRot)
    this.ViewDependencyFactor = paramValue(params.viewDependencyFactor, this.ViewDependencyFactor)
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
  }

  private updateModDiffuse(time: number) {
    this.modDiffuse.update(time)
    this.UvModDiffuse = this.modDiffuse.matrix
  }
}
