// tslint:disable

import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export type SHADE_PBR_FUNCTION = 'shadePbr'

/**
 * @public
 */
export const SHADE_PBR: ShaderChunkSet = Object.freeze({
  functions: glsl`
    // This calculates the specular geometric attenuation (aka G()),
    // where rougher material will reflect less light back to the viewer.
    // This implementation is based on [1] Equation 4, and we adopt their modifications to
    // alphaRoughness as input as originally proposed in [2].
    highp float pbrGeometricOcclusion(float dotNL, float dotNV, float r) {
      float rSq = r * r;
      float attenuationL = 2.0 * dotNL / (dotNL + sqrt(rSq + (1.0 - rSq) * (dotNL * dotNL)));
      float attenuationV = 2.0 * dotNV / (dotNV + sqrt(rSq + (1.0 - rSq) * (dotNV * dotNV)));
      return attenuationL * attenuationV;
    }

    // The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
    // Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
    // Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
    highp float pbrMicrofacetDistribution(float dotNH, float r)
    {
      float rSq = r * r;
      float f = (dotNH * rSq - dotNH) * dotNH + 1.0;
      return rSq / (M_PI * f * f);
    }

    highp vec3 shadePbr(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      float metallic = surface.PBR.r;
      float roughness = surface.PBR.g;

      vec3 f0 = vec3(0.04);
      vec3 diffuseColor = surface.Diffuse.rgb * (vec3(1.0) - f0) * (1.0 - metallic);
      vec3 specularColor = mix(f0, surface.Diffuse.rgb, metallic);

      float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

      // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
      // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflectance to 0%.
      float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
      vec3 R0 = specularColor.rgb;

      vec3 V = shade.V;
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 H = normalize(V + L);
      vec3 I = shade.I;

      float dotNL = clamp(dot(N, L), 0.001, 1.0);
      float dotNH = clamp(dot(N, H), 0.0, 1.0);
      float dotNV = clamp(abs(dot(N, V)), 0.001, 1.0);
      float dotVH = clamp(dot(V, H), 0.0, 1.0);

      // The following equation models the Fresnel reflectance term of the spec equation (aka F())
      // Implementation of fresnel from [4], Equation 15
      vec3 F = fresnelSchlickf90(R0, reflectance90, dotVH);
      float G = pbrGeometricOcclusion(dotNL, dotNV, roughness * roughness);
      float D = pbrMicrofacetDistribution(dotNH, roughness * roughness);

      vec3 Fd = (1.0 - F) * diffuseColor;
      vec3 Fr = D * F * G / (4.0 * dotNV * dotNL);

      return (Fr + Fd) * dotNL * I;
    }
  `,
})
