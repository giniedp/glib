import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control diffuse color contribution.
 *
 * @public
 */
export interface MtlBaseDefs {
  /**
   * Adds a color uniform
   *
   * @remarks
   * - Adds `uniform vec4 uBaseColor`
   * - Binds as `BaseColor`
   * - Default is `[1, 1, 1, 1]`
   */
  BASE_COLOR?: boolean

  /**
   * Adds a texture uniform
   *
   * @remarks
   * - Adds `uniform sampler2D uBaseColorMap`
   * - Binds as `BaseColorMap`
   */
  BASE_COLOR_MAP?: boolean

  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  BASE_COLOR_MAP_UV?: string

  /**
   * Adds a uniform to offset and scale the texture voordinates
   *
   * @remarks
   * - Adds `uniform vec4 uBaseColorMapScaleOffset`.
   * - Binds as `BaseColorMapScaleOffset`
   */
  BASE_COLOR_MAP_SCALE_OFFSET?: boolean

  /**
   * Adds a transform matrix for texture coordinates that is used to transform the texture coordinates.
   *
   * @remarks
   * - Adds `uniform mat3 uBaseColorMapTransform`
   * - Binds as `BaseColorMapTransform`
   */
  BASE_COLOR_MAP_TRANSFORM?: boolean
}

/**
 * Contributes diffuse lighting and mapping to the shader. See {@link MtlBaseDefs}
 * @public
 */
export const MTL_BASE: ShaderChunkSet<MtlBaseDefs> = {
  defines: glsl`
    #ifdef BASE_COLOR_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef BASE_COLOR_MAP_UV
        #define BASE_COLOR_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef BASE_COLOR
    // @binding BaseColor
    // @widget  color
    // @default [1, 1, 1, 1]
    uniform vec4 uBaseColor;
    #endif

    #ifdef BASE_COLOR_MAP
    // @binding BaseColorMap
    uniform sampler2D uBaseColorMap;
    #endif

    #ifdef BASE_COLOR_MAP_SCALE_OFFSET
    // @binding BaseColorMapScaleOffset
    uniform vec4 uBaseColorMapScaleOffset;
    #endif

    #ifdef BASE_COLOR_MAP_TRANSFORM
    // @binding BaseColorMapTransform
    uniform mat3 uBaseColorMapTransform;
    #endif

  `,
  fs_functions: glsl`
    #ifdef BASE_COLOR_MAP
    vec2 getBaseColorMapUV() {
      vec2 result = BASE_COLOR_MAP_UV;

      #ifdef BASE_COLOR_MAP_SCALE_OFFSET
      result = result * uBaseColorMapScaleOffset.xy + uBaseColorMapScaleOffset.zw;
      #endif

      #ifdef BASE_COLOR_MAP_TRANSFORM
      result = (uBaseColorMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    vec4 getBaseColor(vec2 uvOffset) {
      vec4 color = vec4(1.0, 1.0, 1.0, 1.0);

      #ifdef BASE_COLOR
        color *= uBaseColor;
      #endif

      #if defined(BASE_COLOR_MAP)
        color *= texture2D(uBaseColorMap, getBaseColorMapUV() + uvOffset);
      #endif

      #ifdef V_COLOR
        color.rgb *= vColor.rgb;
      #elif defined(V_COLOR1)
        color.rgb *= vColor1.rgb;
      #elif defined(V_COLOR2)
        color.rgb *= vColor2.rgb;
      #endif
      return color;
    }
  `,
  fs_surface: glsl`
    surface.BaseColor = getBaseColor(uvOffset);
  `,
}
