import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control metallic roughness material.
 *
 * @public
 */
export interface MtlMetallicRoughness {
  /**
   * Enables metallic workflow
   *
   * @remarks
   * - Adds `uniform float uMetallic`
   * - Binds as `Metallic`
   */
  METALLIC?: boolean

  /**
   * Enables a roughness uniform
   *
   * @remarks
   * - Adds `uniform float uRoughness`
   * - Binds as `Roughness`
   */
  ROUGHNESS?: boolean

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
   * Allows to transform the texture coordinates
   *
   * @remarks
   * Adds a `uniform mat3 uMetallicRoughnessMapTransform` that is used to transform the texture coordinates.
   * This is done in pixel shader for the MetallicRoughnessMap only.
   */
  METALLIC_ROUGHNESS_MAP_TRANSFORM?: boolean

  /**
   * Defines the texture channel
   *
   * @remarks
   * defaults to `bg` where `b` is for metallic and `g` is for roughness
   */
  METALLIC_ROUGHNESS_MAP_CHANNEL?: string

  /**
   * Allows to specify the channel in texture that contains the specular smoothness.
   *
   * @remarks
   * - Default is `a`
   * - Possible values are `r`, `g`, `b`, `a`
   */
  SMOOTHNESS_MAP_CHANNEL?: string

  /**
   * Adds a dedicated texture for specular smoothness
   *
   * @remarks
   * - Adds `uniform sampler2D uSmoothnessMap`
   * - Binds as `SmoothnessMap`
   */
  SMOOTHNESS_MAP?: boolean

  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  SMOOTHNESS_MAP_UV?: string

  /**
   * Adds a uniform to offset and scale the texture voordinates
   *
   * @remarks
   * - Adds `uniform vec4 uSmoothnessMapScaleOffset`.
   * - Binds as `SmoothnessMapScaleOffset`
   */
  SMOOTHNESS_MAP_SCALE_OFFSET?: boolean

  /**
   * Adds a transform matrix for texture coordinates that is used to transform the texture coordinates.
   *
   * @remarks
   * - Adds `uniform mat3 uSmoothnessMapTransform`
   * - Binds as `SmoothnessMapTransform`
   */
  SMOOTHNESS_MAP_TRANSFORM?: boolean
}

/**
 * Adds Diffuse or Albedo texture / color to the shader. See {@link MtlMetallicRoughness}
 * @public
 */
