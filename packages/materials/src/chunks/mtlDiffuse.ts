import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control diffuse color contribution.
 *
 * @public
 */
export interface MtlDiffuseDefs {
  /**
   * Enables diffuse color
   *
   * @remarks
   * Adds a `uniform vec4 uDiffuseColor` (bound as `DiffuseColor`)
   * that is used as surface color.
   * If a `DiffuseMap` is used, then both are multiplied.
   */
  DIFFUSE_COLOR?: boolean
  /**
   * Enables diffuse color from texture
   *
   * @remarks
   * Adds a `uniform sampler2D uDiffuseMap` (bound as `DiffuseMap`)
   * that is used as surface color.
   * If a `DiffuseColor` is used, then both are multiplied.
   */
  DIFFUSE_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  DIFFUSE_MAP_UV?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uDiffuseMapScaleOffset` (bound as `DiffuseMapScaleOffset`)
   * that is used to transform the texture coordinates.
   * This is done in pixel shader for the DiffuseMap only.
   */
  DIFFUSE_MAP_SCALE_OFFSET?: boolean
}

/**
 * Contributes diffuse lighting and mapping to the shader. See {@link MtlDiffuseDefs}
 * @public
 */
export const MTL_DIFFUSE: ShaderChunkSet<MtlDiffuseDefs> = {
  defines: glsl`
    #ifdef DIFFUSE_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef DIFFUSE_MAP_UV
        #define DIFFUSE_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef DIFFUSE_COLOR
    // @binding DiffuseColor
    // @widget  color
    // @default [1, 1, 1, 1]
    uniform vec4 uDiffuseColor;
    #endif

    #ifdef DIFFUSE_MAP
    // @binding DiffuseMap
    uniform sampler2D uDiffuseMap;
    #endif

    #ifdef DIFFUSE_MAP_SCALE_OFFSET
    // @binding DiffuseMapScaleOffset
    uniform vec4 uDiffuseMapScaleOffset;
    #endif
  `,
  functions: glsl`
    #ifdef DIFFUSE_MAP
    vec2 getDiffuseMapUV() {
      #ifdef DIFFUSE_MAP_SCALE_OFFSET
      return DIFFUSE_MAP_UV * uDiffuseMapScaleOffset.xy + uDiffuseMapScaleOffset.zw;
      #else
      return DIFFUSE_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_surface: glsl`
    surface.Diffuse = vec4(1.0, 1.0, 1.0, 1.0);
    #if defined(DIFFUSE_MAP)
      surface.Diffuse = texture2D(uDiffuseMap, getDiffuseMapUV() + uvOffset);
    #endif
    #ifdef DIFFUSE_COLOR
      surface.Diffuse *= uDiffuseColor;
    #endif
    #ifdef V_COLOR
      surface.Diffuse.rgb *= vColor.rgb;
    #elif defined(V_COLOR1)
      surface.Diffuse.rgb *= vColor1.rgb;
    #elif defined(V_COLOR2)
      surface.Diffuse.rgb *= vColor2.rgb;
    #endif
  `,
}
