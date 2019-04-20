import { glsl } from '../glsl'

export interface MtlEmissionDefs {
  /**
   * Enables the emission texture
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
   * Enables the emission color
   */
  EMISSION_COLOR?: any
}

/**
 * Adds Emission texture / color to the shader
 *
 * @remarks
 * Uses defines
 *
 * - `EMISSION_MAP` enables emission texture
 * - `EMISSION_MAP_UV` defaults to `vTexture.xy`
 * - `EMISSION_COLOR` enables emission color
 */
export const MTL_EMISSION = Object.freeze({
  defines: glsl`
    #ifdef EMISSION_MAP
      #if !defined(V_TEXTURE1) || !defined(V_TEXTURE1)
      #define V_TEXTURE1
      #endif
    #endif
    #ifndef EMISSION_MAP_UV
    #define EMISSION_MAP_UV vTexture.xy
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

  fs_surface: glsl`
    #if defined(EMISSION_MAP)
    #ifdef EMISSION_MAP_OFFSET_SCALE
    surface.Emission.rgb = texture2D(uEmissionMap, uEmissionMapOffsetScale.xy + uEmissionMapOffsetScale.zw * EMISSION_MAP_UV).rgb;
    #else
    surface.Emission.rgb = texture2D(uEmissionMap, EMISSION_MAP_UV).rgb;
    #endif
    #ifdef EMISSION_COLOR
    surface.Emission.rgb *= uEmissionColor;
    #endif

    #elif defined(EMISSION_COLOR)
    surface.Emission = uEmissionColor;
    #endif
  `,
})
