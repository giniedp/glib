import { Device, materialSchemaClass, type EffectOptions, type ShaderModuleOptions } from '@gglib/graphics'
import SCHEMA from './TerrainPackMaterial.meta'
import WGSL from './TerrainPackMaterial.wgsl'

export function terrainPackShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Terrain Pack Shader',
    wgsl: WGSL,
    glsl: null,
  }
}

export function terrainPackEffectOptions(): EffectOptions {
  return {
    name: 'Terrain Pack Effect',
    meta: {},
    program: {
      shader: terrainPackShaderOptions(),
      sharedBlocks: [],
    },
  }
}

export class SplatPackMaterial extends materialSchemaClass(SCHEMA) {
  public constructor(device: Device) {
    super(device, {
      name: 'Terrain Pack Material',
      effect: terrainPackEffectOptions(),
      meta: {},
    })
  }
}
