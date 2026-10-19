/**
 * Number of texels per row of the texture that mirrors a storage buffer
 *
 * @remarks
 * Fixed, so shaders can compute the texel coordinate: `ivec2(index % 1024, index / 1024)`
 */
export const STORAGE_TEXTURE_WIDTH = 1024

/**
 * Bytes per texel of the texture that mirrors a storage buffer (rgba32float)
 */
export const STORAGE_TEXEL_SIZE = 16

/**
 * GLSL helpers to read storage buffers, which WebGL emulates with float textures
 *
 * @remarks
 * A storage buffer is declared as a sampler with a `@storage` annotation that names the element type.
 * Element `i` of a type with a stride of `n` texels (16 bytes each) starts at texel `i * n`.
 *
 * ```glsl
 * struct ObjectBlock { mat4 modelMatrix; };
 * // @storage ObjectBlock
 * uniform highp sampler2D object;
 *
 * mat4 model = gg_storageMat4(object, index * 4);
 * ```
 *
 * @public
 */
export const GLSL_STORAGE = /* glsl */ `
vec4 gg_storageTexel(highp sampler2D buffer, int texel) {
  return texelFetch(buffer, ivec2(texel % ${STORAGE_TEXTURE_WIDTH}, texel / ${STORAGE_TEXTURE_WIDTH}), 0);
}

mat4 gg_storageMat4(highp sampler2D buffer, int texel) {
  return mat4(
    gg_storageTexel(buffer, texel),
    gg_storageTexel(buffer, texel + 1),
    gg_storageTexel(buffer, texel + 2),
    gg_storageTexel(buffer, texel + 3)
  );
}
`

/**
 * GLSL helper for the instance index of a vertex shader, including the first instance of the draw
 *
 * @remarks
 * Equivalent of `@builtin(instance_index)` in WGSL. WebGL has no first instance, the render encoder sets it in the
 * `gg_BaseInstance` uniform. Vertex shaders only.
 *
 * @public
 */
export const GLSL_INSTANCE_INDEX = /* glsl */ `
uniform int gg_BaseInstance;

int gg_instanceIndex() {
  return gl_InstanceID + gg_BaseInstance;
}
`
