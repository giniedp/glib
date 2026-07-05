import {
  BlendState,
  CommonBlocks,
  CullState,
  DepthState,
  Device,
  materialSchemaClass,
  SamplerState,
  TRUE,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Mat4, Vec4 } from '@gglib/math'
import { Noise3DKey } from '../content'
import SCHEMA from './GeometryfogMaterial.meta'
import WGSL from './GeometryfogMaterial.wgsl'
import type { NwMaterialProps } from './GltfExtension'
import { TextureModifier } from './TexMod'
import { getShaderConstants, MaterialLayerMasks, type FeatureFlag } from './common'
import { MtlUtil, paramVec4, paramValue } from './utils'

export function geometryfogShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Geometryfog Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function geometryfogEffectOptions(): EffectOptions {
  return {
    name: 'Geometryfog Effect',
    meta: {},
    program: {
      shader: geometryfogShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceTransformBlock: 'object',
    },
  }
}

type PublicParams = {
  AmbStrength: string //  1
  baseUVScale: string //  1
  BeamLength: string // 1
  dustTimeScale: string //  1
  dustUVScale: string //  1
  EndColor: string // 4
  EndRadius: string // 1
  fadingFeaturing: string //  1
  farFadeSize: string //  1
  farFadeStart: string //  1
  FinalMultiplier: string // 1
  nearFadeSize: string //  1
  nearFadeStart: string //  1
  OrigLength: string // 1
  OrigWidth: string // 1
  SoftIntersectionFactor: string // 1
  StartColor: string // 4
  StartRadius: string // 1
  turbRatio: string //  1
  turbStrength: string //  1
  uvRot: string //  1
  viewDependencyFactor: string // 1
}

const util = new MtlUtil('GeometryFog', {
  knownMaps: ['Diffuse', 'Specular', 'Detail'],
  knownMods: ['Diffuse'],
  knownFlags: ['NOISE', 'USE_AS_BEAMPROC'],
})

export class GeometryFogMaterial extends materialSchemaClass(SCHEMA) {
  private mod1: TextureModifier | null = null

  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'Geometryfog Material',
      effect: geometryfogEffectOptions(),
      meta: options,
    })

    const { attrs, params, texMaps, texMods, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    this.isTransparent = true
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.AdditiveAlpha
    this.layer = MaterialLayerMasks.GeometryFog

    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)

    // this.UvTransform1 = Mat4.createIdentity()
    // this.UvTransform2 = Mat4.createIdentity()
  }

  private setDefaults() {
    this.NoiseMap3D =
      this.device[Noise3DKey] ||
      this.device.createTexture({
        name: 'noise3D',
        type: 'Texture3D',
        width: 16,
        height: 16,
        depth: 16,
        format: 'RGBA8_UNORM',
      })

    this.TextureSampler = SamplerState.LinearWrap

    this.UvTransform1 = Mat4.createIdentity()
    this.FinalMultiplier = 1
    this.SoftIntersectionFactor = 1
    this.ViewDependencyFactor = 2.0
    this.StartColor = Vec4.create(1, 1, 1, 1)
    this.EndColor = Vec4.create(1, 1, 1, 0)
    this.DiffuseColor = Vec4.create(1, 1, 1, 1)

    this.FadingFeaturing = 0.55
    this.DustUVScale = 0.6
    this.DustTimeScale = 1.0
    this.TurbStrength = 1.0
    this.TurbRatio = 0.55
    this.UvRot = 0
    this.VolumetricScale = 0.7
    this.UvVigFeaturing = 4.0

    this.AmbStrength = 0.12
    this.BaseUVScale = 1.0
    this.NearFadeStart = 0.0
    this.NearFadeSize = 2.0
    this.FarFadeStart = 100.0
    this.FarFadeSize = 50.0

    this.BeamLength = 10.0
    this.OrigLength = 10.0
    this.OrigWidth = 1.0
    this.StartRadius = 1.0
    this.EndRadius = 2.0
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    if (maps.Diffuse) {
      this.DiffuseMap = maps.Diffuse as any
    }
    if (maps.Specular) {
      this.SpecularMap = maps.Specular as any
    }
    if (maps.Detail) {
      this.NormalMap = maps.Detail as any
    }
  }

  private setModifiers(mods: NwMaterialProps['mods']) {
    if (mods.Diffuse && TextureModifier.isModified(mods.Diffuse)) {
      this.mod1 = new TextureModifier(mods.Diffuse)
      this.updateMod1(0)
      this.EnabledUvTransform1 = TRUE
    }
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    this.DiffuseColor = paramVec4(attrs.Diffuse, Vec4.One)

    if (flags.has('NOISE')) {
      this.EnabledNoise = TRUE
    }
    if (flags.has('USE_AS_BEAMPROC')) {
      this.EnabledUseAsBeamProc = TRUE
    }
  }

  private setPublicParams(params: PublicParams) {
    this.AmbStrength = paramValue(params.AmbStrength, this.AmbStrength)
    this.BaseUVScale = paramValue(params.baseUVScale, this.BaseUVScale)
    this.BeamLength = paramValue(params.BeamLength, this.BeamLength)
    this.DustTimeScale = paramValue(params.dustTimeScale, this.DustTimeScale)
    this.DustUVScale = paramValue(params.dustUVScale, this.DustUVScale)
    this.EndColor = paramVec4(params.EndColor, this.EndColor)
    this.EndRadius = paramValue(params.EndRadius, this.EndRadius)
    this.FadingFeaturing = paramValue(params.fadingFeaturing, this.FadingFeaturing)
    this.FarFadeSize = paramValue(params.farFadeSize, this.FarFadeSize)
    this.FarFadeStart = paramValue(params.farFadeStart, this.FarFadeStart)
    this.FinalMultiplier = paramValue(params.FinalMultiplier, this.FinalMultiplier)
    this.NearFadeSize = paramValue(params.nearFadeSize, this.NearFadeSize)
    this.NearFadeStart = paramValue(params.nearFadeStart, this.NearFadeStart)
    this.OrigLength = paramValue(params.OrigLength, this.OrigLength)
    this.OrigWidth = paramValue(params.OrigWidth, this.OrigWidth)
    this.SoftIntersectionFactor = paramValue(params.SoftIntersectionFactor, this.SoftIntersectionFactor)
    this.StartColor = paramVec4(params.StartColor, this.StartColor)
    this.StartRadius = paramValue(params.StartRadius, this.StartRadius)
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

    if (this.mod1 && this.mod1.isAnimated) {
      this.updateMod1(time)
    }
  }

  private updateMod1(time: number) {
    this.mod1.update(time)
    this.UvTransform1 = this.mod1.matrix
  }
}
