import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * Describes preprocessor definitions which control occlusion mapping.
 *
 * @public
 */
export interface MtlOcclusionDefs {
  /**
   * Enables occlusion texture
   *
   * @remarks
   * Adds a `uniform sampler2D uOcclusionMap` (bound as `OcclusionMap`)
   * that is multiplied to the final output color.
   *
   * The occlusion map can also be used as light map.
   */
  OCCLUSION_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  OCCLUSION_MAP_UV?: string
  /**
   * Defines the texture channels (defaults to `r`)
   */
  OCCLUSION_MAP_CHANNEL?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uOcclusionMapScaleOffset` (bound as `OcclusionMapScale`)Offset
   * that is used to transform the texture coordinates.
   * This is done in pixel shader for the OcclusionMap only.
   */
  OCCLUSION_MAP_SCALE_OFFSET?: boolean
}

/**
 * Adds Occlusion texture to the shader. See {@link MtlOcclusionDefs}
 */
export const FXC_MTL_OCCLUSION: ShaderChunkSet<MtlOcclusionDefs> = Object.freeze({
  defines: glsl`
    #ifdef OCCLUSION_MAP
      #if !defined(V_TEXTURE1) && !defined(V_TEXTURE1)
        #define V_TEXTURE1
      #endif

      #ifndef OCCLUSION_MAP_UV
        #define OCCLUSION_MAP_UV vTexture.xy
      #endif

      #ifndef OCCLUSION_MAP_CHANNEL
        #define OCCLUSION_MAP_CHANNEL r
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef OCCLUSION_MAP
    // @binding  OcclusionMap
    // @filter   LinearWrap
    uniform sampler2D uOcclusionMap;
    #endif

    #ifdef OCCLUSION_MAP_SCALE_OFFSET
    // @binding OcclusionMapScaleOffset
    uniform vec4 uOcclusionMapScaleOffset;
    #endif
  `,
  functions: glsl`
    #ifdef OCCLUSION_MAP
    vec2 getOcclusionMapUV() {
      #ifdef OCCLUSION_MAP_SCALE_OFFSET
      return OCCLUSION_MAP_UV * uOcclusionMapScaleOffset.xy + uOcclusionMapScaleOffset.zw;
      #else
      return OCCLUSION_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_shade_after: glsl`
    #ifdef OCCLUSION_MAP
    color.rgb *= texture2D(uOcclusionMap, getOcclusionMapUV() + uvOffset).OCCLUSION_MAP_CHANNEL;
    #endif
  `,
})
