import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface MtlSpecularDefs {
  /**
   * Adds `uSpecularPower` float uniform with a binding to `SpecularPower` parameter
   */
  SPECULAR_POWER?: any
  /**
   * Adds `uSpecularColor` uniform with a binding to `SpecularColor` parameter
   */
  SPECULAR_COLOR?: any
  /**
   * Adds `uSpecularMap` sampler uniform with a binding to `SpecularMap` parameter
   */
  SPECULAR_MAP?: any
  /**
   * Defines the texture accessor coordinates
   *
   * @remarks
   * defaults to `vTexture.xy`
   */
  SPECULAR_MAP_UV?: any
  /**
   * Adds `uSpecularMapOffsetScale` uniform with a binding to `SpecularMapOffsetScale`
   *
   * @remarks
   * This adds texture offset and scale operations at pixel shader level.
   */
  SPECULAR_MAP_OFFSET_SCALE?: any
}

/**
 * Adds Specular color contribution to the shader
 *
 * @public
 * @remarks
 * Defines used in this chunk
 *
 * - `SPECULAR_POWER` - Adds `SpecularPower` parameter
 * - `SPECULAR_COLOR` - Adds `SpecularColor` parameter
 * - `SPECULAR_MAP` - Adds `SpecularMap` parameter. Automatically defines `V_TEXTURE1`.
 * - `SPECULAR_MAP_UV` - defaults to `vTexture.xy`
 * - `SPECULAR_MAP_OFFSET_SCALE` - Adds `SpecularMapOffsetScale` parameter
 */
export const MTL_SPECULAR: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef SPECULAR_MAP
      #if !defined(V_TEXTURE1) && !defined(V_TEXTURE1)
        #define V_TEXTURE1
      #endif

      #ifndef SPECULAR_MAP_UV
        #define SPECULAR_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef SPECULAR_POWER
    // @binding SpecularPower
    uniform float uSpecularPower;
    #endif

    #ifdef SPECULAR_COLOR
    // @binding SpecularColor
    // @widget  color
    // @default [1, 1, 1]
    uniform vec3 uSpecularColor;
    #endif

    #ifdef SPECULAR_MAP
    // @binding SpecularMap
    // @filter  LinearWrap
    uniform sampler2D uSpecularMap;
    #endif

    #ifdef SPECULAR_MAP_OFFSET_SCALE
    // @binding SpecularMapOffsetScale
    uniform vec4 uSpecularMapOffsetScale;
    #endif
  `,
  functions: glsl`
    #ifdef SPECULAR_MAP
    vec2 getSpecularMapUV() {
      #ifdef SPECULAR_MAP_OFFSET_SCALE
      return SPECULAR_MAP_UV * uSpecularMapOffsetScale.zw + uSpecularMapOffsetScale.xy;
      #else
      return SPECULAR_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_surface: glsl`
    #if defined(SPECULAR_MAP)
    surface.Specular = texture2D(uSpecularMap, getSpecularMapUV() + uvOffset);

      #ifdef SPECULAR_COLOR
    surface.Specular.rgb *= uSpecularColor;
      #endif

    #elif defined(SPECULAR_COLOR)
    surface.Specular = vec4(uSpecularColor, 1.0);
    #else
    surface.Specular = vec4(surface.Diffuse.rgb, 1.0);
    #endif

    #ifdef SPECULAR_POWER
    surface.Specular.a = uSpecularPower;
    #endif
  `,
})
