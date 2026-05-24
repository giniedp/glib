import type { Capabilities } from '../Capabilities'
import type { Device } from '../Device'
import { surfaceFormatToWebGLExtension, type SurfaceFormat, type TextureCompression } from '../enums'
import type { WebglDevice } from './WebglDevice'

export type KeysOf<T, P> = {
  [K in keyof T]: T[K] extends P ? K : never
}[keyof T]

export type GlEnums = KeysOf<WebGL2RenderingContext, number>

/**
 * @public
 */
export class WebglCapabilities implements Capabilities {
  public device: Device<WebGL2RenderingContext>

  private extensions = {}
  private parameters = {}

  public get maxTextureCount(): number {
    return this.parameter('MAX_TEXTURE_IMAGE_UNITS')
  }
  public get maxTextureSize(): number {
    return this.parameter('MAX_TEXTURE_SIZE')
  }
  public get maxVertexAttributes(): number {
    return this.parameter('MAX_VERTEX_ATTRIBS')
  }
  public get maxVertexTextureCount(): number {
    return this.parameter('MAX_VERTEX_TEXTURE_IMAGE_UNITS')
  }
  public get maxRenderTargetSize(): number {
    return this.parameter('MAX_RENDERBUFFER_SIZE')
  }
  public get maxRenderTargets(): number {
    return this.parameter('MAX_DRAW_BUFFERS')
  }
  public get maxUniformBlockCount(): number {
    return this.parameter('MAX_UNIFORM_BUFFER_BINDINGS')
  }
  public get maxUniformBlockSize(): number {
    return this.parameter('MAX_UNIFORM_BLOCK_SIZE')
  }
  public get maxSampleCount() {
    return this.parameter('MAX_SAMPLES')
  }

  public readonly canRenderR32F: boolean
  public readonly canRenderRG32F: boolean
  public readonly canRenderRGBA32F: boolean
  public readonly canFilterR32F: boolean
  public readonly canFilterRG32F: boolean
  public readonly canFilterRGBA32F: boolean

  public readonly canRenderR16F: boolean
  public readonly canRenderRG16F: boolean
  public readonly canRenderRGBA16F: boolean
  public readonly canFilterR16F: boolean
  public readonly canFilterRG16F: boolean
  public readonly canFilterRGBA16F: boolean

  public readonly textureCompressionAstc: boolean
  public readonly textureCompressionEtc2: boolean
  public readonly textureCompressionEtc1: boolean
  public readonly textureCompressionPvrtc: boolean
  public readonly textureCompressionBc: boolean
  public readonly textureCompressionBptc: boolean
  public readonly textureCompression: TextureCompression[]

  private get gl() {
    return this.device.context
  }

  public constructor(device: WebglDevice) {
    this.device = device
    this.textureCompressionAstc = !!this.extension('WEBGL_compressed_texture_astc')
    this.textureCompressionEtc2 = !!this.extension('WEBGL_compressed_texture_etc')
    this.textureCompressionEtc1 = !!this.extension('WEBGL_compressed_texture_etc1')
    this.textureCompressionPvrtc = !!this.extension('WEBGL_compressed_texture_pvrtc')
    this.textureCompressionBc = !!this.extension('WEBGL_compressed_texture_s3tc')
    this.textureCompressionBptc = !!this.extension('EXT_texture_compression_bptc')
    this.textureCompression = [
      this.textureCompressionAstc ? ('astc' as const) : null,
      this.textureCompressionEtc2 ? ('etc2' as const) : null,
      this.textureCompressionEtc1 ? ('etc1' as const) : null,
      this.textureCompressionPvrtc ? ('pvrtc' as const) : null,
      this.textureCompressionBptc ? ('bptc' as const) : null,
      this.textureCompressionBc ? ('bc' as const) : null,
    ].filter((it) => !!it)

    this.canRenderR32F = !!this.extension('EXT_color_buffer_float')
    this.canRenderRG32F = !!this.extension('EXT_color_buffer_float')
    this.canRenderRGBA32F = !!this.extension('EXT_color_buffer_float')
    this.canFilterR32F = !!this.extension('OES_texture_float_linear')
    this.canFilterRG32F = !!this.extension('OES_texture_float_linear')
    this.canFilterRGBA32F = !!this.extension('OES_texture_float_linear')

    this.canRenderR16F = !!this.extension('EXT_color_buffer_half_float')
    this.canRenderRG16F = !!this.extension('EXT_color_buffer_half_float')
    this.canRenderRGBA16F = !!this.extension('EXT_color_buffer_half_float')
    this.canFilterR16F = true
    this.canFilterRG16F = true
    this.canFilterRGBA16F = true
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
  public extension(extensionName: 'WEBGL_compressed_texture_s3tc'): WEBGL_compressed_texture_s3tc | null
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

  public isFormatSupported(format: SurfaceFormat): boolean {
    const extension = surfaceFormatToWebGLExtension(format)
    if (!extension) {
      return true
    }
    return !!this.extension(extension as any)
  }
}
