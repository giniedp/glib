module Glib.Graphics {

  export class Capabilities {
    device: Graphics.Device
    gl:any
    _capabilities:any
    _extensions:any
    constructor(device:Graphics.Device) {
      this.device = device
      this.gl = device.context
      this._capabilities = {}
      this._extensions = {}
    }
    capability(name:string, extension?:string) {
      var result = this._capabilities[name]
      if (result !== void 0) return result
      var lookup = extension ? this.extension(extension) : this.gl
      if (lookup) {
        return this._capabilities[name] = this.gl.getParameter(lookup[name])
      }
      return this._capabilities[name] = null
    }
    extension(name:string) {
      var result = this._extensions[name]
      if (result === void 0) {
        return this._extensions[name] = this.gl.getExtension(name)
      }
      return result
    }

    get maxViewportWidth() {
      return this.capability("MAX_VIEWPORT_DIMS")[0]
    }
    get maxViewportHeight() {
      return this.capability("MAX_VIEWPORT_DIMS")[1]
    }
    get maxRenderBufferSize() {
      return this.capability("MAX_RENDERBUFFER_SIZE")
    }
    get maxTextureUnits() {
      return this.capability("MAX_TEXTURE_IMAGE_UNITS")
    }
    get maxTextureSize() {
      return this.capability("MAX_TEXTURE_SIZE")
    }
    get maxVertexAttributes() {
      return this.capability("MAX_VERTEX_ATTRIBS")
    }
    get maxVertexTextureUnits() {
      return this.capability("MAX_VERTEX_TEXTURE_IMAGE_UNITS")
    }
    get maxVertexUniformVectors() {
      return this.capability("MAX_VERTEX_UNIFORM_VECTORS")
    }
    get maxVaryingVectors() {
      return this.capability("MAX_VARYING_VECTORS")
    }
    get maxFragmentUniformVectors() {
      return this.capability("MAX_FRAGMENT_UNIFORM_VECTORS")
    }
    get maxDrawBuffers() {
      return this.capability("MAX_DRAW_BUFFERS_WEBGL", "WEBGL_draw_buffers")
    }
    get maxColorAttachments() {
      return this.capability("MAX_COLOR_ATTACHMENTS_WEBGL", "WEBGL_draw_buffers")
    }
    get textureFormatFloat() {
        return !!this.extension("OES_texture_float")
    }
    get textureFormatHalfFloat() {
        return !!this.extension("OES_texture_half_float")
    }
  }
}
