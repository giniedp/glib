import { ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control emissive color contribution.
 *
 * @public
 */
export interface MtlEmissionDefs {
  EMISSIVE_COLOR?: boolean
  EMISSIVE_COLOR_MAP?: boolean
  EMISSIVE_COLOR_MAP_UV?: string
  EMISSIVE_COLOR_MAP_SCALE_OFFSET?: boolean
  EMISSIVE_COLOR_MAP_TRANSFORM?: boolean
}

/**
 * Contributes emission lighting and mapping to the shader. See {@link MtlEmissionDefs}
 * @public
 */
export const MTL_EMISSION: ShaderChunkSet<MtlEmissionDefs> = {
  defines: /* glsl */ `
    #ifdef EMISSIVE_COLOR_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef EMISSIVE_COLOR_MAP_UV
        #define EMISSIVE_COLOR_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: /* glsl */ `
    #ifdef EMISSIVE_COLOR
    // @binding EmissiveColor
    // @widget  color
    // @default [0, 0, 0]
    uniform vec3 uEmissiveColor;
    #endif

    #ifdef EMISSIVE_COLOR_MAP
    // @binding EmissiveColorMap
    uniform sampler2D uEmissiveColorMap;
    #endif

    #ifdef EMISSIVE_COLOR_MAP_SCALE_OFFSET
    // @binding EmissiveColorMapScaleOffset
    uniform vec4 uEmissiveColorMapScaleOffset;
    #endif

    #ifdef EMISSIVE_COLOR_MAP_TRANSFORM
    // @binding EmissiveColorMapTransform
    uniform mat3 uEmissiveColorMapTransform;
    #endif
  `,
  fs_functions: /* glsl */ `
    #ifdef EMISSIVE_COLOR_MAP
    vec2 getEmissiveColorMapUV() {
      vec2 result = EMISSIVE_COLOR_MAP_UV;

      #ifdef EMISSIVE_COLOR_MAP_SCALE_OFFSET
      result = result * uEmissiveColorMapScaleOffset.xy + uEmissiveColorMapScaleOffset.zw;
      #endif

      #ifdef EMISSIVE_COLOR_MAP_TRANSFORM
      result = (uEmissiveColorMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    vec3 getEmissiveColor(vec2 uvOffset) {
      vec3 color = vec3(0.0);

      #if defined(EMISSIVE_COLOR_MAP)
      color.rgb = texture2D(uEmissiveColorMap, getEmissiveColorMapUV() + uvOffset).rgb;
        #ifdef EMISSIVE_COLOR
        color.rgb *= uEmissiveColor;
        #endif
      #elif defined(EMISSIVE_COLOR)
      color.rgb = uEmissiveColor;
      #endif

      return color;
    }
  `,

  fs_surface: /* glsl */ `
    surface.Emission.rgb = getEmissiveColor(uvOffset);
  `,
}
