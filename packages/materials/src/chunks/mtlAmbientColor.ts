import { ShaderChunkSet } from '@gglib/graphics'

/**
 * Preprocessor definitions to enable ambient lighting
 *
 * @public
 */
export interface MtlAmbientDefs {
  /**
   * Adds ambient lighting with a constant color
   *
   * @remarks
   * - Adds `uniform vec3 uAmbientColor`
   * - Binds as `AmbientColor`
   */
  AMBIENT_COLOR?: boolean

  /**
   * Adds ambient lighting with color from a texture
   *
   * @remarks
   * - Adds `uniform sampler2D uAmbientColorMap`
   * - Binds as `AmbientColorMap`
   */
  AMBIENT_COLOR_MAP?: boolean

  /**
   * Allows to override the UV lookup source
   *
   * @reamrks
   * Defaults to `vTexture.xy`
   */
  AMBIENT_COLOR_MAP_UV?: string

  /**
   * Adds scale/offset uniform to adjust the texture coordinates
   *
   * @remarks
   * - Adds `uniform vec4 uAmbientColorMapScaleOffset`
   * - Binds as `AmbientColorMapScaleOffset`
   */
  AMBIENT_COLOR_MAP_SCALE_OFFSET?: boolean

  /**
   * Adds a transform matrix to adjust the texture coordinates
   *
   * @remarks
   * - Adds `uniform mat3 uAmbientColorMapTransform`
   * - Binds as `AmbientColorMapTransform`
   */
  AMBIENT_COLOR_MAP_TRANSFORM?: boolean
}

/**
 * Contributes ambient lighting and mapping to the shader. See {@link MtlAmbientDefs}
 * @public
 */
export const MTL_AMBIENT: ShaderChunkSet<MtlAmbientDefs> = {
  defines: /* glsl */ `
    #ifdef AMBIENT_COLOR_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef AMBIENT_COLOR_MAP_UV
        #define AMBIENT_COLOR_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: /* glsl */ `
    #ifdef AMBIENT_COLOR
    // @binding AmbientColor
    // @widget  color
    // @default [1, 1, 1]
    uniform vec3 uAmbientColor;
    #endif

    #ifdef AMBIENT_COLOR_MAP
    // @binding AmbientColorMap
    uniform sampler2D uAmbientColorMap;
    #endif

    #ifdef AMBIENT_COLOR_MAP_SCALE_OFFSET
    // @binding AmbientColorMapScaleOffset
    uniform vec4 uAmbientColorMapScaleOffset;
    #endif

    #ifdef AMBIENT_COLOR_MAP_TRANSFORM
    // @binding AmbientColorMapTransform
    uniform mat3 uAmbientColorMapTransform;
    #endif
  `,
  functions: /* glsl */ `
    #ifdef AMBIENT_COLOR_MAP
    vec2 getAmbientColorMapUV() {
      vec2 result = AMBIENT_COLOR_MAP_UV;

      #ifdef AMBIENT_COLOR_MAP_SCALE_OFFSET
      result = result * uAmbientColorMapScaleOffset.xy + uAmbientColorMapScaleOffset.zw;
      #endif

      #ifdef AMBIENT_COLOR_MAP_TRANSFORM
      result = (uAmbientColorMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    vec3 getAmbientColor(vec2 uvOffset) {
      vec3 result = vec3(0.0, 0.0, 0.0);
      #if defined(AMBIENT_COLOR_MAP)
      result += texture2D(uAmbientColorMap, getAmbientColorMapUV() + uvOffset).rgb;
      #endif

      #if defined(AMBIENT_COLOR)
      result += uAmbientColor;
      #endif
      return result;
    }
  `,

  fs_shade_after: /* glsl */ `
    #if defined(AMBIENT_COLOR_MAP) || defined(AMBIENT_COLOR)
    color.rgb += surface.BaseColor.rgb * getAmbientColor(uvOffset);
    #endif
  `,
}
