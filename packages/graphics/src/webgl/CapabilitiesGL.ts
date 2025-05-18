import type { Device } from '../Device'
import { isWebGL2 } from './utils'

export type KeysOf<T, P> = {
  [K in keyof T]: T[K] extends P ? K : never
}[keyof T]

export type GlEnums = KeysOf<WebGLRenderingContext, number> | KeysOf<WebGL2RenderingContext, number>

/**
 * @public
 */
export class CapabilitiesGL {
  public device: Device<WebGLRenderingContext | WebGL2RenderingContext>
  public gl: WebGLRenderingContext

  private extensions = {}
  private parameters = {}

  public get maxViewportWidth(): number {
    return this.parameter('MAX_VIEWPORT_DIMS')[0]
  }
  public get maxViewportHeight(): number {
    return this.parameter('MAX_VIEWPORT_DIMS')[1]
  }
  public get maxRenderBufferSize(): number {
    return this.parameter('MAX_RENDERBUFFER_SIZE')
  }
  public get maxTextureUnits(): number {
    return this.parameter('MAX_TEXTURE_IMAGE_UNITS')
  }
  public get maxTextureSize(): number {
    return this.parameter('MAX_TEXTURE_SIZE')
  }
  public get maxVertexAttributes(): number {
    return this.parameter('MAX_VERTEX_ATTRIBS')
  }
  public get maxVertexTextureUnits(): number {
    return this.parameter('MAX_VERTEX_TEXTURE_IMAGE_UNITS')
  }
  public get maxVertexUniformVectors(): number {
    return this.parameter('MAX_VERTEX_UNIFORM_VECTORS')
  }
  public get maxVaryingVectors(): number {
    return this.parameter('MAX_VARYING_VECTORS')
  }
  public get maxFragmentUniformVectors(): number {
    return this.parameter('MAX_FRAGMENT_UNIFORM_VECTORS')
  }

  get maxDrawBuffers(): number {
    return isWebGL2(this.gl)
      ? this.parameter('MAX_DRAW_BUFFERS')
      : this.extension('WEBGL_draw_buffers')?.MAX_DRAW_BUFFERS_WEBGL
  }

  get maxColorAttachments(): number {
    return isWebGL2(this.gl)
      ? this.parameter('MAX_COLOR_ATTACHMENTS')
      : this.extension('WEBGL_draw_buffers')?.MAX_COLOR_ATTACHMENTS_WEBGL
  }

  get textureFormatFloat() {
    return !!this.extension('OES_texture_float')
  }
  get textureFormatHalfFloat() {
    return !!this.extension('OES_texture_half_float')
  }

  constructor(device: Device<WebGLRenderingContext | WebGL2RenderingContext>) {
    this.device = device
    this.gl = device.context
  }

  public parameter(key: GlEnums): any {
    if (key in this.parameters) {
      return this.parameters[key]
    }
    this.parameters[key] = this.gl.getParameter(this.gl[key]) ?? null
    return this.parameters[key]
  }

  // https://registry.khronos.org/webgl/extensions/
  // Khronos ratified WebGL Extensions

  public extension(extensionName: 'ANGLE_instanced_arrays'): ANGLE_instanced_arrays | null
  public extension(extensionName: 'EXT_blend_minmax'): EXT_blend_minmax | null
  public extension(extensionName: 'EXT_frag_depth'): EXT_frag_depth | null
  public extension(extensionName: 'EXT_shader_texture_lod'): EXT_shader_texture_lod | null
  public extension(extensionName: 'EXT_texture_filter_anisotropic'): EXT_texture_filter_anisotropic | null
  public extension(extensionName: 'OES_element_index_uint'): OES_element_index_uint | null
  public extension(extensionName: 'OES_standard_derivatives'): OES_standard_derivatives | null
  public extension(extensionName: 'OES_texture_float_linear'): OES_texture_float_linear | null
  public extension(extensionName: 'OES_texture_float'): OES_texture_float | null
  public extension(extensionName: 'OES_texture_half_float_linear'): OES_texture_half_float_linear | null
  public extension(extensionName: 'OES_texture_half_float'): OES_texture_half_float | null
  public extension(extensionName: 'OES_vertex_array_object'): OES_vertex_array_object | null
  public extension(extensionName: 'WEBGL_compressed_texture_s3tc'): WEBGL_compressed_texture_s3tc | null
  public extension(extensionName: 'WEBGL_debug_renderer_info'): WEBGL_debug_renderer_info | null
  public extension(extensionName: 'WEBGL_debug_shaders'): WEBGL_debug_shaders | null
  public extension(extensionName: 'WEBGL_depth_texture'): WEBGL_depth_texture | null
  public extension(extensionName: 'WEBGL_draw_buffers'): WEBGL_draw_buffers | null
  public extension(extensionName: 'WEBGL_lose_context'): WEBGL_lose_context | null

