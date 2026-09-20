import type { Device, EffectOptions } from '@gglib/graphics'
import {
  CommonBlocks,
  CommonInputs,
  inputSlot,
  MaterialOptions,
  materialSchemaClass,
  SamplerState,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { vec2, vec3, vec4 } from '@gglib/math'
import { PARTICLE_EFFECT_GLSL_FS, PARTICLE_EFFECT_GLSL_VS } from './ParticleMaterial.glsl'
import { PARTICLE_EFFECT_WGSL } from './ParticleMaterial.wgsl'

export function particleShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Particle Shader',
    wgsl: {
      source: PARTICLE_EFFECT_WGSL,
    },
    glsl: {
      vertex: PARTICLE_EFFECT_GLSL_VS,
      fragment: PARTICLE_EFFECT_GLSL_FS,
    },
  }
}

export function particleEffectOptions(): EffectOptions {
  return {
    name: 'Particle Effect',
    meta: {},
    program: {
      shader: particleShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceDataBlock: null,
      perInstanceTransformBlock: null,
    },
  }
}

export const ParticleMaterialSchema = {
  // per view
  View: CommonInputs.View.ViewMatrix,
  Projection: CommonInputs.View.ProjectionMatrix,

  // settings
  MinColor: inputSlot('settings', 'minColor', 'vec4'),
  MaxColor: inputSlot('settings', 'maxColor', 'vec4'),
  StartSize: inputSlot('settings', 'startSize', 'vec2'),
  EndSize: inputSlot('settings', 'endSize', 'vec2'),
  RotateSpeed: inputSlot('settings', 'rotateSpeed', 'vec2'),
  Duration: inputSlot('settings', 'duration', 'scalar'),
  DurationRandomness: inputSlot('settings', 'durationRandomness', 'scalar'),
  Gravity: inputSlot('settings', 'gravity', 'vec3'),
  EndVelocity: inputSlot('settings', 'endVelocity', 'scalar'),
  Time: inputSlot('settings', 'time', 'scalar'),
  Scale: inputSlot('settings', 'scale', 'vec2'),

  // texture
  ColorMap: inputSlot('', 'colorMap', 'texture'),
  ColorMapSampler: inputSlot('', 'colorMapSampler', 'sampler'),
} as const

export class ParticleMaterial extends materialSchemaClass(ParticleMaterialSchema) {
  public constructor(device: Device, options?: Partial<MaterialOptions>) {
    super(device, {
      name: options?.name ?? 'Particle Material',
      effect: particleEffectOptions(),
      meta: options?.meta ?? {},
    })
    this.setDefaults()
  }

  public setDefaults() {
    this.MinColor = vec4(1)
    this.MaxColor = vec4(1)
    this.StartSize = vec2(1)
    this.EndSize = vec2(1)
    this.RotateSpeed = vec2(0)
    this.Duration = 1
    this.DurationRandomness = 0
    this.Gravity = vec3(0)
    this.EndVelocity = 0
    this.Time = 0
    this.Scale = vec2(1)

    this.ColorMapSampler = SamplerState.LinearWrap
  }
}
