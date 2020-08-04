import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface VSkinningDefs {
  /**
   * Enables vertex indices and vertex weights attributes for skinning animation
   */
  SKINNING?: boolean
  /**
   * Defines the number of bones
   *
   * @remarks
   * If not set defaults to 16
   */
  SKINNING_JOINT_COUNT?: number
  /**
   * Defines the number bone weights
   *
   * @remarks
   * If not set defaults to `2`. The value should be in range of [1:4]
   */
  SKINNING_WEIGHT_COUNT?: number
}

/**
 * @public
 */
export const FXC_V_SKINNING: ShaderChunkSet<VSkinningDefs> = Object.freeze({
  defines: glsl`
    #if defined(SKINNING_JOINT_COUNT) || defined(SKINNING_WEIGHT_COUNT)
      #define SKINNING
    #endif

    #if !defined(SKINNING_JOINT_COUNT) && defined(SKINNING)
      #define SKINNING_JOINT_COUNT 16
    #endif

    #if !defined(SKINNING_WEIGHT_COUNT) && defined(SKINNING)
      #define SKINNING_WEIGHT_COUNT 2
    #endif
  `,
  attributes: glsl`
    #ifdef SKINNING
    // @binding joints
    // @remarks The vertex weight indices
    attribute vec4 aJoints;
    // @binding weights
    // @remarks The vertex weights
    attribute vec4 aWeights;
    #endif
  `,
  uniforms: glsl`
    #ifdef SKINNING
    // @binding Joints
    uniform mat4 uJoints[SKINNING_JOINT_COUNT];
    #endif
  `,
  vs_position: glsl`
    #ifdef SKINNING
    mat4 skin = uJoints[int(aJoints.x)] * aWeights.x;
    #if SKINNING_WEIGHT_COUNT > 1
    skin += uJoints[int(aJoints.y)] * aWeights.y;
    #endif
    #if SKINNING_WEIGHT_COUNT > 2
    skin += uJoints[int(aJoints.z)] * aWeights.z;
    #endif
    #if SKINNING_WEIGHT_COUNT > 3
    skin += uJoints[int(aJoints.w)] * aWeights.w;
    #endif
    vPositionInWS = uWorld * skin * vec4(aPosition, 1.0);
    #endif
  `,
})
