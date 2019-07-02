import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface VBillboardDefs {
  /**
   * Enables billboard rotation of the vertices
   */
  BILLBOARD?: any
}

/**
 * Adds billboard functionality to a shader
 *
 * @public
 * @remarks
 * Uses the following defines
 *
 *  - BILLBOARD
 */
export const V_BILLBOARD: ShaderChunkSet = Object.freeze({
  uniforms: glsl`
    #ifdef BILLBOARD
    // @binding BillboardSize
    // @default [1, 1]
    uniform vec2 uBillboardSize;
    #endif
  `,
  vs_position_after: glsl`
    #ifdef BILLBOARD
    vec3 upVector = vec3(0, 1, 0);
    vec3 sideVector = normalize(cross(vToEyeInWS, upVector));

    vPositionInWS.xyz += (aTexture.x - 0.5) * sideVector * uBillboardSize.x;
    vPositionInWS.xyz += (1.5 - aTexture.y * 1.5) * upVector * uBillboardSize.y;
    #endif
  `,
})
