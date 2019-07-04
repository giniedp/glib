import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export type SHADE_OPTIMIZED_FUNCTION = 'shadeOptimized'

/**
 * @public
 */
export const FXC_SHADE_OPTIMIZED: ShaderChunkSet = Object.freeze({
  functions: glsl`
    highp vec3 shadeOptimized(
      inout ShadeParams shade,
      inout SurfaceParams surface)
    {
      vec3 V = shade.V;
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 H = normalize(V + L);
      vec3 I = shade.I;

      float dotNL = max(dot(N, L), 0.0);
      float dotNH = max(dot(N, H), 0.0);
      float dotLH = max(dot(L, H), 0.0);

      // specular BRDF (Fr)
      float D = pow(dotNH, surface.Specular.a);
      float Fr = D / (4.0 * dotLH * dotLH * dotLH);

      return (Fr * surface.Specular.rgb + surface.Diffuse.rgb) * dotNL * I;
    }
  `,
})
