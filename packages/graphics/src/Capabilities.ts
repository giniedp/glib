import { Device } from './Device'

/**
 * @public
 */
export class Capabilities {
  public device: Device<WebGLRenderingContext | WebGL2RenderingContext>
  public gl: WebGLRenderingContext

  private capabilities: any
  private extensions: any

  private get gl2(): WebGL2RenderingContext {
    return this.gl as WebGL2RenderingContext
  }

  public get maxViewportWidth() {
    return this.capability('MAX_VIEWPORT_DIMS')[0]
  }
  public get maxViewportHeight() {
    return this.capability('MAX_VIEWPORT_DIMS')[1]
  }
  public get maxRenderBufferSize() {
    return this.capability('MAX_RENDERBUFFER_SIZE')
  }
  public get maxTextureUnits() {
    return this.capability('MAX_TEXTURE_IMAGE_UNITS')
  }
  public get maxTextureSize() {
    return this.capability('MAX_TEXTURE_SIZE')
  }
  public get maxVertexAttributes() {
    return this.capability('MAX_VERTEX_ATTRIBS')
  }
  public get maxVertexTextureUnits() {
    return this.capability('MAX_VERTEX_TEXTURE_IMAGE_UNITS')
  }
  public get maxVertexUniformVectors() {
    return this.capability('MAX_VERTEX_UNIFORM_VECTORS')
  }
  public get maxVaryingVectors() {
    return this.capability('MAX_VARYING_VECTORS')
  }
  public get maxFragmentUniformVectors() {
    return this.capability('MAX_FRAGMENT_UNIFORM_VECTORS')
  }

  private $maxDrawBuffers: number
  get maxDrawBuffers() {
    if (this.$maxDrawBuffers == null) {
      this.$maxDrawBuffers = this.gl2 instanceof WebGL2RenderingContext
      ? this.gl2.getParameter(this.gl2.MAX_DRAW_BUFFERS)
      : this.capability('MAX_DRAW_BUFFERS_WEBGL', 'WEBGL_draw_buffers')
    }
    return this.$maxDrawBuffers
  }

  private $maxColorAttachments: number
  get maxColorAttachments() {
    if (this.$maxColorAttachments == null) {
      this.$maxColorAttachments = this.gl2 instanceof WebGL2RenderingContext
      ? this.gl2.getParameter(this.gl2.MAX_COLOR_ATTACHMENTS)
      : this.capability('MAX_COLOR_ATTACHMENTS_WEBGL', 'WEBGL_draw_buffers')
    }
    return this.$maxColorAttachments
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
    this.capabilities = {}
    this.extensions = {}
  }
  public capability(name: string, extension?: string) {
    let result = this.capabilities[name]
    if (result !== void 0) { return result }
    let lookup = extension ? this.extension(extension as any) : this.gl
    if (lookup) {
      return this.capabilities[name] = this.gl.getParameter(lookup[name])
    }
    return this.capabilities[name] = null
  }

  public extension(extensionName: 'EXT_blend_minmax'): EXT_blend_minmax | null
  public extension(extensionName: 'EXT_texture_filter_anisotropic'): EXT_texture_filter_anisotropic | null
  public extension(extensionName: 'EXT_frag_depth'): EXT_frag_depth | null
  public extension(extensionName: 'EXT_shader_texture_lod'): EXT_shader_texture_lod | null
  public extension(extensionName: 'EXT_sRGB'): EXT_sRGB | null
  public extension(extensionName: 'OES_vertex_array_object'): OES_vertex_array_object | null
  public extension(extensionName: 'WEBGL_color_buffer_float'): WEBGL_color_buffer_float | null
  public extension(extensionName: 'WEBGL_compressed_texture_astc'): WEBGL_compressed_texture_astc | null
  public extension(extensionName: 'WEBGL_compressed_texture_s3tc_srgb'): WEBGL_compressed_texture_s3tc_srgb | null
  public extension(extensionName: 'WEBGL_debug_shaders'): WEBGL_debug_shaders | null
  public extension(extensionName: 'WEBGL_draw_buffers'): WEBGL_draw_buffers | null
  public extension(extensionName: 'WEBGL_lose_context'): WEBGL_lose_context | null
  public extension(extensionName: 'WEBGL_depth_texture'): WEBGL_depth_texture | null
  public extension(extensionName: 'WEBGL_debug_renderer_info'): WEBGL_debug_renderer_info | null
  public extension(extensionName: 'WEBGL_compressed_texture_s3tc'): WEBGL_compressed_texture_s3tc | null
  public extension(extensionName: 'OES_texture_half_float_linear'): OES_texture_half_float_linear | null
  public extension(extensionName: 'OES_texture_half_float'): OES_texture_half_float | null
  public extension(extensionName: 'OES_texture_float_linear'): OES_texture_float_linear | null
  public extension(extensionName: 'OES_texture_float'): OES_texture_float | null
  public extension(extensionName: 'OES_standard_derivatives'): OES_standard_derivatives | null
  public extension(extensionName: 'OES_element_index_uint'): OES_element_index_uint | null
  public extension(extensionName: 'ANGLE_instanced_arrays'): ANGLE_instanced_arrays | null
  public extension(name: string) {
    let result = this.extensions[name]
    if (result === void 0) {
      return this.extensions[name] = this.gl.getExtension(name)
    }
    return result
  }
}
