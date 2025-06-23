import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control occlusion mapping.
 *
 * @public
 */
export interface MtlOcclusionDefs {
  OCCLUSION_MAP?: boolean
  OCCLUSION_MAP_UV?: string
  OCCLUSION_MAP_CHANNEL?: string
  OCCLUSION_MAP_SCALE_OFFSET?: boolean
  OCCLUSION_MAP_TRANSFORM?: boolean
}

/**
 * Adds Occlusion texture to the shader. See {@link MtlOcclusionDefs}
 * @public
 */
export const MTL_OCCLUSION: ShaderChunkSet<MtlOcclusionDefs> = {
  defines: glsl`
    #ifdef OCCLUSION_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE)
        #define V_TEXTURE
      #endif

      #ifndef OCCLUSION_MAP_UV
        #define OCCLUSION_MAP_UV vTexture.xy
      #endif

      #ifndef OCCLUSION_MAP_CHANNEL
        #define OCCLUSION_MAP_CHANNEL r
      #endif
    #endif
  `,
  uniforms: glsl`
    #ifdef OCCLUSION_MAP
    // @binding  OcclusionMap
    uniform sampler2D uOcclusionMap;
    #endif

    #ifdef OCCLUSION_MAP_SCALE_OFFSET
    // @binding OcclusionMapScaleOffset
    uniform vec4 uOcclusionMapScaleOffset;
    #endif

    #ifdef OCCLUSION_MAP_TRANSFORM
    // @binding OcclusionMapTransform
    uniform mat3 uOcclusionMapTransform;
    #endif
  `,
  functions: glsl`
    #ifdef OCCLUSION_MAP
    vec2 getOcclusionMapUV() {
      vec2 result = OCCLUSION_MAP_UV;

      #ifdef OCCLUSION_MAP_SCALE_OFFSET
      result = result * uOcclusionMapScaleOffset.xy + uOcclusionMapScaleOffset.zw;
      #endif

      #ifdef OCCLUSION_MAP_TRANSFORM
      result = (uOcclusionMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    vec3 getOcclusionColor(vec2 uvOffset) {
      vec3 color = vec3(1.0);

      #ifdef OCCLUSION_MAP
      color *= texture2D(uOcclusionMap, getOcclusionMapUV() + uvOffset).OCCLUSION_MAP_CHANNEL;
      #endif

      return color;
    }
  `,
  fs_shade_after: glsl`
    #ifdef OCCLUSION_MAP
    color.rgb *= getOcclusionColor(uvOffset);
    #endif
  `,
}
