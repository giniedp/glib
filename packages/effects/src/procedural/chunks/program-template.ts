import { glsl, ShaderChunk } from '@gglib/graphics'

export default glsl`
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

#pragma block:utils
#pragma block:functions

#ifdef VERTEX_SHADER
void main() {
  #pragma block:vs_main
}
#endif

#ifdef FRAGMENT_SHADER
void main() {
  #pragma block:fs_main_init
  #pragma block:fs_main_point
  #pragma block:fs_main_noise
  #pragma block:fs_main_color
  #pragma block:fs_main_complete
}
#endif
` satisfies ShaderChunk
