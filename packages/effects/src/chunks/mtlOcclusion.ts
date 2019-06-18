// tslint:disable:max-line-length
import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

export interface MtlOcclusionDefs {
  /**
   * Enables the occlusion texture
   */
  OCCLUSION_MAP?: any
  /**
   * Defines the uv accessor
   *
   * @remarks
   * defaults to `vTexture.xy`
   */
  OCCLUSION_MAP_UV?: any
  /**
   * Defines the texture channel which should be used for occlusion
   *
   * @remarks
   * defaults to `rgb`
   */
  OCCLUSION_MAP_CHANNEL?: any
  /**
   * Adds offset and scale operation on OcclusionMap
   */
  OCCLUSION_MAP_OFFSET_SCALE?: any
}

/**
 * Adds Occlusion texture to the shader
 *
 * @remarks
 * Uses defines
 *
 * - `OCCLUSION_MAP` enables texture
 * - `OCCLUSION_MAP_UV` defaults to `vTexture.xy`
 * - `OCCLUSION_MAP_CHANNEL` defaults to `rgb`
 */
export const MTL_OCCLUSION: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef OCCLUSION_MAP
      #if !defined(V_TEXTURE1) || !defined(V_TEXTURE1)
      #define V_TEXTURE1
      #endif
    #endif
    #ifndef OCCLUSION_MAP_UV
    #define OCCLUSION_MAP_UV vTexture.xy
    #endif
    #ifndef OCCLUSION_MAP_CHANNEL
    #define OCCLUSION_MAP_CHANNEL r
    #endif
  `,
  uniforms: glsl`
    #ifdef OCCLUSION_MAP
    // @binding  OcclusionMap
    // @filter   LinearWrap
    uniform sampler2D uOcclusionMap;
    #endif

    #ifdef OCCLUSION_MAP_OFFSET_SCALE
    // @binding OcclusionMapOffsetScale
    uniform vec4 uOcclusionMapOffsetScale;
    #endif
  `,

  fs_shade_after: glsl`
    #ifdef OCCLUSION_MAP
    #ifdef OCCLUSION_MAP_OFFSET_SCALE
    color.rgb *= texture2D(uOcclusionMap, uOcclusionMapOffsetScale.xy + uOcclusionMapOffsetScale.zw * OCCLUSION_MAP_UV).OCCLUSION_MAP_CHANNEL;
    #else
    color.rgb *= texture2D(uOcclusionMap, OCCLUSION_MAP_UV).OCCLUSION_MAP_CHANNEL;
    #endif
    #endif
  `,
})
