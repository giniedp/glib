import { ShaderChunkSet } from '@gglib/graphics'

/**
 * Adds common attributes uniforms varying and structs
 *
 * @public
 */
export const GL300ES: ShaderChunkSet = {
  version: `#version 300 es`,
  defines: /* glsl */ `
    #ifdef VERTEX_SHADER
    #define attribute in
    #define varying out
    #define texture2D texture
    #endif

    #ifdef FRAGMENT_SHADER
    #define varying in
    layout(location = 0) out highp vec4 fragColor;
    #define gl_FragColor fragColor
    #define texture2D texture
    #define textureCube texture
    #endif
  `,
}
