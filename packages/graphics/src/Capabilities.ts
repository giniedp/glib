import { Device } from './Device'

export class Capabilities {
  public device: Device
  public gl: WebGLRenderingContext|WebGL2RenderingContext

  private capabilities: any
  private extensions: any

  private get gl2(): WebGL2RenderingContext {
    return this.gl as WebGL2RenderingContext
  }

  get maxViewportWidth() {
    return this.capability('MAX_VIEWPORT_DIMS')[0]
  }
  get maxViewportHeight() {
    return this.capability('MAX_VIEWPORT_DIMS')[1]
  }
  get maxRenderBufferSize() {
    return this.capability('MAX_RENDERBUFFER_SIZE')
  }
  get maxTextureUnits() {
    return this.capability('MAX_TEXTURE_IMAGE_UNITS')
  }
  get maxTextureSize() {
    return this.capability('MAX_TEXTURE_SIZE')
  }
  get maxVertexAttributes() {
    return this.capability('MAX_VERTEX_ATTRIBS')
  }
  get maxVertexTextureUnits() {
    return this.capability('MAX_VERTEX_TEXTURE_IMAGE_UNITS')
  }
  get maxVertexUniformVectors() {
    return this.capability('MAX_VERTEX_UNIFORM_VECTORS')
  }
  get maxVaryingVectors() {
    return this.capability('MAX_VARYING_VECTORS')
  }
  get maxFragmentUniformVectors() {
    return this.capability('MAX_FRAGMENT_UNIFORM_VECTORS')
  }

  private $maxDrawBuffers: number
  get maxDrawBuffers() {
    if (this.$maxDrawBuffers == null) {
      this.$maxDrawBuffers = this.device.isWebGL2
      ? this.gl2.getParameter(this.gl2.MAX_DRAW_BUFFERS)
      : this.capability('MAX_DRAW_BUFFERS_WEBGL', 'WEBGL_draw_buffers')
    }
    return this.$maxDrawBuffers
  }

  private $maxColorAttachments: number
  get maxColorAttachments() {
    if (this.$maxColorAttachments == null) {
      this.$maxColorAttachments = this.device.isWebGL2
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

  constructor(device: Device) {
    this.device = device
    this.gl = device.context
    this.capabilities = {}
    this.extensions = {}
  }
  public capability(name: string, extension?: string) {
    let result = this.capabilities[name]
    if (result !== void 0) { return result }
    let lookup = extension ? this.extension(extension) : this.gl
    if (lookup) {
      return this.capabilities[name] = this.gl.getParameter(lookup[name])
    }
    return this.capabilities[name] = null
  }
  public extension(name: string) {
    let result = this.extensions[name]
    if (result === void 0) {
      return this.extensions[name] = this.gl.getExtension(name)
    }
    return result
  }
}
