import { Mat4, vec3 } from '@gglib/math'
import type { Device } from '../Device'

import { inputSlot, type ShaderModuleOptions } from '../resources'
import { CullState, SamplerState } from '../states'
import { BASIC_EFFECT_GLSL_FS, BASIC_EFFECT_GLSL_VS } from './BasicMaterial.glsl'
import { BASIC_EFFECT_WGSL } from './BasicMaterial.wgsl'
import { MaterialOptions } from './Material'
import { materialSchemaClass } from './MaterialSchema'
import { CommonMaterialProps, FALSE, TRUE, uvInfoToMat4 } from './types'

import type { EffectOptions } from './Effect'
import { CommonBlocks, CommonInputs } from './types'

export function basicShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Basic Shader',
    wgsl: {
      source: BASIC_EFFECT_WGSL,
    },
    glsl: {
      vertex: BASIC_EFFECT_GLSL_VS,
      fragment: BASIC_EFFECT_GLSL_FS,
    },
  }
}

export function basicEffectOptions(): EffectOptions {
  return {
    name: 'Basic Effect',
    meta: {},
    program: {
      shader: basicShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceDataBlock: null,
      perInstanceTransformBlock: null,
    },
  }
}

export const BasicMaterialSchema = {
  // global
  AmbientColor: CommonInputs.Global.AmbientColor,
  AmbientColorTop: CommonInputs.Global.AmbientColorTop,
  AmbientDirection: CommonInputs.Global.AmbientDirection,

  // per view
  View: CommonInputs.View.ViewMatrix,
  Projection: CommonInputs.View.ProjectionMatrix,

  // per object
  World: CommonInputs.Object.ModelMatrix,

  // material
  BaseColor: inputSlot('material', 'baseColor', 'vec3'),
  Alpha: inputSlot('material', 'alpha', 'scalar'),
  AlphaClip: inputSlot('material', 'alphaClip', 'scalar'),
  TextureMod: inputSlot('material', 'textureMod', 'mat4x4'),

  // settings
  UseFog: inputSlot('settings', 'useFog', 'scalar'),
  UseSun: inputSlot('settings', 'useSun', 'scalar'),
  UseBaseMap: inputSlot('settings', 'useBaseMap', 'scalar'),
  UseVertexColor: inputSlot('settings', 'useVertexColor', 'scalar'),
  UseBlend: inputSlot('settings', 'useBlend', 'scalar'),

  // textures
  BaseMap: inputSlot('texture', 'baseMap', 'texture'),
  BaseMapSampler: inputSlot('texture', 'baseMapSampler', 'sampler'),
} as const

export class BasicMaterial extends materialSchemaClass(BasicMaterialSchema) {
  public constructor(device: Device, options?: Partial<MaterialOptions>) {
    super(device, {
      name: options?.name ?? 'Basic Material',
      effect: basicEffectOptions(),
      meta: options?.meta ?? {},
    })
    this.setDefaults()
    if (options?.properties) {
      this.setProperties(options?.properties)
    }
  }

  public setDefaults() {
    this.BaseColor = vec3(1)

    this.TextureMod = Mat4.createIdentity()
    this.BaseMapSampler = SamplerState.LinearWrap

    this.Alpha = 1
    this.AlphaClip = 0
    this.AmbientColor = vec3(1)
    this.AmbientColorTop = vec3(1)
    this.AmbientDirection = vec3(0, 1, 0)
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
