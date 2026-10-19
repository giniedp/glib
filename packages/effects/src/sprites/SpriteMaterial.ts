import type { EffectOptions } from '@gglib/graphics'
import {
  BlendState,
  CommonBlocks,
  CommonInputs,
  CullState,
  DepthState,
  inputSlot,
  MaterialOptions,
  MaterialWithSchema,
  SamplerState,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { SPRITE_EFFECT_GLSL_FS, SPRITE_EFFECT_GLSL_VS } from './SpriteMaterial.glsl'
import { SPRITE_EFFECT_WGSL } from './SpriteMaterial.wgsl'

export function spriteShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Sprite Shader',
    wgsl: {
      source: SPRITE_EFFECT_WGSL,
    },
    glsl: {
      vertex: SPRITE_EFFECT_GLSL_VS,
      fragment: SPRITE_EFFECT_GLSL_FS,
    },
  }
}

export function spriteEffectOptions(): EffectOptions {
  return {
    name: 'Sprite Effect',
    meta: {},
    // pixels below the alpha cutoff are discarded, the rest writes depth so sprites are ordered by depth
    blendState: BlendState.Alpha,
    depthState: DepthState.LessEqual,
    // sprites can be flipped or seen from behind
    cullState: CullState.None,
    program: {
      shader: spriteShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceDataBlock: null,
      perInstanceTransformBlock: null,
    },
  }
}

export const SpriteMaterialSchema = {
  // per view
  View: CommonInputs.View.ViewMatrix,
  Projection: CommonInputs.View.ProjectionMatrix,

  // settings
  AlphaCutoff: inputSlot('settings', 'alphaCutoff', 'scalar'),

  // texture
  ColorMap: inputSlot('', 'colorMap', 'texture'),
  ColorMapSampler: inputSlot('', 'colorMapSampler', 'sampler'),
} as const

/**
 * Material of a {@link SpriteMesh}
 *
 * @public
 */
export class SpriteMaterial extends MaterialWithSchema(SpriteMaterialSchema) {
  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: options?.name ?? 'Sprite Material',
      effect: spriteEffectOptions(),
      meta: options?.meta ?? {},
    })
    this.isTransparent = true
    this.AlphaCutoff = 0.5
    this.ColorMapSampler = SamplerState.LinearClamp
  }

  /**
   * Pixels with an alpha below this value are discarded.
   * With `0` nothing is discarded and the sprites don't write depth, so they only blend in draw order
   */
  public setAlphaCutoff(value: number): this {
    this.AlphaCutoff = value
    this.effect.depthState = value > 0 ? DepthState.LessEqual : DepthState.LessEqualNoWrite
    return this
  }
}
