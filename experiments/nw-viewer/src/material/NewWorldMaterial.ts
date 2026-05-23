import {
  BlendState,
  CommonBlocks,
  CommonInputs,
  CullState,
  Device,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
  TRUE,
  inputSlotScalar,
  inputSlotTexture,
  inputSlotVec3,
  materialSchemaClass,
} from '@gglib/graphics'
import type { NwMaterialProps } from './GltfExtension'
import NW_EFFECT_WGSL from './NewWorldMaterial.wgsl'
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
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
    },
  }
}

export const NewWorldEffectSchema = {
  World: CommonInputs.Object.ModelMatrix,

  View: CommonInputs.View.ViewMatrix,
  Projection: CommonInputs.View.ProjectionMatrix,
  CameraPosition: CommonInputs.View.CameraPosition,

  BaseColor: inputSlotVec3('material', 'basecolor'),
  EmissiveColor: inputSlotVec3('material', 'emissivecolor'),
  SpecularColor: inputSlotVec3('material', 'specularcolor'),
  Metallic: inputSlotScalar('material', 'metallic'),
  Roughness: inputSlotScalar('material', 'roughness'),
  Alpha: inputSlotScalar('material', 'alpha'),
  AlphaClip: inputSlotScalar('material', 'alphaclip'),
  Ior: inputSlotScalar('material', 'ior'),

  BaseColorMap: inputSlotTexture('material', 'basecolormap'),
  SpecularColorMap: inputSlotTexture('material', 'specularcolormap'),
  NormalMap: inputSlotTexture('material', 'normalmap'),
  SmoothnessMap: inputSlotTexture('material', 'smoothnessmap'),

  TextureEnabled: inputSlotScalar('settings', 'textureEnabled'),
  SpecularMapEnabled: inputSlotScalar('settings', 'specularEnabled'),
  NormalMapEnabled: inputSlotScalar('settings', 'normalMapEnabled'),
  SmoothnessMapEnabled: inputSlotScalar('settings', 'smoothnessMapEnabled'),
  LightingEnabled: inputSlotScalar('settings', 'lightingEnabled'),
  FogEnabled: inputSlotScalar('settings', 'fogEnabled'),
}

export class NewWorldMaterial extends materialSchemaClass(NewWorldEffectSchema) {
  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'New World Material',
      effect: newWorldEffectOptions(),
      meta: {},
    })
    this.assignNwProps(options?.properties as any)
  }

  // public setDirectionalLight(index: 0 | 1 | 2 | 3, color: Vec3, direction: Vec3) {
  //   this.get(`lights.color[${index}]`).init(color.x, color.y, color.z, 1)
  //   this.get(`lights.direction[${index}]`).init(direction.x, direction.y, direction.z, 1)
  // }

  // public setPointLight(index: 0 | 1 | 2 | 3, color: Vec3, position: Vec3) {
  //   this.get(`lights.color[${index}]`).init(color.x, color.y, color.z, 2)
  //   this.get(`lights.position[${index}]`).init(position.x, position.y, position.z, 1)
  // }

  public assignNwProps(props: NwMaterialProps) {
    if (!props) {
      return
    }
    const attr = props.attrs
    const para = props.params
    const tex = props.textures
    const mod = props.mods
    // console.log(attr, para)

    if (attr.Shader === 'Vegetation') {
      console.log(attr.Shader, attr.StringGenMask)
    }
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
      this.BaseColorMap = tex.Diffuse as any
      this.TextureEnabled = TRUE
    }
    if (tex.Bumpmap) {
      this.NormalMap = tex.Bumpmap as any
      this.NormalMapEnabled = TRUE
    }
    if (tex.Specular) {
      this.SpecularColorMap = tex.Specular as any
      this.SpecularMapEnabled = TRUE
    }
    if (tex.Smoothness) {
      this.SmoothnessMap = tex.Smoothness as any
      this.SmoothnessMapEnabled = TRUE
    }

    if (attr.Diffuse) {
      this.BaseColor = parseColorParam(attr.Diffuse)
    }
    if (attr.Specular) {
      this.SpecularColor = parseColorParam(attr.Specular)
    }
    if (attr.Emissive) {
      this.EmissiveColor = parseColorParam(attr.Emissive)
    }
    if (attr.Emittance) {
      this.EmissiveColor = parseColorParam(attr.Emittance)
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
  }
}
