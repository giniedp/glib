import {
  BlendState,
  CommonBlocks,
  CullState,
  DepthState,
  Device,
  materialSchemaClass,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import Schema from './ShapeMaterial.meta'
import WGSL from './ShapeMaterial.wgsl'
import { MaterialLayerMasks } from './common'

export function shapeShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Shape Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function shapeEffectOptions(): EffectOptions {
  return {
    name: 'Shape Effect',
    meta: {},
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
    this.layer = MaterialLayerMasks.Common
    this.isTransparent = true
    this.effect.blendState = BlendState.Alpha
    this.effect.cullState = CullState.None
    this.effect.depthState = DepthState.GreaterNoWrite
  }

  public instances() {
    return this.effect.program.get('instances')
  }
}
