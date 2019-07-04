import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export type ShadeFunctionLambert = 'shadeLambert'

/**
 * @public
 */
export const FXC_SHADE_LAMBERT: ShaderChunkSet = Object.freeze({
  functions: glsl`
    highp vec3 shadeLambert(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 I = shade.I;

      float Fd = max(dot(N, L), 0.0);
      return Fd * surface.Diffuse.rgb * I;
    }
  `,
})
