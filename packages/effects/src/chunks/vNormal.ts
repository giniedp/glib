import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface VNormalDefs {
  /**
   * Enables vertex normal attribute
   */
  V_NORMAL?: any
  /**
   * Enables vertex tangent attribute
   */
  V_TANGENT?: any
  /**
   * If defined the tangent is calculated from world X coordinate and vertex normal
   *
   * @remarks
   * This is useful for flat surfaces laying on XZ plane or terrain meshes.
   */
  V_TANGENT_PLANE?: any
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
    varying vec3 vWorldNormal;
    #endif
    #ifdef V_TBN
    varying mat3 vTBN;
    #endif
  `,
  functions: glsl`
    #ifdef VERTEX_SHADER
    void writeNormal() {
      #ifdef V_NORMAL
      mat3 normalMatrix = mat3(uWorld);
      vWorldNormal.xyz = normalize(normalMatrix * aNormal);
      #endif

      #if defined(V_TANGENT_PLANE)
      vTBN[0] = cross(normalMatrix[0], vWorldNormal.xyz);
      vTBN[1] = cross(vWorldNormal.xyz, vTBN[0]);
      vTBN[2] = vWorldNormal.xyz;
      #elif defined(V_TANGENT)
      vTBN[0] = normalize(normalMatrix * aTangent);
      vTBN[1] = cross(vWorldNormal.xyz, vTBN[0]);
      vTBN[2] = vWorldNormal.xyz;
      #endif
    }
    #endif
  `,
  vs_normal: glsl`
    writeNormal();
  `,
})