  // Community approved WebGL Extensions

  public extension(extensionName: 'EXT_clip_control'): unknown | null
  public extension(extensionName: 'EXT_color_buffer_float'): EXT_color_buffer_float | null
  public extension(extensionName: 'EXT_color_buffer_half_float'): EXT_color_buffer_half_float | null
  public extension(extensionName: 'EXT_conservative_depth'): unknown | null
  public extension(extensionName: 'EXT_depth_clamp'): unknown | null
  public extension(extensionName: 'EXT_disjoint_timer_query_webgl2'): unknown | null
  public extension(extensionName: 'EXT_disjoint_timer_query'): unknown | null
  public extension(extensionName: 'EXT_float_blend'): EXT_float_blend | null
  public extension(extensionName: 'EXT_polygon_offset_clamp'): unknown | null
  public extension(extensionName: 'EXT_render_snorm'): unknown | null
  public extension(extensionName: 'EXT_sRGB'): EXT_sRGB | null
  public extension(extensionName: 'EXT_texture_compression_bptc'): EXT_texture_compression_bptc | null
  public extension(extensionName: 'EXT_texture_compression_rgtc'): EXT_texture_compression_rgtc | null
  public extension(extensionName: 'EXT_texture_mirror_clamp_to_edge'): unknown | null
  public extension(extensionName: 'EXT_texture_norm16'): EXT_texture_norm16 | null
  public extension(extensionName: 'KHR_parallel_shader_compile'): KHR_parallel_shader_compile | null
  public extension(extensionName: 'NV_shader_noperspective_interpolation'): unknown | null
  public extension(extensionName: 'OES_draw_buffers_indexed'): OES_draw_buffers_indexed | null
  public extension(extensionName: 'OES_fbo_render_mipmap'): OES_fbo_render_mipmap | null
  public extension(extensionName: 'OES_sample_variables'): unknown | null
  public extension(extensionName: 'OES_shader_multisample_interpolation'): unknown | null
  public extension(extensionName: 'OVR_multiview2'): OVR_multiview2 | null
  public extension(extensionName: 'WEBGL_blend_func_extended'): unknown | null
  public extension(extensionName: 'WEBGL_clip_cull_distance'): unknown | null
  public extension(extensionName: 'WEBGL_color_buffer_float'): WEBGL_color_buffer_float | null
  public extension(extensionName: 'WEBGL_compressed_texture_astc'): WEBGL_compressed_texture_astc | null
  public extension(extensionName: 'WEBGL_compressed_texture_etc'): WEBGL_compressed_texture_etc | null
  public extension(extensionName: 'WEBGL_compressed_texture_etc1'): WEBGL_compressed_texture_etc1 | null
  public extension(extensionName: 'WEBGL_compressed_texture_pvrtc'): WEBGL_compressed_texture_pvrtc | null
  public extension(extensionName: 'WEBGL_compressed_texture_s3tc_srgb'): WEBGL_compressed_texture_s3tc_srgb | null
  public extension(extensionName: 'WEBGL_multi_draw'): WEBGL_multi_draw | null
  public extension(extensionName: 'WEBGL_polygon_mode'): unknown | null
  public extension(extensionName: 'WEBGL_provoking_vertex'): unknown | null
  public extension(extensionName: 'WEBGL_render_shared_exponent'): unknown | null
  public extension(extensionName: 'WEBGL_stencil_texturing'): unknown | null
  public extension(name: string) {
    if (!(name in this.extensions)) {
      this.extensions[name] = this.gl.getExtension(name)
    }
    return this.extensions[name]
  }
}
