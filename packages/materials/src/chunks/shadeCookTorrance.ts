import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export type ShadeFunctionCookTorrance = 'shadeCookTorrance'

/**
 * @public
 */
export const SHADE_COOK_TORRANCE: ShaderChunkSet = Object.freeze({
  functions: glsl`
    highp vec3 shadeCookTorrance(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 V = shade.V;
      vec3 L = shade.L;
      vec3 I = shade.I;
      vec3 N = surface.Normal.xyz;
      vec3 H = normalize(L + V);
      float roughness = surface.Roughness;

      float dotNL = dot(N, L);
      if (dotNL <= 0.0) {
        return vec3(0.0, 0.0, 0.0);
      }

      float dotNH = dot(N, H);
      float dotNV = dot(N, V);
      float dotLH = clamp(dot(L, H), 0.0, 1.0);
      float dotVH = clamp(dot(V, H), 0.0, 1.0);

      // specular BRDF (Fr)
      float D = pow(dotNH, roughnessToPower(roughness)) * dotNL;
      vec3  F = fresnelSchlick(surface.Specular.rgb, dotVH);
      float G = min(1.0, 2.0 * dotNH * min(dotNV, dotNL) / dotLH);
      vec3  Fr = (D * F * G) / (4.0 * dotNV * dotNL);

      // diffuse BRDF (Fd)
      float Fd = max(dotNL, 0.0) ;

      return (Fr * surface.Specular.rgb + Fd * surface.BaseColor.rgb) * I;
    }
  `,
})
