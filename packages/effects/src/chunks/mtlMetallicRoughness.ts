import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * Describes preprocessor definitions which control metallic roughness material.
 *
 * @public
 */
export interface MtlMetallicRoughness {
  /**
   * Enables uniform metallic roughness material
   *
   * @remarks
   * Adds a `uniform vec2 uMetallicRoughness` (bound as `MetallicRoughness`)
   * that provides metallic and roughness values.
   */
  METALLIC_ROUGHNESS?: boolean
  /**
   * Enables metallic roughness material texture
   *
   * @remarks
   * Adds a `uniform vec2 uMetallicRoughnessMap` (bound as `MetallicRoughnessMap`)
   * that provides metallic and roughness values.
   */
  METALLIC_ROUGHNESS_MAP?: boolean
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  METALLIC_ROUGHNESS_MAP_UV?: string
  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uMetallicRoughnessMapScaleOffset` that is used to transform the texture coordinates.
   * This is done in pixel shader for the MetallicRoughnessMap only.
   */
  METALLIC_ROUGHNESS_MAP_SCALE_OFFSET?: boolean
  /**
   * Defines the texture channel
   *
   * @remarks
   * defaults to `bg` where `b` is for metallic and `g` is for roughness
   */
  METALLIC_ROUGHNESS_MAP_CHANNEL?: string
}

/**
 * Adds Diffuse or Albedo texture / color to the shader. See {@link MtlMetallicRoughness}
 * @public
 */
export const FXC_MTL_METALLIC_ROUGHNESS: ShaderChunkSet<MtlMetallicRoughness> = Object.freeze({
  defines: glsl`
    #ifdef METALLIC_ROUGHNESS_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE)
        #define V_TEXTURE
      #endif

      #ifndef METALLIC_ROUGHNESS_MAP_UV
        #define METALLIC_ROUGHNESS_MAP_UV vTexture.xy
      #endif

      #ifndef METALLIC_ROUGHNESS_MAP_CHANNEL
        #define METALLIC_ROUGHNESS_MAP_CHANNEL bg
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef METALLIC_ROUGHNESS
    // @binding MetallicRoughness
    // @widget  slider;min=0;max=1
    // @default [1, 1]
    uniform vec2 uMetallicRoughness;
    #endif

    #ifdef METALLIC_ROUGHNESS_MAP
    // @binding  MetallicRoughnessMap
    // @filter   LinearWrap
    uniform sampler2D uMetallicRoughnessMap;
    #endif

    #ifdef METALLIC_ROUGHNESS_MAP_SCALE_OFFSET
    // @binding MetallicRoughnessMapScaleOffset
    uniform vec4 uMetallicRoughnessMapScaleOffset;
    #endif
  `,

  functions: glsl`
    #ifdef METALLIC_ROUGHNESS_MAP
    vec2 getMetallicRoughnessUV() {
      #ifdef METALLIC_ROUGHNESS_MAP_SCALE_OFFSET
      return METALLIC_ROUGHNESS_MAP_UV * uMetallicRoughnessMapScaleOffset.xy + uMetallicRoughnessMapScaleOffset.zw
      #else
      return METALLIC_ROUGHNESS_MAP_UV;
      #endif
    }
    #endif

    void getMetallicRoughness(out vec2 metallicRoughness, in vec2 uv) {
      #ifdef METALLIC_ROUGHNESS
      metallicRoughness.xy = uMetallicRoughness.xy;
      #else
      metallicRoughness.xy = vec2(1.0, 1.0);
      #endif
      #ifdef METALLIC_ROUGHNESS_MAP
      metallicRoughness.xy *= texture2D(uMetallicRoughnessMap, uv).METALLIC_ROUGHNESS_MAP_CHANNEL;
      #endif
      metallicRoughness.x = clamp(metallicRoughness.x, 0.0, 1.0);
      metallicRoughness.y = clamp(metallicRoughness.y, 0.04, 1.0);
    }
  `,
  fs_surface: glsl`
    #if defined(METALLIC_ROUGHNESS_MAP)
    getMetallicRoughness(surface.PBR.rg, getMetallicRoughnessUV() + uvOffset);
    #elif defined(METALLIC_ROUGHNESS)
    getMetallicRoughness(surface.PBR.rg, uvOffset);
    #endif
  `,
})
