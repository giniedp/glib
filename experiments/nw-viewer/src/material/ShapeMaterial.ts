import {
  CommonBlocks,
  Device,
  materialSchemaClass,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import Schema from './ShapeMaterial.meta'
import SHAPE_SHADER from './ShapeMaterial.wgsl'

export function shapeShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Shape Shader',
    wgsl: SHAPE_SHADER,
    glsl: null,
  }
}

export function shapeEffectOptions(): EffectOptions {
  return {
    name: 'Shape Effect',
    meta: {},
    instanceBufferKey: 'instances',
    program: {
      shader: shapeShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
    },
  }
}

export class ShapeMaterial extends materialSchemaClass(Schema) {
  public constructor(device: Device) {
    super(device, {
      name: 'Shape Material',
      effect: shapeEffectOptions(),
      meta: {},
    })
  }

  public instances() {
    return this.effect.program.get('instances')
  }
}
