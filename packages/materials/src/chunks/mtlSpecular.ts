import { ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control specular color contribution.
 *
 * @public
 */
export interface MtlSpecularDefs {
  /**
   * Adds a color uniform
   *
   * @remarks
   * - Adds `uniform vec4 uSpecularColor`
   * - Binds as `SpecularColor`
   * - Default is `[1, 1, 1, 1]`
   */
  SPECULAR_COLOR?: boolean

  /**
   * Adds a texture uniform
   *
   * @remarks
   * - Adds `uniform sampler2D uSpecularColorMap`
   * - Binds as `SpecularColorMap`
   */
  SPECULAR_COLOR_MAP?: boolean

  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  SPECULAR_COLOR_MAP_UV?: string

  /**
   * Adds a uniform to offset and scale the texture voordinates
   *
   * @remarks
   * - Adds `uniform vec4 uSpecularColorMapScaleOffset`.
   * - Binds as `SpecularColorMapScaleOffset`
   */
  SPECULAR_COLOR_MAP_SCALE_OFFSET?: boolean

  /**
   * Adds a transform matrix for texture coordinates that is used to transform the texture coordinates.
   *
   * @remarks
   * - Adds `uniform mat3 uSpecularColorMapTransform`
   * - Binds as `SpecularColorMapTransform`
   */
  SPECULAR_COLOR_MAP_TRANSFORM?: boolean
}

/**
 * Contributes specular color to the shader. See {@link MtlSpecularDefs}
 * @public
 */
export const MTL_SPECULAR: ShaderChunkSet<MtlSpecularDefs> = {
  defines: /* glsl */ `
    #ifdef SPECULAR_COLOR_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef SPECULAR_COLOR_MAP_UV
        #define SPECULAR_COLOR_MAP_UV vTexture.xy
      #endif
    #endif


  `,
  uniforms: /* glsl */ `


    #ifdef SPECULAR_COLOR
    // @binding SpecularColor
    // @widget  color
    // @default [1, 1, 1]
    uniform vec3 uSpecularColor;
    #endif

    #ifdef SPECULAR_COLOR_MAP
    // @binding SpecularColorMap
    uniform sampler2D uSpecularColorMap;
    #endif

    #ifdef SPECULAR_COLOR_MAP_SCALE_OFFSET
    // @binding SpecularColorMapScaleOffset
    uniform vec4 uSpecularColorMapScaleOffset;
    #endif

    #ifdef SPECULAR_COLOR_MAP_TRANSFORM
    // @binding SpecularColorMapTransform
    uniform mat3 uSpecularColorMapTransform;
    #endif
  `,
  functions: /* glsl */ `
    #ifdef SPECULAR_COLOR_MAP
    vec2 getSpecularColorMapUV() {
      vec2 result = SPECULAR_COLOR_MAP_UV;

      #ifdef SPECULAR_COLOR_MAP_SCALE_OFFSET
      result = result * uSpecularColorMapScaleOffset.xy + uSpecularColorMapScaleOffset.zw;
      #endif

      #ifdef SPECULAR_COLOR_MAP_TRANSFORM
      result = (uSpecularColorMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    vec3 getSpecularColor(vec2 uvOffset) {
      vec3 color = vec3(1.0, 1.0, 1.0);

      #ifdef SPECULAR_COLOR_MAP
      color *= texture2D(uSpecularColorMap, getSpecularColorMapUV() + uvOffset).rgb;
      #endif

      #ifdef SPECULAR_COLOR
      color *= uSpecularColor;
      #endif

      return color;
    }

  `,
  fs_surface: /* glsl */ `
    surface.Specular.rgb = getSpecularColor(uvOffset);
  `,
}
