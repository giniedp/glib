import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export const FXC_BASE_MAIN: ShaderChunkSet = Object.freeze({
  vs: glsl`
    void main() {
      #pragma block:vs_start
      #pragma block:vs_position
      #pragma block:vs_normal
      #pragma block:vs_texture
      #pragma block:vs_color
      #pragma block:vs_end
    }
  `,
  fs: glsl`
    void main() {
      #pragma block:fs_start
      #pragma block:fs_surface
      #pragma block:fs_shade
      #pragma block:fs_fog
      #pragma block:fs_post
      #pragma block:fs_end
      #pragma block:fs_frag_color
    }
  `,
})
