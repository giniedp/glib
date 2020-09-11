import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export const CHUNK_BASE_MAIN: ShaderChunkSet = Object.freeze({
  precision: glsl`
    precision highp float;
    precision highp int;
  `,
  vs: glsl`
    void main() {
      #pragma block:vs_main
    }
  `,
  fs: glsl`
    void main() {
      #pragma block:fs_main_init
      #pragma block:fs_main_point
      #pragma block:fs_main_noise
      #pragma block:fs_main_color
      #pragma block:fs_main_complete
    }
  `,
})
