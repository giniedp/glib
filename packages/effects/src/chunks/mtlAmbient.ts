import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * Describes preprocessor definitions which control ambient light color contribution.
 *
 * @public
 */
export interface MtlAmbientDefs {
  /**
   * Enables ambient lighting with constant color
   *
   * @remarks
   * Adds a `uniform vec3 uAmbientColor` (bound as `AmbientColor`)
   * that is added to the final output.
   */
  AMBIENT_COLOR?: boolean
  /**
   * Enables ambient lighting with color from a texture
   *
   * @remarks
   * Adds a `uniform sampler2D uAmbientMap` (bound as `AmbientMap`)
   * that is added to the final output.
   */
  AMBIENT_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`
   */
  AMBIENT_MAP_UV?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uAmbientMapScaleOffset` (bound as `AmbientMapScaleOffset`)
   * that is used to transform the texture coordinates.
   * This is done in pixel shader for the AmbientMap only.
   */
  AMBIENT_MAP_SCALE_OFFSET?: boolean
}

/**
 * Contributes ambient lighting and mapping to the shader. See {@link MtlAmbientDefs}
 * @public
 */
export const FXC_MTL_AMBIENT: ShaderChunkSet<MtlAmbientDefs> = Object.freeze({
  defines: glsl`
    #ifdef AMBIENT_MAP
      #if !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE1
      #endif

      #ifndef AMBIENT_MAP_UV
        #define AMBIENT_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef AMBIENT_COLOR
    // @binding AmbientColor
    // @widget  color
    // @default [1, 1, 1]
    uniform vec3 uAmbientColor;
    #endif

    #ifdef AMBIENT_MAP
    // @binding AmbientMap
    // @filter  LinearWrap
    uniform sampler2D uAmbientMap;
    #endif

    #ifdef AMBIENT_MAP_SCALE_OFFSET
    // @binding AmbientMapScaleOffset
    uniform vec4 uAmbientMapScaleOffset;
    #endif
  `,
  functions: glsl`
    #ifdef AMBIENT_MAP
    vec2 getAmbientMapUV() {
      #ifdef AMBIENT_MAP_SCALE_OFFSET
      return AMBIENT_MAP_UV * uAmbientMapScaleOffset.xy + uAmbientMapScaleOffset.zw;
      #else
      return AMBIENT_MAP_UV;
      #endif
    }
    #endif
    vec3 getAmbientColor(vec2 uvOffset) {
      vec3 result = vec3(0.0, 0.0, 0.0);
      #if defined(AMBIENT_MAP)
      result += texture2D(uAmbientMap, getAmbientMapUV() + uvOffset).rgb;
      #endif

      #if defined(AMBIENT_COLOR)
      result += uAmbientColor;
      #endif
      return result;
    }
  `,
  fs_shade_after: glsl`
    #if defined(AMBIENT_MAP) || defined(AMBIENT_COLOR)
    color.rgb += surface.Diffuse.rgb * getAmbientColor(uvOffset);
    #endif
  `,

})
