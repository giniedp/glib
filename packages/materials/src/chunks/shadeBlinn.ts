import { ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export type ShadeFunctionBlinn = 'shadeBlinn'

/**
 * @public
 */
export const SHADE_BLINN: ShaderChunkSet = Object.freeze({
  functions: /* glsl */ `
    highp vec3 shadeBlinn(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 V = shade.V;
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 I = shade.I;
      vec3 H = normalize(L + V);
      float roughness = surface.Roughness;

      float dotNL = dot(N, L);
      if (dotNL <= 0.0) {
        return vec3(0.0, 0.0, 0.0);
      }

      float dotNH = max(dot(N, H), 0.0);
      float Fr = pow(dotNH, roughnessToPower(roughness)) * dotNL;
      float Fd = dotNL;
      return (Fr * surface.Specular.rgb + Fd * surface.BaseColor.rgb) * I;
    }
  `,
})
