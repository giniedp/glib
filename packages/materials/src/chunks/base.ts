import { ShaderChunk } from '@gglib/graphics'

/**
 * The base template
 *
 * @public
 */
export const BASE: ShaderChunk = /* glsl */ `
#pragma block:version

#pragma block:extensions

#pragma block:precision

#pragma block:defines

#pragma block:structs

#ifdef VERTEX_SHADER
#pragma block:attributes
#pragma block:vs_inputs
#pragma block:vs_outputs
#endif

#ifdef FRAGMENT_SHADER
#pragma block:fs_inputs
#pragma block:fs_outputs
#endif

#pragma block:varyings

#pragma block:uniforms

#pragma block:functions

#ifdef VERTEX_SHADER
#pragma block:vs_functions

void main() {
  #pragma block:vs_start
  #pragma block:vs_position
  #pragma block:vs_normal
  #pragma block:vs_texture
  #pragma block:vs_color
  #pragma block:vs_end
}
#endif

#ifdef FRAGMENT_SHADER
#pragma block:fs_functions

void main() {
  #pragma block:fs_start
  #pragma block:fs_surface
  #pragma block:fs_shade
  #pragma block:fs_fog
  #pragma block:fs_post
  #pragma block:fs_end
  #pragma block:fs_frag_color
}
#endif
`
