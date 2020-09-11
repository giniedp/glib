import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface Log2Depth {
  /**
   * Enables logairthmic depth buffer
   */
  LOG2_DEPTH?: boolean
}

/**
 * Adds logarithmic depth functionality to a shader
 */
export const LOG2_DEPTH: ShaderChunkSet<Log2Depth> = Object.freeze({
  varyings: glsl`
    #ifdef LOG2_DEPTH
    varying float vLog2Depth;
    #endif
  `,
  vs_end: glsl`
    #ifdef LOG2_DEPTH
    vLog2Depth = 1.0 + gl_Position.w;
    #endif
  `,
  fs_end_after: glsl`
    #ifdef LOG2_DEPTH
    gl_FragDepthEXT = log2(vLog2Depth) * uClipPlanes.z;
    #endif
  `,
})
