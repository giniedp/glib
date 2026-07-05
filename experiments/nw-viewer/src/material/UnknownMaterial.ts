import {
  Color,
  CommonBlocks,
  Device,
  materialSchemaClass,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import Schema from './UnknownMaterial.meta'
import WGSL from './UnknownMaterial.wgsl'

export function unknownShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Shape Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function unknownEffectOptions(): EffectOptions {
  return {
    name: 'Shape Effect',
    meta: {},
    program: {
      shader: unknownShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceTransformBlock: 'object',
    },
  }
}

export class UnknownMaterial extends materialSchemaClass(Schema) {
  public constructor(device: Device) {
    super(device, {
      name: 'Shape Material',
      effect: unknownEffectOptions(),
      meta: {},
    })
    this.Color = Color.Red.toVec4()
  }
}
