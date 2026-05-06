import { ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export type ShadeFunctionLambert = 'shadeLambert'

/**
 * @public
 */
export const SHADE_LAMBERT: ShaderChunkSet = Object.freeze({
  functions: /* glsl */ `
    highp vec3 shadeLambert(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 I = shade.I;

      return max(dot(N, L), 0.0) * surface.BaseColor.rgb * I;
    }
  `,
})
