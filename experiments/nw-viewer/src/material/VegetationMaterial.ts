import {
  BlendState,
  CommonBindingKeys,
  CullState,
  Device,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
  type Texture,
  materialSchema,
  materialSchemaClass,
} from '@gglib/graphics'
import { Mat4, Vec3, Vec4 } from '@gglib/math'
import type { NwMaterialProps } from './GltfExtension'
import { VEGETATION_SHADER } from './VegetationShader.wgsl'
import { parseColorParam, smoothnessToRoughness } from './common.wgsl'

export function vegetationShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Vegetation Shader',
    wgsl: VEGETATION_SHADER,
    glsl: null,
  }
}

export function vegetationEffectOptions(): EffectOptions {
  return {
    name: 'New World Effect',
    meta: {},
    program: {
      shader: vegetationShaderOptions(),
      shared: [],
    },
  }
}

export type VegetationEffectInputs = {
  [CommonBindingKeys.Object.ModelMatrix]: Mat4
  [CommonBindingKeys.View.ViewMatrix]: Mat4
  [CommonBindingKeys.View.ProjectionMatrix]: Mat4
  [CommonBindingKeys.View.CameraPosition]: Vec3

  'material.BaseColor': Vec3
  'material.EmissiveColor': Vec3
  'material.SpecularColor': Vec3
  'material.Metallic': number
  'material.Roughness': number
  'material.Alpha': number
  'material.AlphaClip': number
  'material.Ior': number

  'settings.smoothnessMapEnabled': number

  'lights.color[0]': Vec4
  'lights.position[0]': Vec4
  'lights.direction[0]': Vec4
  'lights.color[1]': Vec4
  'lights.position[1]': Vec4
  'lights.direction[1]': Vec4
  'lights.color[2]': Vec4
  'lights.position[2]': Vec4
  'lights.direction[2]': Vec4
  'lights.color[3]': Vec4
  'lights.position[3]': Vec4
  'lights.direction[3]': Vec4

  baseColorMap: Texture
  specularColorMap: Texture
  normalMap: Texture
  smoothnessMap: Texture
  opacityMap: Texture
}

export function vegetationEffectInputs(): VegetationEffectInputs {
  return {
    [CommonBindingKeys.Object.ModelMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ViewMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ProjectionMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.CameraPosition]: Vec3.create(),

    'material.BaseColor': Vec3.create(1, 1, 1),
    'material.EmissiveColor': Vec3.create(),
    'material.SpecularColor': Vec3.create(),
    'material.Metallic': 0,
    'material.Roughness': 0.5,
    'material.Alpha': 1,
    'material.AlphaClip': 0,
    'material.Ior': 0,

    'settings.smoothnessMapEnabled': 0,

    'lights.color[0]': Vec4.create(),
    'lights.position[0]': Vec4.create(),
    'lights.direction[0]': Vec4.create(),
    'lights.color[1]': Vec4.create(),
    'lights.position[1]': Vec4.create(),
    'lights.direction[1]': Vec4.create(),
    'lights.color[2]': Vec4.create(),
    'lights.position[2]': Vec4.create(),
    'lights.direction[2]': Vec4.create(),
    'lights.color[3]': Vec4.create(),
    'lights.position[3]': Vec4.create(),
    'lights.direction[3]': Vec4.create(),

    baseColorMap: null,
    specularColorMap: null,
    normalMap: null,
    smoothnessMap: null,
    opacityMap: null,
  }
}

export const VegetationEffectSchema = materialSchema<VegetationEffectInputs>()({
  World: CommonBindingKeys.Object.ModelMatrix,
  View: CommonBindingKeys.View.ViewMatrix,
  Projection: CommonBindingKeys.View.ProjectionMatrix,
  CameraPosition: CommonBindingKeys.View.CameraPosition,

  BaseColor: 'material.BaseColor',
  EmissiveColor: 'material.EmissiveColor',
  SpecularColor: 'material.SpecularColor',
  Metallic: 'material.Metallic',
  Roughness: 'material.Roughness',
  Alpha: 'material.Alpha',
  AlphaClip: 'material.AlphaClip',
  Ior: 'material.Ior',

  SmoothnessMapEnabled: 'settings.smoothnessMapEnabled',

  BaseColorMap: 'baseColorMap',
  SpecularColorMap: 'specularColorMap',
  NormalMap: 'normalMap',
  SmoothnessMap: 'smoothnessMap',
  OpacityMap: 'opacityMap',
})

export class VegetationMaterial extends materialSchemaClass(VegetationEffectSchema) {
  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'Vegetation Material',
      effect: vegetationEffectOptions(),
      inputs: vegetationEffectInputs(),
      meta: {},
    })
    this.assignNwProps(options?.properties as any)
  }

  public assignNwProps(props: NwMaterialProps) {
    if (!props) {
      return
    }

    const attr = props.attrs
    const para = props.params
    const tex = props.textures
    const mod = props.mods

    const isImpostor = !!attr.StringGenMask?.includes('%IS_GDE_IMPOSTOR%')
    const isLeaves = !!attr.StringGenMask?.includes('LEAVES')

    if (attr.AlphaTest) {
      this.AlphaClip = attr.AlphaTest
    }

    if (tex.Diffuse) {
      this.set('baseColorMap', tex.Diffuse)
    }
    if (tex.Bumpmap) {
      this.set('normalMap', tex.Bumpmap)
    }
    if (tex.Specular) {
      this.set('specularColorMap', tex.Specular)
    }
    if (tex.Smoothness) {
      this.set('smoothnessMap', tex.Smoothness)
      this.SmoothnessMapEnabled = 1
    }
    if (tex.Opacity) {
      this.set('opacityMap', tex.Opacity)
    }

    if (attr.Diffuse) {
      this.BaseColor.initFrom(parseColorParam(attr.Diffuse))
    }
    if (attr.Specular) {
      this.SpecularColor.initFrom(parseColorParam(attr.Specular))
    }
    if (attr.Emissive) {
      this.EmissiveColor.initFrom(parseColorParam(attr.Emissive))
    }
    if (attr.Emittance) {
      this.EmissiveColor.initFrom(parseColorParam(attr.Emittance))
    }
    if (attr.Shininess) {
      this.Roughness = smoothnessToRoughness(attr.Shininess / 255)
    }

    this.Ior = 0
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.Alpha
  }
}
