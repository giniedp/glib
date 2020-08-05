import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * Describes preprocessor definitions which control parallax mapping.
 *
 * @public
 */
export interface MtlParallaxDefs {
  /**
   * Enables parallax mapping
   *
   * @remarks
   * Adds a `uniform sampler2D uParallaxMap` (bound as `ParallaxMap`)
   * that is used as height map.
   */
  PARALLAX_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  PARALLAX_MAP_UV?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uParallaxMapScaleOffset` that is used to transform the texture coordinates.
   * This is done in pixel shader for the ParallaxMap only.
   */
  PARALLAX_MAP_SCALE_OFFSET?: boolean
  /**
   * Enables parallax occlusion algorithm
   *
   * @remarks
   * {@link MtlParallaxDefs.PARALLAX_OCCLUSION_SAMPLES}
   */
  PARALLAX_OCCLUSION?: boolean
  /**
   * Defines maximum number of parallax occlusion samples
   */
  PARALLAX_OCCLUSION_SAMPLES?: number
}

/**
 * Contributes parallax mapping to the shader. See {@link MtlParallaxDefs}
 * @public
 */
export const FXC_MTL_PARALLAX: ShaderChunkSet<MtlParallaxDefs> = Object.freeze({
  defines: glsl`
    #ifdef PARALLAX_MAP

      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef PARALLAX_MAP_UV
        #define PARALLAX_MAP_UV vTexture.xy
      #endif

    #endif

    #if defined(PARALLAX_OCCLUSION_SAMPLES) && !defined(PARALLAX_OCCLUSION)
      #define PARALLAX_OCCLUSION
    #endif

    #if defined(PARALLAX_OCCLUSION) && !defined(PARALLAX_OCCLUSION_SAMPLES)
      #define PARALLAX_OCCLUSION_SAMPLES 16
    #endif
  `,
  uniforms: glsl`
    #ifdef PARALLAX_MAP
    // @binding  ParallaxMap
    // @filter   LinearWrap
    uniform sampler2D uParallaxMap;

    #ifdef PARALLAX_MAP_SCALE_OFFSET
    // @binding ParallaxMapScaleOffset
    uniform vec4 uParallaxMapScaleOffset;
    #endif

    // @default [1, 0.0]
    // @binding ParallaxScaleBias
    uniform vec2 uParallaxScaleBias;
    #endif
  `,
  functions: glsl`
    #ifdef PARALLAX_MAP
    vec2 getParallaxMapUV() {
      #ifdef PARALLAX_MAP_SCALE_OFFSET
      return PARALLAX_MAP_UV * uParallaxMapScaleOffset.xy + uParallaxMapScaleOffset.zw;
      #else
      return PARALLAX_MAP_UV;
      #endif
    }
    vec2 getParallaxOffset(vec3 eye, vec2 uv) {
      float h = (texture2D(uParallaxMap, uv).rgb).r;
      return (eye.xy / eye.z) * ((h + uParallaxScaleBias.y) * uParallaxScaleBias.x);
    }

    vec2 getParallaxOffsetWithOcclusion(vec3 eye, vec3 normal, vec2 uv) {
      // https://www.gamedev.net/articles/programming/graphics/a-closer-look-at-parallax-occlusion-mapping-r3262

      float maxSamples = float(PARALLAX_OCCLUSION_SAMPLES);
      float parallaxLimit = (-length(eye.xy) / eye.z) * uParallaxScaleBias.x;
      vec2 vOffsetDir = normalize(eye.xy);
      vec2 vMaxOffset = vOffsetDir * parallaxLimit;
      float numSamples = maxSamples + (dot(eye, normal) * (4.0 - maxSamples));
      float stepSize = 1.0 / numSamples;

      // Initialize the starting view ray height and the texture offsets.
      float currRayHeight = 1.0;
      vec2 vCurrOffset = vec2(0, 0);
      vec2 vLastOffset = vec2(0, 0);

      float lastSampledHeight = 1.0;
      float currSampledHeight = 1.0;

      for (int i = 0; i < PARALLAX_OCCLUSION_SAMPLES; i++) {
        currSampledHeight =  texture2D(uParallaxMap, uv + vCurrOffset).r + uParallaxScaleBias.y;

        // Test if the view ray has intersected the surface.
        if (currSampledHeight > currRayHeight) {
          float delta1 = currSampledHeight - currRayHeight;
          float delta2 = (currRayHeight + stepSize) - lastSampledHeight;
          float ratio = delta1 / (delta1 + delta2);
          vCurrOffset = (ratio)* vLastOffset + (1.0 - ratio) * vCurrOffset;

          // Force the exit of the loop
          break;
        } else {
          currRayHeight -= stepSize;
          vLastOffset = vCurrOffset;
          vCurrOffset += stepSize * vMaxOffset;

          lastSampledHeight = currSampledHeight;
        }
      }

      return vCurrOffset;
    }
    #endif
  `,
  fs_surface_before: glsl`
    vec2 uvOffset = vec2(0.0, 0.0);
    #if defined(V_TBN)
      #if defined(PARALLAX_MAP) && defined(PARALLAX_OCCLUSION)
    uvOffset = getParallaxOffsetWithOcclusion(WTT * normalize(vToEyeInWS.xyz), WTT * normalize(vWorldNormal), getParallaxMapUV());
      #elif defined(PARALLAX_MAP)
    uvOffset = getParallaxOffset(WTT * normalize(-vToEyeInWS.xyz), getParallaxMapUV());
      #endif
    #endif
  `,
})
