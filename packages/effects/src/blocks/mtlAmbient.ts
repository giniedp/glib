import { glsl } from '../glsl'

export interface MtlAmbientDefs {
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
   * Enables the ambient color
   */
  AMBIENT_COLOR?: any
}

/**
 * Adds Diffuse or Albedo texture / color to the shader
 *
 * @remarks
 * Uses defines
 *
 * - `AMBIENT_MAP` enables texture
 * - `AMBIENT_MAP_UV` defaults to `vTexture.xy`
 * - `AMBIENT_COLOR` enables vertex color
 */
export const MTL_AMBIENT = Object.freeze({
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
    #ifdef DIFFUSE_COLOR
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
    void applyAmbientMtl(inout vec3 color) {
      #if defined(AMBIENT_MAP) && defined(AMBIENT_COLOR)
      color *= (texture2D(uAmbientMap, AMBIENT_MAP_UV).rgb * uAmbientColor);
      #elif defined(AMBIENT_MAP)
      color *= texture2D(uAmbientMap, AMBIENT_MAP_UV).rgb;
      #elif defined(AMBIENT_COLOR)
      color *= uAmbientColor;
      #endif
    }
  `,
  fs_shade_after: glsl`
    #if defined(AMBIENT_MAP) || defined(AMBIENT_COLOR)
    applyAmbientMtl(color)
    #endif
  `,
})
