import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export type ShadeFunctionBlinn = 'shadeBlinn'

/**
 * @public
 */
export const FXC_SHADE_BLINN: ShaderChunkSet = Object.freeze({
  functions: glsl`
    highp vec3 shadeBlinn(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 V = shade.V;
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 I = shade.I;
      vec3 H = normalize(L + V);

      float dotNL = dot(N, L);
      if (dotNL <= 0.0) {
        return vec3(0.0, 0.0, 0.0);
      }

      float dotNH = dot(N, H);
      float Fr = pow(dotNH, surface.Specular.a);
      float Fd = dotNL;

      return (Fr * surface.Specular.rgb + Fd * surface.Diffuse.rgb) * I;
    }
  `,
})
