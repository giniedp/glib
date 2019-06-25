import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface MtlAmbientDefs {
  /**
   * Enables constant AmbientColor
   */
  AMBIENT_COLOR?: any
  /**
   * Enables the ambient texture
   */
  AMBIENT_MAP?: any
  /**
   * Defines the uv accessor
   *
   * @remarks
   * defaults to `vTexture.xy`
   */
  AMBIENT_MAP_UV?: any
  /**
   * Adds offset and scale operation on AmbientMap
   */
  AMBIENT_MAP_OFFSET_SCALE?: any
}

/**
 * Adds Diffuse or Albedo texture / color to the shader
 *
 * @public
 * @remarks
 * Uses defines
 *
 * - `AMBIENT_MAP` enables texture
 * - `AMBIENT_MAP_UV` defaults to `vTexture.xy`
 * - `AMBIENT_COLOR` enables vertex color
 */
export const MTL_AMBIENT: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef AMBIENT_MAP
      #if !defined(V_TEXTURE1) || !defined(V_TEXTURE2)
      #define V_TEXTURE1
      #endif
    #endif
    #ifndef AMBIENT_MAP_UV
    #define AMBIENT_MAP_UV vTexture.xy
    #endif
  `,
  uniforms: glsl`
    #ifdef AMBIENT_COLOR
    // @binding AmbientColor
    // @widget   color
    // @default  [1, 1, 1]
    uniform vec3 uAmbientColor;
    #endif

    #ifdef AMBIENT_MAP
    // @binding  AmbientMap
    // @filter   LinearWrap
    uniform sampler2D uAmbientMap;
    #endif
  `,
  functions: glsl`
    highp vec3 getAmbientColor() {
      #if defined(AMBIENT_MAP) && defined(AMBIENT_COLOR)
      return (texture2D(uAmbientMap, AMBIENT_MAP_UV).rgb * uAmbientColor);
      #elif defined(AMBIENT_MAP)
      return texture2D(uAmbientMap, AMBIENT_MAP_UV).rgb;
      #elif defined(AMBIENT_COLOR)
      return uAmbientColor;
      #endif
      return vec3(0, 0, 0);
    }
  `,

})
