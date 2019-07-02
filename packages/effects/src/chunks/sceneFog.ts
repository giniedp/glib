import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface FogDefs {
  /**
   * Enables a fog effect
   *
   * @remarks
   * Adds the following Parameters
   * - FogColor
   * - FogParams
   */
  FOG?: any
  /**
   * Defines the constant for no fog
   *
   * @remarks
   * defaults to 0.0
   */
  FOG_TYPE_NONE?: any
  /**
   * Defines the constant for exponential fog
   *
   * @remarks
   * defaults to 1.0
   */
  FOG_TYPE_EXP?: any
  /**
   * Defines the constant for exponential2 fog
   *
   * @remarks
   * defaults to 2.0
   */
  FOG_TYPE_EXP2?: any
  /**
   * Defines the constant for linear fog
   *
   * @remarks
   * defaults to 3.0
   */
  FOG_TYPE_LINEAR?: any
}

/**
 * Adds fog functionality to a shader
 *
 * @public
 * @remarks
 * Uses the following defines
 *
 *  - `FOG` - enables fog
 *  - `FOG_TYPE_NONE` - defaults to 0.0
 *  - `FOG_TYPE_EXP` - defaults to 1.0
 *  - `FOG_TYPE_EXP2` - defaults to 2.0
 *  - `FOG_TYPE_LINEAR` - defaults to 3.0
 */
export const FOG: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifndef FOG_TYPE_NONE
    #define FOG_TYPE_NONE 0.0
    #endif
    #ifndef FOG_TYPE_EXP
    #define FOG_TYPE_EXP 1.0
    #endif
    #ifndef FOG_TYPE_EXP2
    #define FOG_TYPE_EXP2 2.0
    #endif
    #ifndef FOG_TYPE_LINEAR
    #define FOG_TYPE_LINEAR 3.0
    #endif
  `,
  varyings: glsl`
    #ifdef FOG
    varying float vFogDistance;
    #endif
  `,
  uniforms: glsl`
    #ifdef FOG
    // @binding FogColor
    // @widget   color
    // @default  [1, 1, 1]
    uniform vec3 uFogColor;

    // x component is fog start
    // y component is fog end
    // z component is fog density
    // w component is fog type
    //   0 = off
    //   1 = exp,
    //   2 = exp2
    //   3 = linear
    // @binding FogParams
    // @widget   fog
    // @default  [500, 1000, 0.5, 1]
    uniform vec4 uFogParams;
    #endif
  `,
  functions: glsl`
    #ifdef FOG
    vec3 applyFog(vec3 color) {
      float fog = 1.0;
      float fogStart = uFogParams.x;
      float fogEnd = uFogParams.y;
      float fogDistance = vFogDistance;
      float fogDensity = uFogParams.z;
      if (uFogParams.w == FOG_TYPE_LINEAR) {
        fog = (fogEnd - fogDistance) / (fogEnd - fogStart);
      } else if (uFogParams.w == FOG_TYPE_EXP) {
        fog = 1.0 / pow(2.71828, fogDistance * fogDensity);
      } else if (uFogParams.w == FOG_TYPE_EXP2) {
        fog = 1.0 / pow(2.71828, fogDistance * fogDistance * fogDensity * fogDensity);
      }
      return fog * color.rgb + (1.0 - fog) * uFogColor;
    }
    #endif
  `,
  vs_end: glsl`
    #ifdef FOG
    vFogDistance = length(vToEyeInWS);
    #endif
  `,
  fs_end: glsl`
    #ifdef FOG
    color.rgb = applyFog(color.rgb);
    #endif
  `,
})
