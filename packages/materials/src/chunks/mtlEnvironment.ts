import { ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control environment color contribution.
 *
 * @public
 */
export interface MtlEnvironmentDefs {
  /**
   * Enables environment color from texture
   */
  ENVIRONMENT_MAP?: boolean
}

/**
 * Contributes environment lighting and mapping to the shader. See {@link MtlEnvironmentDefs}
 * @public
 */
export const MTL_ENVIRONMENT: ShaderChunkSet<MtlEnvironmentDefs> = {
  defines: /* glsl */ `
    #if defined(ENVIRONMENT_MAP)
      #ifndef ENVIRONMENT_MAP_MAX_LOD
      #define ENVIRONMENT_MAP_MAX_LOD 4.0 // 5 levels of detail
      #endif

      #ifndef V_NORMAL
      #define V_NORMAL // environment mapping requires normals
      #endif
    #endif
  `,

  uniforms: /* glsl */ `
    #ifdef ENVIRONMENT_MAP
    // @binding IrradianceMap
    uniform samplerCube uIrradianceMap;
    // @binding EnvironmentMap
    uniform samplerCube uEnvironmentMap;
    // @binding EnvironmentLUT
    uniform sampler2D uEnvironmentLUT;
    // @binding EnvironmentIntensity
    // @default 1.0
    uniform float uEnvIntensity;
    #endif
  `,

  functions: /* glsl */ `
    vec3 getEnvDiffuseBRDF(vec3 n)
    {
      #ifdef ENVIRONMENT_MAP
      // TODO: rotate
      // n = u_EnvRotation * n
      return texture(uIrradianceMap, n).rgb * uEnvIntensity;
      #else
      return vec3(RECIPROCAL_PI);
      #endif
    }

    vec2 getEnvSpecularBRDF(float NdotV, float roughness)
    {
      #ifdef ENVIRONMENT_MAP
      return texture(uEnvironmentLUT, vec2(NdotV, roughness)).rg;
      #else
      return vec2(0.0);
      #endif
    }

    vec3 getEnvSpecular(vec3 reflection, float roughness)
    {
      #ifdef ENVIRONMENT_MAP
      // TODO: rotate
      // reflection = u_EnvRotation * reflection
      float lod = roughness * ENVIRONMENT_MAP_MAX_LOD;
      return textureLod(uEnvironmentMap, reflection, lod).rgb * uEnvIntensity;
      #else
      return vec3(0.0);
      #endif
    }

    vec3 getIBLGGXFresnel(vec2 brdf, float NdotV, float roughness, vec3 F0, vec3 specularWeight)
    {
      vec3 ks = fresnelSchlickf90(F0, max(vec3(1.0 - roughness), F0), NdotV);
      return specularWeight * (ks * brdf.x + brdf.y);
    }

    #define SPECULAR_WORKFLOW
    vec3 getEnvironmentColor(
      in vec3 toEye,
      in SurfaceParams surface
    ) {
      #if defined(ENVIRONMENT_MAP)
      float metallic = surface.Metallic;
      float roughness = getRoughness(surface);

      vec3 f0 = getF0Dielectric(surface);
      vec3 f90 = getSpecularWeight(surface);

      vec3 N = surface.Normal.xyz;
      vec3 V = toEye;
      vec3 R = reflect(-V, N);
      float NdotV = clamp(dot(N, V), 0.0, 1.0);

      vec2 brdf = getEnvSpecularBRDF(NdotV, roughness);
      vec3 fDiffuse = getEnvDiffuseBRDF(N) * surface.BaseColor.rgb;
      vec3 fSpecular = getEnvSpecular(R, roughness);

      vec3 fMetalIBL = getIBLGGXFresnel(brdf, NdotV, roughness, surface.BaseColor.rgb, vec3(1.0));
      vec3 fMetal = fMetalIBL * fSpecular;

      // vec3 fDielectricIBL = getIBLGGXFresnel(brdf, NdotV, roughness, f0, f90);
      vec3 fDielectricIBL = f0 * brdf.x + f90 * brdf.y;
      vec3 fDielectric = mix(fDiffuse, fSpecular, fDielectricIBL);

      return mix(fDielectric, fMetal, metallic);
      #else
      return vec3(0.0);
      #endif
    }
  `,
}
