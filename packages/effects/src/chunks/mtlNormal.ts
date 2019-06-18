// tslint:disable:max-line-length
import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

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
 * @remarks
 * Uses defines
 *
 * - `NORMAL_MAP` enables texture
 * - `NORMAL_MAP_UV` defaults to `vTexture.xy`
 */
export const MTL_NORMAL: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef NORMAL_MAP
    #if !defined(V_TEXTURE1) || !defined(V_TEXTURE1)
    #define V_TEXTURE1
    #endif
    #endif
    #ifndef NORMAL_MAP_UV
    #define NORMAL_MAP_UV vTexture.xy
    #endif
  `,
  uniforms: glsl`
    #ifdef NORMAL_MAP
    // @binding NormalMap
    // @filter   LinearWrap
    uniform sampler2D uNormalMap;
    #endif

    #ifdef NORMAL_MAP_OFFSET_SCALE
    // @binding NormalMapOffsetScale
    uniform vec4 uNormalMapOffsetScale;
    #endif
  `,

  fs_surface: glsl`
    #if defined(V_TBN)
    #ifdef NORMAL_MAP
    #ifdef NORMAL_MAP_OFFSET_SCALE
    surface.Normal.xyz = normalize(vTBN * texture2D(uNormalMap, uNormalMapOffsetScale.xy + uNormalMapOffsetScale.zw * NORMAL_MAP_UV).rgb * 2.0 - 1.0);
    #else
    surface.Normal.xyz = normalize(vTBN * texture2D(uNormalMap, NORMAL_MAP_UV).rgb * 2.0 - 1.0);
    #endif
    #endif
    #elif defined(V_NORMAL)
    surface.Normal.xyz = normalize(vWorldNormal.xyz);
    #endif
  `,
})
