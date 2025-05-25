import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control specular color contribution.
 *
 * @public
 */
export interface MtlSpecularDefs {
  /**
   * Enables a uniform specular power value
   *
   * @remarks
   * Adds a `uniform float uSpecularPower` (bound as `SpecularPower`)
   * that is used as specular power exponent.
   */
  SPECULAR_POWER?: boolean
  /**
   * Enables a uniform specular color
   *
   * @remarks
   * Adds a `uniform vec3 uSpecularColor` (bound as `SpecularColor`)
   * that is used as specular color.
   * If a `SpecularMap` is used, then both are multiplied.
   */
  SPECULAR_COLOR?: boolean
  /**
   * Enables specular color from texture
   *
   * @remarks
   * Adds a `uniform sampler2D uSpecularMap` that is used as surface color.
   * If a `SpecularColor` is used, then both are multiplied.
   * The uniform is bound as `SpecularMap`.
   */
  SPECULAR_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  SPECULAR_MAP_UV?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uSpecularMapScaleOffset` that is used to transform the texture coordinates.
   * This is done in pixel shader for the SpecularMap only.
   */
  SPECULAR_MAP_SCALE_OFFSET?: boolean
}

/**
 * Contributes specular color to the shader. See {@link MtlSpecularDefs}
 * @public
 */
export const FXC_MTL_SPECULAR: ShaderChunkSet<MtlSpecularDefs> = Object.freeze({
  defines: glsl`
    #ifdef SPECULAR_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef SPECULAR_MAP_UV
        #define SPECULAR_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef SPECULAR_POWER
    // @binding SpecularPower
    uniform float uSpecularPower;
    #endif

    #ifdef SPECULAR_COLOR
    // @binding SpecularColor
    // @widget  color
    // @default [1, 1, 1]
    uniform vec3 uSpecularColor;
    #endif

    #ifdef SPECULAR_MAP
    // @binding SpecularMap
    // @filter  LinearWrap
    uniform sampler2D uSpecularMap;
    #endif

    #ifdef SPECULAR_MAP_SCALE_OFFSET
    // @binding SpecularMapScaleOffset
    uniform vec4 uSpecularMapScaleOffset;
    #endif
  `,
  functions: glsl`
    #ifdef SPECULAR_MAP
    vec2 getSpecularMapUV() {
      #ifdef SPECULAR_MAP_SCALE_OFFSET
      return SPECULAR_MAP_UV * uSpecularMapScaleOffset.xy + uSpecularMapScaleOffset.zw;
      #else
      return SPECULAR_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_surface: glsl`
    #if defined(SPECULAR_MAP)
    surface.Specular = texture2D(uSpecularMap, getSpecularMapUV() + uvOffset);

      #ifdef SPECULAR_COLOR
    surface.Specular.rgb *= uSpecularColor;
      #endif

    #elif defined(SPECULAR_COLOR)
    surface.Specular = vec4(uSpecularColor, 1.0);
    #else
    surface.Specular = vec4(surface.Specular.rgb, 1.0);
    #endif

    #ifdef SPECULAR_POWER
    surface.Specular.a = uSpecularPower;
    #endif
  `,
})
