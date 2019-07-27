import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * Describes preprocessor definitions which control diffuse color contribution.
 *
 * @public
 */
export interface MtlDiffuseDefs {
  /**
   * Enables diffuse color
   *
   * @remarks
   * Adds a `uniform vec3 uDiffuseColor` (bound as `DiffuseColor`)
   * that is used as surface color.
   * If a `DiffuseMap` is used, then both are multiplied.
   */
  DIFFUSE_COLOR?: boolean
  /**
   * Enables diffuse color from texture
   *
   * @remarks
   * Adds a `uniform sampler2D uDiffuseMap` (bound as `DiffuseMap`)
   * that is used as surface color.
   * If a `DiffuseColor` is used, then both are multiplied.
   */
  DIFFUSE_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  DIFFUSE_MAP_UV?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uDiffuseMapScaleOffset` (bound as `DiffuseMapScaleOffset`)
   * that is used to transform the texture coordinates.
   * This is done in pixel shader for the DiffuseMap only.
   */
  DIFFUSE_MAP_SCALE_OFFSET?: boolean
}

/**
 * Contributes diffuse lighting and mapping to the shader. See {@link MtlDiffuseDefs}
 * @public
 */
export const FXC_MTL_DIFFUSE: ShaderChunkSet<MtlDiffuseDefs> = Object.freeze({
  defines: glsl`
    #ifdef DIFFUSE_MAP
      #if !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE1
      #endif

      #ifndef DIFFUSE_MAP_UV
        #define DIFFUSE_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef DIFFUSE_COLOR
    // @binding DiffuseColor
    // @widget  color
    // @default [1, 1, 1]
    uniform vec3 uDiffuseColor;
    #endif

    #ifdef DIFFUSE_MAP
    // @binding DiffuseMap
    // @filter  LinearWrap
    uniform sampler2D uDiffuseMap;
    #endif

    #ifdef DIFFUSE_MAP_SCALE_OFFSET
    // @binding DiffuseMapScaleOffset
    uniform vec4 uDiffuseMapScaleOffset;
    #endif
  `,
  functions: glsl`
    #ifdef DIFFUSE_MAP
    vec2 getDiffuseMapUV() {
      #ifdef DIFFUSE_MAP_SCALE_OFFSET
      return DIFFUSE_MAP_UV * uDiffuseMapScaleOffset.xy + uDiffuseMapScaleOffset.zw;
      #else
      return DIFFUSE_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_surface: glsl`
    #if defined(DIFFUSE_MAP)
    surface.Diffuse = texture2D(uDiffuseMap, getDiffuseMapUV() + uvOffset);
      #ifdef DIFFUSE_COLOR
    surface.Diffuse.rgb *= uDiffuseColor;
      #endif

    #elif defined(DIFFUSE_COLOR)
    surface.Diffuse = vec4(uDiffuseColor, 1.0);
    #elif defined(V_COLOR1)
    surface.Diffuse = vec4(vColor, 1.0);
    #elif defined(V_COLOR2)
    surface.Diffuse = vec4(vColor2, 1.0);
    #else
    surface.Diffuse.rgb = vec3(0.0);
    surface.Diffuse.a = 1.0;
    #endif
  `,
})
