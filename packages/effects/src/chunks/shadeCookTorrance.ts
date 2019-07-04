import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export type ShadeFunctionCookTorrance = 'shadeCookTorrance'

/**
 * @public
 */
export const FXC_SHADE_COOK_TORRANCE: ShaderChunkSet = Object.freeze({
  functions: glsl`
    highp vec3 shadeCookTorrance(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 V = shade.V;
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 H = normalize(L + V);
      vec3 I = shade.I;

      float dotNL = max(dot(N, L), 0.0);
      float dotNH = max(dot(N, H), 0.0);
      float dotNV = max(dot(N, V), 0.0);
      float dotLH = max(dot(L, H), 0.0);

      // specular BRDF (Fr)
      float D = pow(dotNH, surface.Specular.a);
      vec3  F = fresnelSchlick(surface.Specular.rgb, dotLH);
      float G = min(1.0, 2.0 * dotNH * min(dotNV, dotNL) / dotLH);
      vec3  Fr = D * F * G / (4.0 * dotNV * dotNL);

      // diffuse BRDF (Fd)
      float Fd = dotNL;

      return (Fr * surface.Specular.rgb + Fd * surface.Diffuse.rgb) * I;
    }
  `,
})
