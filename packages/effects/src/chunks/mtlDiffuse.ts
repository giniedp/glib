import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface MtlDiffuseDefs {
  /**
   * Enables the DiffuseColor
   */
  DIFFUSE_COLOR?: any
  /**
   * Enables the DiffuseMap
   */
  DIFFUSE_MAP?: any
  /**
   * Defines the uv accessor
   *
   * @remarks
   * defaults to `vTexture.xy`
   */
  DIFFUSE_MAP_UV?: any
  /**
   * Adds offset and scale operation on DiffuseMap
   */
  DIFFUSE_MAP_OFFSET_SCALE?: any
}

/**
 * Adds Diffuse or Albedo texture / color to the shader
 *
 * @public
 * @remarks
 * Uses defines
 *
 * - `DIFFUSE_MAP` enables texture
 * - `DIFFUSE_MAP_UV` defaults to `vTexture.xy`
 * - `DIFFUSE_COLOR` enables vertex color
 */
export const MTL_DIFFUSE: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef DIFFUSE_MAP
      #if !defined(V_TEXTURE1) || !defined(V_TEXTURE2)
      #define V_TEXTURE1
      #endif
    #endif
    #ifndef DIFFUSE_MAP_UV
    #define DIFFUSE_MAP_UV vTexture.xy
    #endif
  `,
  uniforms: glsl`
    #ifdef DIFFUSE_COLOR
    // @binding DiffuseColor
    // @widget   color
    // @default  [1, 1, 1]
    uniform vec3 uDiffuseColor;
    #endif

    #ifdef DIFFUSE_MAP
    // @binding  DiffuseMap
    // @filter   LinearWrap
    uniform sampler2D uDiffuseMap;
    #endif

    #ifdef DIFFUSE_MAP_OFFSET_SCALE
    // @binding DiffuseMapOffsetScale
    uniform vec4 uDiffuseMapOffsetScale;
    #endif
  `,

  fs_surface: glsl`
    #if defined(DIFFUSE_MAP)
    #ifdef DIFFUSE_MAP_OFFSET_SCALE
    surface.Diffuse = texture2D(uDiffuseMap, uDiffuseMapOffsetScale.xy + uDiffuseMapOffsetScale.zw * DIFFUSE_MAP_UV);
    #else
    surface.Diffuse = texture2D(uDiffuseMap, DIFFUSE_MAP_UV);
    #endif
    #ifdef DIFFUSE_COLOR
    surface.Diffuse.rgb *= uDiffuseColor;
    #endif

    #elif defined(DIFFUSE_COLOR)
    surface.Diffuse = vec4(uDiffuseColor, 1.0);
    #elif defined(V_COLOR1)
    surface.Diffuse = vec4(vColor, 1.0);
    #elif defined(V_COLOR2)
    surface.Diffuse = vec4(vColor2, 1.0);
    #endif
  `,
})
