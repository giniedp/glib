import { DepthBuffer } from './DepthBuffer'
import { Device } from './Device'
import { Texture } from './Texture'

/**
 * @public
 */
export interface FrameBufferOptions {
  /**
   *
   */
  textures?: Texture[],
  /**
   *
   */
  depthBuffer?: DepthBuffer,
}

/**
 * @public
 */
export class FrameBuffer {
  public device: Device
  public gl: any
  public handle: WebGLFramebuffer
  private colorAttachments: Texture[] = []
  private depthAttachment: DepthBuffer
  private colorAttachmentCountField: number = 0
  private colorAttachmentPoints: number[] = []
  private maxColorAttachments: number = 1
  private drawBuffersExtension: any

  constructor(device: Device, options?: FrameBufferOptions) {
    this.device = device
    this.gl = device.context
    this.drawBuffersExtension = device.capabilities.extension('WEBGL_draw_buffers')
    this.maxColorAttachments = device.capabilities.maxColorAttachments
    this.setup(options)
  }

  get colorAttachmentCount(): number {
    return this.colorAttachmentCountField
  }

  public setup(options: FrameBufferOptions= {}) {
    let gl = this.gl

    if (!FrameBuffer.validateAttachments(options.textures, options.depthBuffer)) {
      throw new Error('All attachments must have same width and height')
    }
    let textures = options.textures || []
    let targetCount = Math.max(this.colorAttachments.length, textures.length)
    if (targetCount > this.maxColorAttachments) {
      throw new Error(`Requested to attach ${targetCount} color attachments but only ${this.maxColorAttachments} are supported.`)
    }

    let needsRebind = false
    // ensure framebuffer is created
    if (this.handle == null || !this.gl.isFramebuffer(this.handle)) {
      this.handle = this.gl.createFramebuffer()
      needsRebind = true
    }

    //
    // BEGIN UPDATE
    //
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.handle)

    // replace color attachments
    let count = 0
    for (let i = 0; i < targetCount; i++) {
      const oldTexture = this.colorAttachments[i]
      const newTexture = textures[i]

      if (!needsRebind && newTexture && oldTexture && newTexture.handle === oldTexture.handle) {
        // skip binding if the new texture is already bound
        count += 1
        continue
      }
      if (newTexture) {
        // bind the new texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, newTexture.handle, 0)
        this.colorAttachments[i] = newTexture
        this.colorAttachmentPoints[i] = gl.COLOR_ATTACHMENT0 + i
        count += 1
      } else {
        // unbind the old texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0)
        this.colorAttachments[i] = null
        this.colorAttachmentPoints[i] = 0
      }
    }
    // ensure attachment array length
    this.colorAttachments.length = textures.length
    this.colorAttachmentPoints.length = textures.length
    this.colorAttachmentCountField = count
    if (this.drawBuffersExtension) {
      this.drawBuffersExtension.drawBuffersWEBGL(this.colorAttachmentPoints)
    }

    let oldBuffer = this.depthAttachment
    let newBuffer = options.depthBuffer
    if (oldBuffer && newBuffer && oldBuffer.handle === newBuffer.handle) {
      // skip binding if the new buffer is already bound
    } else if (newBuffer) {
      // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, newBuffer.handle)
    } else {
      // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null)
    }
    this.depthAttachment = newBuffer

    //
    // END UPDATE
    //
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
  }

  public destroy() {
    if (this.handle != null && this.gl.isFramebuffer(this.handle)) {
      this.gl.deleteFramebuffer(this.handle)
      this.handle = null
    }
  }

  public static validateAttachments(textures?: Texture[], depth?: DepthBuffer) {
    // treat empty attachment list as valid
    if (!textures || textures.length === 0) {
      return true
    }

    let firstTexture = null
    let width = 0
    let height = 0
    let depthFormat = 0
    for (const texture of textures) {
      firstTexture = texture
      if (texture) {
        width = texture.width
        height = texture.height
        depthFormat = texture.depthFormat
        break
      }
    }

    // treat empty attachment list as valid
    if (!firstTexture) {
      return true
    }

    for (const texture of textures) {
      if (width !== texture.width || height !== texture.height) {
        return false
      }
    }

    if (depth && (depth.width !== width || depth.height !== height || depth.depthFormat !== depthFormat)) {
      return false
    }
    return true
  }
}
