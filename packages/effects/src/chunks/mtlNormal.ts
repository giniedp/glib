// tslint:disable:max-line-length
import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface MtlNormalDefs {
  /**
   * Adds NormalMap texture
   */
  NORMAL_MAP?: any
  /**
   * Defines the uv accessor
   *
   * @remarks
   * defaults to `vTexture.xy`
   */
  NORMAL_MAP_UV?: any
  /**
   * Adds offset and scale operation on NormalMap
   */
  NORMAL_MAP_OFFSET_SCALE?: any
}

/**
 * Adds Diffuse or Albedo texture / color to the shader
 *
 * @public
 * @remarks
 * Uses defines
 *
 * - `NORMAL_MAP` enables texture
 * - `NORMAL_MAP_UV` defaults to `vTexture.xy`
 */
export const MTL_NORMAL: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef NORMAL_MAP

    #if !defined(V_TEXTURE1) && !defined(V_TEXTURE1)
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
    // @filter   LinearWrap
    uniform sampler2D uNormalMap;

    #ifdef NORMAL_MAP_OFFSET_SCALE
    // @binding NormalMapOffsetScale
    uniform vec4 uNormalMapOffsetScale;
    #endif

    #endif
  `,
  functions: glsl`
    #ifdef NORMAL_MAP
    vec2 getNormalMapUV() {
      #ifdef NORMAL_MAP_OFFSET_SCALE
      return NORMAL_MAP_UV * uNormalMapOffsetScale.zw + uNormalMapOffsetScale.xy;
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
  `,
})
