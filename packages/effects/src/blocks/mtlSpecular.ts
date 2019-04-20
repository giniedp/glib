import { glsl } from '../glsl'

export interface MtlSpecularDefs {
  /**
   * Enables a specular texture
   */
  SPECULAR_MAP?: any
  /**
   * Defines the uv accessor
   *
   * @remarks
   * defaults to `vTexture.xy`
   */
  SPECULAR_MAP_UV?: any
  /**
   * Enables a specular color
   */
  SPECULAR_COLOR?: any
  /**
   * Enables the specular power uniform
   */
  SPECULAR_POWER?: any
}

/**
 * Adds Specular texture / color to the shader
 *
 * @remarks
 * Uses defines
 *
 * - `SPECULAR_MAP` Enables a specular texture
 * - `SPECULAR_MAP_UV` defaults to `vTexture.xy`
 * - `SPECULAR_COLOR` Enables a specular color
 */
export const MTL_SPECULAR = Object.freeze({
  defines: glsl`
    #ifdef SPECULAR_MAP
      #if !defined(V_TEXTURE1) || !defined(V_TEXTURE1)
      #define V_TEXTURE1
      #endif
    #endif
    #ifndef SPECULAR_MAP_UV
    #define SPECULAR_MAP_UV vTexture.xy
    #endif
  `,
  uniforms: glsl`
    #ifdef SPECULAR_COLOR
    // @binding SpecularColor
    // @widget   color
    // @default  [1, 1, 1]
    uniform vec3 uSpecularColor;
    #endif

    #ifdef SPECULAR_MAP
    // @binding SpecularMap
    // @filter   LinearWrap
    uniform sampler2D uSpecularMap;
    #endif

    #ifdef SPECULAR_MAP_OFFSET_SCALE
    // @binding SpecularMapOffsetScale
    uniform vec4 uSpecularMapOffsetScale;
    #endif

    #ifdef SPECULAR_POWER
    // @binding SpecularPower
    uniform float uSpecularPower;
    #endif
  `,

  fs_surface: glsl`
    #if defined(SPECULAR_MAP)
    #ifdef SPECULAR_MAP_OFFSET_SCALE
    surface.Specular = texture2D(uSpecularMap, uSpecularMapOffsetScale.xy + uSpecularMapOffsetScale.zw * SPECULAR_MAP_UV);
    #else
    surface.Specular = texture2D(uSpecularMap, SPECULAR_MAP_UV);
    #endif
    #ifdef SPECULAR_COLOR
    surface.Specular.rgb *= uSpecularColor;
    #endif

    #elif defined(SPECULAR_COLOR)
    surface.Specular = vec4(uSpecularColor, 1.0);
    #endif

    #ifdef SPECULAR_POWER
    surface.Specular.a = uSpecularPower;
    #endif
  `,
})
