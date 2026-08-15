import type { Device, EffectOptions } from '@gglib/graphics'
import {
  CommonBlocks,
  CommonInputs,
  CommonMaterialProps,
  CullState,
  FALSE,
  inputSlot,
  MaterialOptions,
  materialSchemaClass,
  SamplerState,
  TRUE,
  uvInfoToMat4,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Mat3, Mat4, vec3 } from '@gglib/math'
import { COMMON_EFFECT_GLSL_FS, COMMON_EFFECT_GLSL_VS } from './CommonMaterial.glsl'
import { COMMON_EFFECT_WGSL } from './CommonMaterial.wgsl'

export function commonShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Common Shader',
    wgsl: {
      source: COMMON_EFFECT_WGSL,
    },
    glsl: {
      vertex: COMMON_EFFECT_GLSL_VS,
      fragment: COMMON_EFFECT_GLSL_FS,
    },
  }
}

export function commonEffectOptions(): EffectOptions {
  return {
    name: 'Common Effect',
    meta: {},
    program: {
      shader: commonShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceDataBlock: null,
      perInstanceTransformBlock: null,
    },
  }
}

export const CommonMaterialSchema = {
  // global
  FogColor: inputSlot('global', 'fogColor', 'vec3'),
  FogNear: inputSlot('global', 'fogNear', 'scalar'),
  FogFar: inputSlot('global', 'fogFar', 'scalar'),

  // per view
  View: CommonInputs.View.ViewMatrix,
  Projection: CommonInputs.View.ProjectionMatrix,
  CameraPosition: CommonInputs.View.CameraPosition,

  // per object
  World: CommonInputs.Object.ModelMatrix,

  // material
  BaseColor: inputSlot('material', 'baseColor', 'vec3'),
  Alpha: inputSlot('material', 'alpha', 'scalar'),
  SpecularColor: inputSlot('material', 'specularColor', 'vec3'),
  SpecularWeight: inputSlot('material', 'specularWeight', 'scalar'),
  EmissiveColor: inputSlot('material', 'emissiveColor', 'vec3'),
  EmissiveStrength: inputSlot('material', 'emissiveStrength', 'scalar'),
  Metallic: inputSlot('material', 'metallic', 'scalar'),
  Roughness: inputSlot('material', 'roughness', 'scalar'),
  Ior: inputSlot('material', 'ior', 'scalar'),
  AlphaClip: inputSlot('material', 'alphaClip', 'scalar'),
  TextureMod: inputSlot('material', 'textureMod', 'mat4x4'),

  // settings
  UseFog: inputSlot('settings', 'useFog', 'scalar'),
  UseIBL: inputSlot('settings', 'useIBL', 'scalar'),
  UseLights: inputSlot('settings', 'useLights', 'scalar'),
  UseBaseMap: inputSlot('settings', 'useBaseMap', 'scalar'),
  UseNormalMap: inputSlot('settings', 'useNormalMap', 'scalar'),
  UseSpecularMap: inputSlot('settings', 'useSpecularMap', 'scalar'),
  UseSmoothnessMap: inputSlot('settings', 'useSmoothnessMap', 'scalar'),
  UseOcclusionMap: inputSlot('settings', 'useOcclusionMap', 'scalar'),
  UseEmissiveMap: inputSlot('settings', 'useEmissiveMap', 'scalar'),
  UseMetallicRoughnessMap: inputSlot('settings', 'useMetallicRoughnessMap', 'scalar'),
  UseTextureMod: inputSlot('settings', 'useTextureMod', 'scalar'),
  UseVertexColor: inputSlot('settings', 'useVertexColor', 'scalar'),
  UseVertexTangent: inputSlot('settings', 'useVertexTangent', 'scalar'),
  UseBlend: inputSlot('settings', 'useBlend', 'scalar'),

  // textures
  BaseMap: inputSlot('texture', 'baseMap', 'texture'),
  SpecularMap: inputSlot('texture', 'specularMap', 'texture'),
  SmoothnessMap: inputSlot('texture', 'smoothnessMap', 'texture'),
  NormalMap: inputSlot('texture', 'normalMap', 'texture'),
  OcclusionMap: inputSlot('texture', 'occlusionMap', 'texture'),
  EmissiveMap: inputSlot('texture', 'emissiveMap', 'texture'),
  MetallicRoughnessMap: inputSlot('texture', 'metallicRoughnessMap', 'texture'),

  BaseMapSampler: inputSlot('texture', 'baseMapSampler', 'sampler'),
  SpecularMapSampler: inputSlot('texture', 'specularMapSampler', 'sampler'),
  SmoothnessMapSampler: inputSlot('texture', 'smoothnessMapSampler', 'sampler'),
  NormalMapSampler: inputSlot('texture', 'normalMapSampler', 'sampler'),
  OcclusionMapSampler: inputSlot('texture', 'occlusionMapSampler', 'sampler'),
  EmissiveMapSampler: inputSlot('texture', 'emissiveMapSampler', 'sampler'),
  MetallicRoughnessMapSampler: inputSlot('texture', 'metallicRoughnessMapSampler', 'sampler'),

  // ibl
  IblRotation: inputSlot('ibl', 'rotation', 'mat3x3'),
  IblIntensity: inputSlot('ibl', 'intensity', 'scalar'),
  IblMipCount: inputSlot('ibl', 'mipCount', 'scalar'),
  IblBrdfMap: inputSlot('ibl', 'brdfMap', 'texture'),
  IblEnvironmentMap: inputSlot('ibl', 'radianceMap', 'texture'),
  IblLambertianMap: inputSlot('ibl', 'irradianceMap', 'texture'),
} as const

