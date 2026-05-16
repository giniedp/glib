import {
  CommonBindingKeys,
  Device,
  materialSchema,
  materialSchemaClass,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import { SHAPE_SHADER } from './ShapeEffect.wgsl'

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
      shared: [],
    },
  }
}

export type ShapeEffectInputs = {
  [CommonBindingKeys.Object.ModelMatrix]: Mat4
  [CommonBindingKeys.View.ViewMatrix]: Mat4
  [CommonBindingKeys.View.ProjectionMatrix]: Mat4
  [CommonBindingKeys.View.CameraPosition]: Vec3
}

export function shapeEffectParameters(): ShapeEffectInputs {
  return {
    [CommonBindingKeys.Object.ModelMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ViewMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ProjectionMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.CameraPosition]: Vec3.create(),
  }
}

export const ShapeMaterialSchema = materialSchema<ShapeEffectInputs>()({
  World: CommonBindingKeys.Object.ModelMatrix,
  View: CommonBindingKeys.View.ViewMatrix,
  Projection: CommonBindingKeys.View.ProjectionMatrix,
  CameraPosition: CommonBindingKeys.View.CameraPosition,
})

export class ShapeMaterial extends materialSchemaClass(ShapeMaterialSchema) {
  public constructor(device: Device) {
    super(device, {
      name: 'Shape Material',
      effect: shapeEffectOptions(),
      inputs: shapeEffectParameters(),
      meta: {},
    })
  }

  public instances() {
    return this.effect.program.get('instances')
  }
}
