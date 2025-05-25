import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface FogDefs {
  /**
   * Enables a fog contribution
   *
   * @remarks
   * Adds `uniform vec3 uFogColor;` (bound as `FogColor`)
   * and `uniform vec4 uFogParams;` (bound as `FogParams`)
   *
   * Layout of `uFogParams` is as follows
   * - `x` component is fog start (only for linear fog)
   * - `y` component is fog end (only for linear fog)
   * - `z` component is fog density  (only for exponential fog)
   * - `w` component is fog type
   */
  FOG?: boolean
}

/**
 * Adds fog functionality to a shader
 *
 * @public
 * @remarks
 * Uses the following defines
 *
 *  - `FOG` - enables fog
 */
export const FXC_SCENE_FOG: ShaderChunkSet<FogDefs> = Object.freeze({

  varyings: glsl`
    #ifdef FOG
    varying float vFogDistance;
    #define FOG_NONE    0.0
    #define FOG_EXP     1.0
    #define FOG_EXP2    2.0
    #define FOG_LINEAR  3.0
    #define E 2.71828
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
    void applyFog(inout vec3 color) {
      float fog = 1.0;
      float fogStart = uFogParams.x;
      float fogEnd = uFogParams.y;
      float fogDistance = vFogDistance;
      float fogDensity = uFogParams.z;
      float d = fogDistance - fogStart;
      if (d < 0.0) {
        fog = 1.0;
      } else if (uFogParams.w == FOG_LINEAR) {
        fog = (fogEnd - fogDistance) / (fogEnd - fogStart);
      } else if (uFogParams.w == FOG_EXP) {
        fog = 1.0 / pow(2.71828, d * fogDensity) + abs(vPositionInWS.y) / fogEnd;
      } else if (uFogParams.w == FOG_EXP2) {
        fog = 1.0 / pow(2.71828, d * d * fogDensity * fogDensity) + abs(vPositionInWS.y) / fogEnd;
      }
      fog = clamp(fog, 0.0, 1.0);
      color.rgb = fog * color.rgb + (1.0 - fog) * uFogColor;
    }
    #endif
  `,
  vs_end: glsl`
    #ifdef FOG
    vFogDistance = length(vToEyeInWS);
    #endif
  `,
  fs_fog: glsl`
    #ifdef FOG
    applyFog(color.rgb);
    #endif
  `,
})
