import { ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface DisplacementDefs {
  /**
   * Adds a displacement texture uniform
   *
   * @remarks
   * - Adds `uniform sampler2D uDisplacementMap`
   * - Binds as `DisplacementMap`
   */
  DISPLACEMENT_MAP?: boolean

  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  DISPLACEMENT_MAP_UV?: string

  /**
   * Adds a uniform to offset and scale the texture voordinates
   *
   * @remarks
   * - Adds `uniform vec4 uDisplacementMapScaleOffset`.
   * - Binds as `DisplacementMapScaleOffset`
   */
  DISPLACEMENT_MAP_SCALE_OFFSET?: boolean
}

/**
 * @public
 */
export const MTL_DISPLACEMENT: ShaderChunkSet<DisplacementDefs> = {
  defines: /* glsl */ `
    #ifdef DISPLACEMENT_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef DISPLACEMENT_MAP_UV
        #define DISPLACEMENT_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  attributes: /* glsl */ `

  `,
  uniforms: /* glsl */ `
    #ifdef DISPLACEMENT_MAP
    // @binding DisplacementMap
    uniform sampler2D uDisplacementMap;
    #endif

    #ifdef DISPLACEMENT_MAP_SCALE_OFFSET
    // @binding DisplacementMapScaleOffset
    uniform vec4 uDisplacementMapScaleOffset;
    #endif
  `,

  vs_functions: /* glsl */ `
    #ifdef DISPLACEMENT_MAP
    vec2 getDisplacementMapUV() {
      vec2 result = DISPLACEMENT_MAP_UV;

      #ifdef DISPLACEMENT_MAP_SCALE_OFFSET
      result = result * uDisplacementMapScaleOffset.xy + uDisplacementMapScaleOffset.zw;
      #endif

      #ifdef DISPLACEMENT_MAP_TRANSFORM
      result = (uDisplacementMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    float getDisplacement() {
      float value = 0.0;

      #if defined(DISPLACEMENT_MAP)
        value += texture2D(uDisplacementMap, getDisplacementMapUV());
      #endif

      return value;
    }
  `,

  read_vertex_position: /* glsl */ `
    #ifdef DISPLACEMENT_MAP
    position = position + readNormal() * getDisplacement();
    #endif
  `,
}
