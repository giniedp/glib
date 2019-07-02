import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface MtlMetallicRoughness {
  /**
   * Enables the metallic roughness parameters
   */
  METALLIC_ROUGHNESS?: any
  /**
   * Enables the metallic roughness texture
   */
  METALLIC_ROUGHNESS_MAP?: any
  /**
   * Defines the uv accessor
   *
   * @remarks
   * defaults to `vTexture.xy`
   */
  METALLIC_ROUGHNESS_MAP_UV?: any
}

/**
 * Adds Diffuse or Albedo texture / color to the shader
 *
 * @public
 * @remarks
 * Uses defines
 * - `METALLIC_ROUGHNESS` enables metallic and roughness uniforms
 * - `METALLIC_ROUGHNESS_MAP` enables texture
 * - `METALLIC_ROUGHNESS_MAP_UV` defaults to `vTexture.xy`
 */
export const MTL_METALLIC_ROUGHNESS: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef METALLIC_ROUGHNESS_MAP
      #if !defined(V_TEXTURE1) && !defined(V_TEXTURE1)
        #define V_TEXTURE1
      #endif

      #ifndef METALLIC_ROUGHNESS_MAP_UV
        #define METALLIC_ROUGHNESS_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef METALLIC_ROUGHNESS
    // @binding MetallicRoughnessMap
    // @widget  slider;min=0;max=1
    // @default [1, 1]
    uniform vec2 uMetallicRoughness;
    #endif

    #ifdef METALLIC_ROUGHNESS_MAP
    // @binding  MetallicRoughnessMap
    // @filter   LinearWrap
    uniform sampler2D uMetallicRoughnessMap;
    #endif
  `,

  functions: glsl`
    #ifdef METALLIC_ROUGHNESS_MAP
    vec2 getMetallicRoughnessUV() {
      #ifdef METALLIC_ROUGHNESS_MAP_OFFSET_SCALE
      return METALLIC_ROUGHNESS_MAP_UV * uMetallicRoughnessOffsetScale.zw + uMetallicRoughnessOffsetScale.xy
      #else
      return METALLIC_ROUGHNESS_MAP_UV;
      #endif
    }
    #endif

    void getMetallicRoughness(out float metallic, out float roughness, in vec2 uv) {
      #ifdef METALLIC_ROUGHNESS
      metallic = uMetallicRoughness.x;
      roughness = uMetallicRoughness.y;
      #else
      metallic = 1.0;
      roughness = 1.0;
      #endif
      #ifdef METALLIC_ROUGHNESS_MAP
      vec4 sample = texture2D(uMetallicRoughnessMap, uv);
      metallic = sample.b * metallic;
      roughness = sample.g * roughness;
      #endif
      metallic = clamp(metallic, 0.0, 1.0);
      roughness = clamp(roughness, 0.04, 1.0);
    }
  `,
  fs_surface: glsl`
    #if defined(METALLIC_ROUGHNESS_MAP)
    getMetallicRoughness(surface.PBR.r, surface.PBR.g, getMetallicRoughnessUV() + uvOffset);
    #elif defined(METALLIC_ROUGHNESS)
    getMetallicRoughness(surface.PBR.r, surface.PBR.g, uvOffset);
    #endif
  `,
})
