import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export type ShadeFunctionOptimized = 'shadeOptimized'

/**
 * @public
 */
export const FXC_SHADE_OPTIMIZED: ShaderChunkSet = Object.freeze({
  functions: glsl`
    highp vec3 shadeOptimized(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 V = shade.V;
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 I = shade.I;
      vec3 H = normalize(V + L);

      float dotNL = dot(N, L);
      if (dotNL <= 0.0) {
        return vec3(0.0, 0.0, 0.0);
      }

      float dotNH = dot(N, H);
      float dotLH = dot(L, H);

      // specular BRDF (Fr)
      float D = pow(dotNH, surface.Specular.a);
      float Fr = D / (4.0 * dotLH * dotLH * dotLH);

      // diffuse BRDF (Fd)
      float Fd = dotNL;

      return (Fr * surface.Specular.rgb + Fd * surface.Diffuse.rgb) * I;
    }
  `,
})
