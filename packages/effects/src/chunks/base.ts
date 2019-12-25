import { ShaderChunk } from '../builder'
import { glsl } from '../glsl'

/**
 * The base template
 *
 * @public
 */
export const FXC_BASE: ShaderChunk = glsl`
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
#pragma block:vs
#endif

#ifdef FRAGMENT_SHADER
#pragma block:fs
#endif
`
