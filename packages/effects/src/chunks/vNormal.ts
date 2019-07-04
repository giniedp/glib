import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface VNormalDefs {
  /**
   * Enables vertex normal attribute
   */
  V_NORMAL?: boolean
  /**
   * Enables vertex tangent attribute
   */
  V_TANGENT?: boolean
  /**
   * If defined the tangent is calculated from world X coordinate and vertex normal
   *
   * @remarks
   * This is useful for flat surfaces laying on XZ plane or terrain meshes.
   */
  V_TANGENT_PLANE?: boolean
}

/**
 * @public
 */
export const V_NORMAL: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #if defined(V_TANGENT) || defined(V_TANGENT_PLANE)
    #define V_NORMAL
    #define V_TBN
    #endif
  `,
  attributes: glsl`
    #ifdef V_NORMAL
    // @binding normal
    // @remarks The vertex normal attribute
    attribute vec3 aNormal;
    #endif

    #ifdef V_TANGENT
    // @binding tangent
    // @remarks The vertex tangent attribute
    attribute vec3 aTangent;
    #endif
  `,
  varyings: glsl`
    #ifdef V_NORMAL
    // @remarks Surface normal in world space
    varying vec3 vWorldNormal;
    #endif
    #ifdef V_TBN
    // @remarks TBN Matrix converting tangent to world space
    varying mat3 vTTW;
    #endif
  `,
  functions: glsl`
    #ifdef VERTEX_SHADER
    void writeNormal() {
      #ifdef V_NORMAL
      mat3 normalMatrix = mat3(uWorld);
      vWorldNormal.xyz = normalMatrix * aNormal;

      #if defined(V_TANGENT_PLANE)
      vTTW[0] = cross(normalMatrix[0], vWorldNormal.xyz);
      vTTW[1] = cross(vWorldNormal.xyz, vTTW[0]);
      vTTW[2] = vWorldNormal.xyz;
      #elif defined(V_TANGENT)
      vTTW[0] = normalMatrix * aTangent;
      vTTW[1] = normalMatrix * cross(aTangent, aNormal);
      vTTW[2] = vWorldNormal.xyz;
      #endif

      #endif
    }
    #endif
  `,
  vs_normal: glsl`
    writeNormal();
  `,
  fs_start_before: glsl`
    #if defined(V_TBN)
    mat3 WTT = transposeMat3(vTTW);
    #endif
  `,
})
