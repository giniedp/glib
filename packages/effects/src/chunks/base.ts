import { ShaderChunk } from '../builder'
import { glsl } from '../glsl'

/**
 * The base template
 */
export const BASE: ShaderChunk = glsl`
#pragma block:version

#pragma block:extensions

precision highp float;
precision highp int;

#pragma block:defines

#pragma block:structs

#ifdef VERTEX_SHADER
#pragma block:attributes
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
