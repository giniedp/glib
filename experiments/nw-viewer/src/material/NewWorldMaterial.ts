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
import { NW_EFFECT_WGSL } from './NewWorldEffect.wgsl'
import { parseColorParam, smoothnessToRoughness } from './common.wgsl'

export function newWorldShaderOptions(): ShaderModuleOptions {
  return {
    name: 'New World Shader',
    wgsl: NW_EFFECT_WGSL,
    glsl: null,
  }
}

export function newWorldEffectOptions(): EffectOptions {
  return {
    name: 'New World Effect',
    meta: {},
    program: {
      shader: newWorldShaderOptions(),
      shared: [],
    },
  }
}

export type NewWorldEffectInputs = {
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
  'settings.textureEnabled': number
  'settings.specularEnabled': number
  'settings.normalMapEnabled': number
  'settings.smoothnessMapEnabled': number
  'settings.lightingEnabled': number
  'settings.fogEnabled': number
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
  'fog.color': Vec3
  'fog.start': number
  'fog.end': number
  baseColorMap: Texture
  specularColorMap: Texture
  normalMap: Texture
  smoothnessMap: Texture
}

export function newWorldEffectInputs(): NewWorldEffectInputs {
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
    'settings.textureEnabled': 0,
    'settings.specularEnabled': 0,
    'settings.normalMapEnabled': 0,
    'settings.smoothnessMapEnabled': 0,
    'settings.lightingEnabled': 0,
    'settings.fogEnabled': 0,
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
    'fog.color': Vec3.create(0.5, 0.5, 0.5),
    'fog.start': 0,
    'fog.end': 100,
    baseColorMap: null,
    specularColorMap: null,
    normalMap: null,
    smoothnessMap: null,
  }
}

export const NewWorldEffectSchema = materialSchema<NewWorldEffectInputs>()({
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

  TextureEnabled: 'settings.textureEnabled',
  SpecularMapEnabled: 'settings.specularEnabled',
  NormalMapEnabled: 'settings.normalMapEnabled',
  SmoothnessMapEnabled: 'settings.smoothnessMapEnabled',
  LightingEnabled: 'settings.lightingEnabled',
  FogEnabled: 'settings.fogEnabled',

  BaseColorMap: 'baseColorMap',
  SpecularColorMap: 'specularColorMap',
  NormalMap: 'normalMap',
  SmoothnessMap: 'smoothnessMap',

  FogColor: 'fog.color',
  FogStart: 'fog.start',
  FogEnd: 'fog.end',
})

export class NewWorldMaterial extends materialSchemaClass(NewWorldEffectSchema) {
  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'New World Material',
      effect: newWorldEffectOptions(),
      inputs: newWorldEffectInputs(),
      meta: {},
    })
    this.assignNwProps(options?.properties as any)
  }

  public setDirectionalLight(index: 0 | 1 | 2 | 3, color: Vec3, direction: Vec3) {
    this.get(`lights.color[${index}]`).init(color.x, color.y, color.z, 1)
    this.get(`lights.direction[${index}]`).init(direction.x, direction.y, direction.z, 1)
  }

  public setPointLight(index: 0 | 1 | 2 | 3, color: Vec3, position: Vec3) {
    this.get(`lights.color[${index}]`).init(color.x, color.y, color.z, 2)
    this.get(`lights.position[${index}]`).init(position.x, position.y, position.z, 1)
  }

  public assignNwProps(props: NwMaterialProps) {
    if (!props) {
      return
    }
    const attr = props.attrs
    const para = props.params
    const tex = props.textures
    const mod = props.mods
    // console.log(attr, para)

    if (attr.AlphaTest) {
      this.AlphaClip = attr.AlphaTest
    }
    // console.log(props)
    // if (params['g_macroDiffuseSaturation']) {
    //   this.MacroSaturation = Number(params['g_macroDiffuseSaturation'])
    // }
    // if (params['g_macroBlendStrength']) {
    //   this.MacroBlendStrength = Number(params['g_macroBlendStrength'])
    // }
    // if (params['g_macroGlossBlendStrength']) {
    //   this.MacroGlossBlendStrength = Number(params['g_macroGlossBlendStrength'])
    // }

    // if (params['g_materialLayerBlendFactor']) {
    //   this.MaterialBlendFactor = Number(params['g_materialLayerBlendFactor'])
    // }
    // if (params['g_materialLayerBlendFalloff']) {
    //   this.MaterialBlendFalloff = Number(params['g_materialLayerBlendFalloff'])
    // }
    // if (params['g_materialLayerHeightOffset']) {
    //   this.MaterialHeightOffset = Number(params['g_materialLayerHeightOffset'])
    // }
    // if (params['g_materialLayerHeightScale']) {
    //   this.MaterialHeightScale = Number(params['g_materialLayerHeightScale'])
    // }

    if (tex.Diffuse) {
      this.set('baseColorMap', tex.Diffuse)
      this.TextureEnabled = 1
    }
    if (tex.Bumpmap) {
      this.set('normalMap', tex.Bumpmap)
      this.NormalMapEnabled = 1
    }
    if (tex.Specular) {
      this.set('specularColorMap', tex.Specular)
      this.SpecularMapEnabled = 1
    }
    if (tex.Smoothness) {
      this.set('smoothnessMap', tex.Smoothness)
      this.SmoothnessMapEnabled = 1
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
    if (attr.Shader === 'Vegetation') {
      this.effect.cullState = CullState.None
      this.effect.blendState = BlendState.Alpha
    } else {
      this.effect.cullState = CullState.CullBack
      this.effect.blendState = BlendState.Opaque
    }
    // if (textures.Heightmap) {
    //   this.HeightMap = textures.Heightmap
    // }
    // this.Tiling = parameters.mods.Diffuse?.TileU ?? 1
  }
}
