import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface VSkinningDefs {
  /**
   * Enables vertex indices and vertex weights attributes for skinning animation
   */
  SKINNING?: any
  /**
   * Defines the number of bones
   *
   * @remarks
   * If not set defaults to 16
   */
  SKINNING_BONE_COUNT?: any
  /**
   * Defines the number bone weights
   *
   * @remarks
   * If not set defaults to `2`. The value should be in ragne of [1:4]
   */
  SKINNING_WEIGHT_COUNT?: any
}

/**
 * @public
 */
export const V_SKINNING: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #if defined(SKINNING_BONE_COUNT) || defined(SKINNING_WEIGHT_COUNT)
      #define SKINNING
    #endif

    #ifndef SKINNING_BONE_COUNT
    #ifdef SKINNING
      #define SKINNING_BONE_COUNT 16
    #endif
    #endif

    #ifndef SKINNING_WEIGHT_COUNT
    #ifdef SKINNING
      #define SKINNING_WEIGHT_COUNT 2
    #endif
    #endif
  `,
  attributes: glsl`
    #ifdef SKINNING
    // @binding indices
    // @remarks The vertex weight indices
    attribute vec4 aIndices;
    // @binding weights
    // @remarks The vertex weights
    attribute vec4 aWeights;
    #endif
  `,
  vs_position: glsl`
    #ifdef SKINNING
    mat4 skinMat;
    skinMat = uBones[int(aIndices.x)] * aWeights.x;
    #if SKINNING_WEIGHT_COUNT > 1
    skinMat += uBones[int(aIndices.y)] * aWeights.y;
    #endif
    #if SKINNING_WEIGHT_COUNT > 2
    skinMat += uBones[int(aIndices.z)] * aWeights.z;
    #endif
    #if SKINNING_WEIGHT_COUNT > 3
    skinMat += uBones[int(aIndices.w)] * aWeights.w;
    #endif
    vWorldPosition = skinMat * vec4(aPosition, 1.0);
    #endif
  `,
})