export class CommonMaterial extends materialSchemaClass(CommonMaterialSchema) {
  public constructor(device: Device, options?: Partial<MaterialOptions>) {
    super(device, {
      name: options?.name ?? 'Common Material',
      effect: commonEffectOptions(),
      meta: options?.meta ?? {},
    })
    this.setDefaults()
    if (options?.properties) {
      this.setProperties(options?.properties)
    }
  }

  public setDefaults() {
    this.BaseColor = vec3(1)
    this.EmissiveColor = vec3(0)
    this.EmissiveStrength = 1
    this.SpecularColor = vec3(1)
    this.SpecularWeight = 1
    this.TextureMod = Mat4.createIdentity()
    this.IblRotation = Mat3.createIdentity()
    this.BaseMapSampler = SamplerState.LinearWrap

    this.Ior = 1.5
    this.Metallic = 1
    this.Roughness = 1
    this.Alpha = 1
    this.AlphaClip = 0
  }

  public setProperties(props: CommonMaterialProps) {
    if (!props) {
      return
    }

    this.UseVertexColor = TRUE

    if (props.BaseColor) {
      this.BaseColor = vec3(props.BaseColor)
    }
    if (props.BaseMap) {
      this.BaseMap = props.BaseMap as any
      this.UseBaseMap = TRUE
    }
    if (props.BaseMapSampler) {
      this.BaseMapSampler = props.BaseMapSampler
    }
    if (props.BaseMapUv) {
      this.TextureMod = uvInfoToMat4(props.BaseMapUv)
      this.UseTextureMod = TRUE
    }

    if (props.NormalMap) {
      this.NormalMap = props.NormalMap as any
      this.UseNormalMap = TRUE
    }
    if (props.NormalMapSampler) {
      this.NormalMapSampler = props.NormalMapSampler
    }

    if (props.EmissiveColor) {
      this.EmissiveColor = vec3(props.EmissiveColor)
    }
    if (props.EmissiveStrength != null) {
      this.EmissiveStrength = props.EmissiveStrength
    }
    if (props.EmissiveMap) {
      this.EmissiveMap = props.EmissiveMap as any
      this.UseEmissiveMap = TRUE
    }
    if (props.EmissiveMapSampler) {
      this.EmissiveMapSampler = props.EmissiveMapSampler
    }

    if (props.SpecularColor) {
      this.SpecularColor = vec3(props.SpecularColor)
    }
    if (props.SpecularWeight != null) {
      this.SpecularWeight = props.SpecularWeight
    }
    if (props.SpecularMap) {
      this.SpecularMap = props.SpecularMap as any
      this.UseSpecularMap = TRUE
    }
    if (props.SpecularMapSampler) {
      this.SpecularMapSampler = props.SpecularMapSampler as any
    }
    if (props.SmoothnessMap) {
      this.SmoothnessMap = props.SmoothnessMap as any
      this.UseSpecularMap = TRUE
    }
    if (props.SmoothnessMapUv) {
      this.SmoothnessMapSampler = props.SmoothnessMapUv as any
      this.UseSmoothnessMap = TRUE
    }

    if (props.OcclusionMap) {
      this.OcclusionMap = props.OcclusionMap as any
      this.UseOcclusionMap = TRUE
    }
    if (props.OcclusionMapSampler) {
      this.OcclusionMapSampler = props.OcclusionMapSampler
    }

    if (props.MetallicRoughnessMap) {
      this.MetallicRoughnessMap = props.MetallicRoughnessMap as any
      this.UseMetallicRoughnessMap = TRUE
    }
    if (props.MetallicRoughnessMapSampler) {
      this.MetallicRoughnessMapSampler = props.MetallicRoughnessMapSampler
    }

    if (props.IOR != null) {
      this.Ior = props.IOR
    }
    if (props.Metallic != null) {
      this.Metallic = props.Metallic
    }
    if (props.Roughness != null) {
      this.Roughness = props.Roughness
    }

    if (props.Opacity != null) {
      this.Alpha = props.Opacity
    }

    if (props.AlphaClip != null) {
      this.AlphaClip = props.AlphaClip
    }
    this.isTransparent = !!props.AlphaBlend
    this.UseBlend = this.isTransparent ? TRUE : FALSE

    if (props.DoubleSided) {
      this.effect.cullState = CullState.Disabled
    }
  }
}
