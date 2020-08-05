import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * Describes preprocessor definitions which control emissive color contribution.
 *
 * @public
 */
export interface MtlEmissionDefs {
  /**
   * Enables emission color
   *
   * @remarks
   * Adds a `uniform vec3 uEmissionColor` ( bound as `EmissionColor`)
   * that is used as emitted color.
   * If a `EmissionMap` is used, then both are multiplied.
   */
  EMISSION_COLOR?: boolean
  /**
   * Enables emission color from texture
   *
   * @remarks
   * Adds a `uniform sampler2D uEmissionMap` (bound as `EmissionMap`)
   * that is used as emissive surface color.
   * If a `EmissionColor` is used, then both are multiplied.
   */
  EMISSION_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  EMISSION_MAP_UV?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uEmissionMapScaleOffset` (bound as `EmissionMapScaleOffset`)
   * that is used to transform the texture coordinates.
   * This is done in pixel shader for the EmissionMap only.
   */
  EMISSION_MAP_SCALE_OFFSET?: boolean
}

/**
 * Contributes emission lighting and mapping to the shader. See {@link MtlEmissionDefs}
 * @public
 */
export const FXC_MTL_EMISSION: ShaderChunkSet<MtlEmissionDefs> = Object.freeze({
  defines: glsl`
    #ifdef EMISSION_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef EMISSION_MAP_UV
        #define EMISSION_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef EMISSION_COLOR
    // @binding EmissionColor
    // @widget  color
    // @default [1, 1, 1]
    uniform vec3 uEmissionColor;
    #endif

    #ifdef EMISSION_MAP
    // @binding EmissionMap
    // @filter  LinearWrap
    uniform sampler2D uEmissionMap;
    #endif

    #ifdef EMISSION_MAP_SCALE_OFFSET
    // @binding EmissionMapScaleOffset
    uniform vec4 uEmissionMapScaleOffset;
    #endif
  `,
  functions: glsl`
    #ifdef EMISSION_MAP
    vec2 getEmissionMapUV() {
      #ifdef EMISSION_MAP_SCALE_OFFSET
      return EMISSION_MAP_UV * uEmissionMapScaleOffset.xy + uEmissionMapScaleOffset.zw;
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
    surface.Emission.rgb = uEmissionColor;
    #endif
  `,
})