export const MTL_METALLIC_ROUGHNESS: ShaderChunkSet<MtlMetallicRoughness> = {
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

    #ifdef SMOOTHNESS_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef SMOOTHNESS_MAP_UV
        #define SMOOTHNESS_MAP_UV vTexture.xy
      #endif

      #ifndef SMOOTHNESS_MAP_CHANNEL
        #define SMOOTHNESS_MAP_CHANNEL r
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef METALLIC
    // @binding Metallic
    // @widget  slider;min=0;max=1
    // @default 1
    uniform float uMetallic;
    #endif

    #ifdef ROUGHNESS
    // @binding Roughness
    // @widget  slider;min=0;max=1
    // @default 0
    uniform float uRoughness;
    #endif

    #ifdef METALLIC_ROUGHNESS_MAP
    // @binding  MetallicRoughnessMap
    uniform sampler2D uMetallicRoughnessMap;
    #endif

    #ifdef METALLIC_ROUGHNESS_MAP_SCALE_OFFSET
    // @binding MetallicRoughnessMapScaleOffset
    uniform vec4 uMetallicRoughnessMapScaleOffset;
    #endif

    #ifdef METALLIC_ROUGHNESS_MAP_TRANSFORM
    // @binding MetallicRoughnessMapTransform
    uniform mat3 uMetallicRoughnessMapTransform;
    #endif

    #ifdef SMOOTHNESS_MAP
    // @binding SmoothnessMap
    uniform sampler2D uSmoothnessMap;
    #endif

    #ifdef SMOOTHNESS_MAP_SCALE_OFFSET
    // @binding SmoothnessMapScaleOffset
    uniform vec4 uSmoothnessMapScaleOffset;
    #endif

    #ifdef SMOOTHNESS_MAP_TRANSFORM
    // @binding SmoothnessMapTransform
    uniform mat3 uSmoothnessMapTransform;
    #endif
  `,

  functions: glsl`
    #ifdef METALLIC_ROUGHNESS_MAP
    vec2 getMetallicRoughnessUV() {
      vec2 result = METALLIC_ROUGHNESS_MAP_UV;

      #ifdef METALLIC_ROUGHNESS_MAP_SCALE_OFFSET
      result = result * uMetallicRoughnessMapScaleOffset.xy + uMetallicRoughnessMapScaleOffset.zw;
      #endif

      #ifdef METALLIC_ROUGHNESS_MAP_TRANSFORM
      result = (uMetallicRoughnessMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    #ifdef SMOOTHNESS_MAP
    vec2 getSmoothnessMapUV() {
      vec2 result = SMOOTHNESS_MAP_UV;

      #ifdef SMOOTHNESS_MAP_SCALE_OFFSET
      result = result * uSmoothnessMapScaleOffset.xy + uSmoothnessMapScaleOffset.zw;
      #endif

      #ifdef SMOOTHNESS_MAP_TRANSFORM
      result = (uSmoothnessMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    void getMetallicRoughness(out float metallic, out float roughness, in vec2 uvOffset) {
      metallic = 0.0; // metallic workflow is disabled by default
      roughness = 1.0;

      #if defined(METALLIC) || defined(METALLIC_ROUGHNESS_MAP)
      // enable metallic workflow
      metallic = 1.0;
      #endif

      #ifdef METALLIC
      metallic *= uMetallic;
      #endif

      #ifdef ROUGHNESS
      roughness = uRoughness;
      #endif

      #ifdef METALLIC_ROUGHNESS_MAP
      vec2 metallicRoughness = texture2D(uMetallicRoughnessMap, getMetallicRoughnessUV() + uvOffset).METALLIC_ROUGHNESS_MAP_CHANNEL;
      metallic *= metallicRoughness.x;
      roughness *= metallicRoughness.y;
      #endif

      #ifdef SMOOTHNESS_MAP
      float smoothness = texture2D(uSmoothnessMap, getSmoothnessMapUV() + uvOffset).SMOOTHNESS_MAP_CHANNEL;
      #ifdef ROUGHNESS
      smoothness *= (1.0 - roughness);
      #endif
      roughness = 1.0 - (smoothness);
      #endif

      metallic = clamp(metallic, 0.0, 1.0);
      roughness = clamp(roughness, 0.04, 1.0);
    }
  `,
  functions_before: glsl`

    float getRoughness(in SurfaceParams surface) {
      float roughness = surface.Roughness;
      roughness = max(roughness, 0.0525);
      #if defined(V_NORMAL) && defined(FRAGMENT_SHADER)
      vec3 dxy = max( abs( dFdx( vWorldNormal ) ), abs( dFdy( vWorldNormal ) ) );
      roughness += max(max(dxy.x, dxy.y), dxy.z);
      #endif
      roughness = min(roughness, 1.0);
      return roughness;
    }

    vec3 getF0Dielectric(in SurfaceParams surface) {
      // for specular flow the surface.Ior can be 0 to allow full control over the specular color
      float ior = (surface.Ior - 1.0) / (surface.Ior + 1.0);
      ior = ior * ior;
      return min(ior * surface.Specular.rgb, vec3(1.0));
    }

    vec3 getSpecularWeight(in SurfaceParams surface) {
      #if defined(METALLIC) || defined(METALLIC_ROUGHNESS_MAP)
        // pure metallic workflow
        return vec3(1.0);
      #else
        return vec3(1.0 - surface.Roughness);
      #endif
    }
  `,
  fs_surface: glsl`
    getMetallicRoughness(surface.Metallic, surface.Roughness, uvOffset);
  `,
}
