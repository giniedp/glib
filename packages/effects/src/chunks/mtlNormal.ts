import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * Describes preprocessor definitions which control normal mapping.
 *
 * @public
 */
export interface MtlNormalDefs {
  /**
   * Enables normal color from texture
   *
   * @remarks
   * Adds a `uniform sampler2D uNormalMap` (bound as `NormalMap`) that is used as surface color.
   */
  NORMAL_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  NORMAL_MAP_UV?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uNormalMapScaleOffset` that is used to transform the texture coordinates.
   * This is done in pixel shader for the NormalMap only.
   */
  NORMAL_MAP_SCALE_OFFSET?: boolean
  // /**
  //  * Indicates that the geometry is rendered from both sides
  //  *
  //  * @remarks
  //  * Flips the normal for shading when shaded from back face
  //  */
  // TWOSIDED?: boolean
}

/**
 * Contributes normal lighting and mapping to the shader
 *
 * @public
 * @remarks
 *
 * - {@link MtlNormalDefs.NORMAL_MAP}
 * - {@link MtlNormalDefs.NORMAL_MAP_UV}
 * - {@link MtlNormalDefs.NORMAL_MAP_SCALE_OFFSET}
 */
export const MTL_NORMAL: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef NORMAL_MAP
      #if !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE1
      #endif

      #ifndef NORMAL_MAP_UV
        #define NORMAL_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef NORMAL_MAP
    // @binding NormalMap
    // @filter  LinearWrap
    uniform sampler2D uNormalMap;
    #endif

    #ifdef NORMAL_MAP_SCALE_OFFSET
    // @binding NormalMapScaleOffset
    uniform vec4 uNormalMapScaleOffset;
    #endif
  `,
  functions: glsl`
    #ifdef NORMAL_MAP
    vec2 getNormalMapUV() {
      #ifdef NORMAL_MAP_SCALE_OFFSET
      return NORMAL_MAP_UV * uNormalMapScaleOffset.xy + uNormalMapScaleOffset.zw;
      #else
      return NORMAL_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_surface: glsl`
    #if defined(NORMAL_MAP) && defined(V_TBN)
    surface.Normal.xyz = normalize(vTTW * (texture2D(uNormalMap, getNormalMapUV() + uvOffset).rgb * 2.0 - 1.0));
    #elif defined(V_NORMAL)
    surface.Normal.xyz = normalize(vWorldNormal.xyz);
    #endif
    // #if defined(TWOSIDED)
    // surface.Normal.xyz *= gl_FrontFacing ? 1.0 : -1.0;
    // #endif
  `,
})
