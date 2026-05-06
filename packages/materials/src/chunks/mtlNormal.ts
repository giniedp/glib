import { ShaderChunkSet } from '@gglib/graphics'

/**
 * Describes preprocessor definitions which control normal mapping.
 *
 * @public
 */
export interface MtlNormalDefs {
  /**
   * Enables normal color from texture
   *
   * @remarks
   * Adds a `uniform sampler2D uNormalMap` (bound as `NormalMap`) that is used as surface color.
   */
  NORMAL_MAP?: boolean

  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  NORMAL_MAP_UV?: string

  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uNormalMapScaleOffset` that is used to transform the texture coordinates.
   * This is done in pixel shader for the NormalMap only.
   */
  NORMAL_MAP_SCALE_OFFSET?: boolean

  /**
   * Allows to transform the texture coordinates
   *
   * @remarks
   * Adds a `uniform mat3 uNormalMapTransform` that is used to transform the texture coordinates.
   * This is done in pixel shader for the NormalMap only.
   */
  NORMAL_MAP_TRANSFORM?: boolean

  // /**
  //  * Indicates that the geometry is rendered from both sides
  //  *
  //  * @remarks
  //  * Flips the normal for shading when shaded from back face
  //  */
  // TWOSIDED?: boolean
}

/**
 * Contributes normal lighting and mapping to the shader. See {@link MtlNormalDefs}
 * @public
 */
export const MTL_NORMAL: ShaderChunkSet<MtlNormalDefs> = {
  defines: /* glsl */ `
    #ifdef NORMAL_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef NORMAL_MAP_UV
        #define NORMAL_MAP_UV vTexture.xy
      #endif
    #endif
  `,
  uniforms: /* glsl */ `
    #ifdef NORMAL_MAP
    // @binding NormalMap
    uniform sampler2D uNormalMap;
    #endif

    #ifdef NORMAL_MAP_SCALE_OFFSET
    // @binding NormalMapScaleOffset
    uniform vec4 uNormalMapScaleOffset;
    #endif

    #ifdef NORMAL_MAP_TRANSFORM
    // @binding NormalMapTransform
    uniform mat3 uNormalMapTransform;
    #endif
  `,
  functions: /* glsl */ `
    vec2 getNormalMapUV() {
      #ifdef NORMAL_MAP
        #ifdef NORMAL_MAP_SCALE_OFFSET
        return NORMAL_MAP_UV * uNormalMapScaleOffset.xy + uNormalMapScaleOffset.zw;
        #else
        return NORMAL_MAP_UV;
        #endif
      #endif

      #ifdef V_TEXTURE
      return vTexture.xy;
      #endif

      return vec2(0.0);
    }

    #ifdef FRAGMENT_SHADER

    vec3 getGeometryNormal() {
      #ifdef V_NORMAL
        return normalize(vWorldNormal.xyz);
      #endif
      vec3 dp1 = dFdx(normalize(vToEyeInWS.xyz));
      vec3 dp2 = dFdy(normalize(vToEyeInWS.xyz));
      return normalize(cross(dp1, dp2));
    }

    // http://www.thetenthplanet.de/archives/1180
    mat3 getCotangentFrame(vec3 position, vec3 normal, vec2 uv) {

      vec3 posdx = dFdx(position);
      vec3 posdy = dFdy(position);
      vec2 uvdx = dFdx(uv);
      vec2 uvdy = dFdy(uv);

      vec3 q1perp = cross(posdy, normal);
      vec3 q0perp = cross(normal, posdx);

      vec3 tangent = q1perp * uvdx.x + q0perp * uvdy.x;
      vec3 bitangent = q1perp * uvdx.y + q0perp * uvdy.y;

      float det = max( dot( tangent, tangent ), dot( bitangent, bitangent ) );
      float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

      return mat3(tangent * scale, bitangent * scale, normal);
    }

    mat3 getTBN(vec2 uv) {
      #ifdef V_TBN
        return vTTW;
      #else
        return getCotangentFrame(vPositionInWS.xyz, getGeometryNormal(), uv);
      #endif
    }

    vec3 getNormal(vec2 uvOffset) {
      #if defined(NORMAL_MAP)
        vec2 uv = uvOffset + getNormalMapUV();
        vec3 normal = texture2D(uNormalMap, uv).rgb * 2.0 - vec3(1.0);
        return normalize(getTBN(uv) * normal);
      #else
        return getGeometryNormal();
      #endif
    }

    #endif
  `,
  fs_surface: /* glsl */ `
    surface.Normal.xyz = getNormal(uvOffset);
  `,
}
