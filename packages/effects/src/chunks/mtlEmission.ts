import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface MtlEmissionDefs {
  /**
   * Adds EmissionColor
   */
  EMISSION_COLOR?: any
  /**
   * Adds EmissionMap texture
   */
  EMISSION_MAP?: any
  /**
   * Defines the uv accessor
   *
   * @remarks
   * defaults to `vTexture.xy`
   */
  EMISSION_MAP_UV?: any
  /**
   * Adds offset and scale operation on EmissionMap
   */
  EMISSION_MAP_OFFSET_SCALE?: any
}

/**
 * Adds Emission texture / color to the shader
 *
 * @public
 * @remarks
 * Uses defines
 *
 * - `EMISSION_MAP` enables emission texture
 * - `EMISSION_MAP_UV` defaults to `vTexture.xy`
 * - `EMISSION_COLOR` enables emission color
 */
export const MTL_EMISSION: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef EMISSION_MAP
      #if !defined(V_TEXTURE1) && !defined(V_TEXTURE1)
        #define V_TEXTURE1
      #endif

      #ifndef EMISSION_MAP_UV
        #define EMISSION_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef EMISSION_COLOR
    // @binding EmissionColor
    // @widget   color
    // @default  [1, 1, 1]
    uniform vec3 uEmissionColor;
    #endif

    #ifdef EMISSION_MAP
    // @binding EmissionMap
    // @filter   LinearWrap
    uniform sampler2D uEmissionMap;
    #endif

    #ifdef EMISSION_MAP_OFFSET_SCALE
    // @binding EmissionMapOffsetScale
    uniform vec4 uEmissionMapOffsetScale;
    #endif
  `,
  functions: glsl`
    #ifdef EMISSION_MAP
    vec2 getEmissionMapUV() {
      #ifdef EMISSION_MAP_OFFSET_SCALE
      return EMISSION_MAP_UV * uEmissionMapOffsetScale.zw + uEmissionMapOffsetScale.xy;
      #else
      return EMISSION_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_surface: glsl`
    #if defined(EMISSION_MAP)
    surface.Emission.rgb = texture2D(uEmissionMap, getEmissionMapUV() + uvOffset).rgb;
      #ifdef EMISSION_COLOR
    surface.Emission.rgb *= uEmissionColor;
      #endif

    #elif defined(EMISSION_COLOR)
    surface.Emission = uEmissionColor;
    #endif
  `,
})
