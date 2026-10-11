import {
  BlendState,
  CullState,
  DepthState,
  Effect,
  MaterialWithSchema,
  RenderVariant,
  SamplerState,
  type Device,
  type MaterialOptions,
  type Texture,
} from '@gglib/graphics'
import { vec4 } from '@gglib/math'
import type { ParticleParams } from '../../formats/particles'
import { InputBlocks, MaterialLayerMasks } from '../../material'
import SCHEMA from './ParticleMaterial.meta'
import WGSL from './ParticleMaterial.wgsl'

type BlendMode = 'additive' | 'alpha'

/**
 * Creates the effect of a particle material.
 *
 * @remarks
 * Each material needs its own effect, like the other materials of the viewer: materials that share an effect
 * render with the material inputs of one of them (tiling, lighting …).
 */
function createEffect(device: Device, mode: BlendMode): Effect {
  const effect = new Effect(device, {
    name: `Particle Effect (${mode})`,
    meta: {},
    program: {
      shader: {
        name: 'Particle Shader',
        wgsl: { source: WGSL },
        glsl: null,
      },
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame],
    },
  })
  effect.depthState = DepthState.GreaterEqualNoWrite
  effect.cullState = CullState.None
  // the shader outputs premultiplied alpha
  effect.blendState = mode === 'additive' ? BlendState.AdditivePure : BlendState.AlphaPremultiplied
  return effect
}

/**
 * Scale of the particle color, to tune the HDR brightness of emissive particles against the scene
 */
export const PARTICLE_COLOR_SCALE = 1

/**
 * Material of a sprite particle emitter, see {@link ParticleMaterial.wgsl}
 */
export class ParticleMaterial extends MaterialWithSchema(SCHEMA) {
  public constructor(device: Device, params: ParticleParams, texture: Texture) {
    super(device, { name: 'Particle Material', effect: null, properties: {}, meta: { params, texture } })
  }

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({ name: options.name, effect: null, meta: options.meta })
    const params = options.meta.params as ParticleParams
    const texture = options.meta.texture as Texture
    const additive = params.blendType === 'Additive'
    this.effects[RenderVariant.Forward] = createEffect(this.device, additive ? 'additive' : 'alpha')
    this.isTransparent = true
    this.layer = MaterialLayerMasks.Particle

    const tiling = params.textureTiling
    this.Tiles = vec4(tiling.tilesX, tiling.tilesY, 1 / tiling.tilesX, 1 / tiling.tilesY)
    this.Lighting = vec4(params.emissiveLighting, params.diffuseLighting, params.diffuseBacklighting, additive ? 1 : 0)
    this.Options = vec4(tiling.animBlend ? 1 : 0, params.softParticle ? 1 : 0, PARTICLE_COLOR_SCALE, 0)
    this.SamplerLinear = SamplerState.LinearClamp
    this.DiffuseMap = texture
  }
}
