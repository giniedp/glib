import { DepthBuffer, FrameBuffer, FrameBufferOptions, Texture } from '../../resources'
import { DeviceGL } from '../DeviceGL'
import { DepthBufferGL } from './DepthBufferGL'
import { TextureGL } from './TextureGL'

/**
 * @public
 */
export class FrameBufferGL extends FrameBuffer {
  public readonly device: DeviceGL
  public readonly resource: WebGLFramebuffer

  private colorAttachments: Texture[] = []
  private depthAttachment: DepthBuffer
  private colorAttachmentCountField: number = 0
  private colorAttachmentPoints: number[] = []
  private maxColorAttachments: number = 1
  private drawBuffersExtension: WEBGL_draw_buffers

  constructor(device: DeviceGL, options?: FrameBufferOptions) {
    super()
    this.device = device

    this.drawBuffersExtension = device.capabilities.extension('WEBGL_draw_buffers')
    this.maxColorAttachments = device.capabilities.maxColorAttachments
    this.reset(options)
  }

  get colorAttachmentCount(): number {
    return this.colorAttachmentCountField
  }

  public reset(options: FrameBufferOptions = {}) {
    let gl = this.device.context

    if (!FrameBufferGL.validateAttachments(options.textures, options.depthBuffer)) {
      throw new Error('All attachments must have same width and height')
    }
    let textures = options.textures || []
    let targetCount = Math.max(this.colorAttachments.length, textures.length)
    if (targetCount > this.maxColorAttachments) {
      throw new Error(
        `Requested to attach ${targetCount} color attachments but only ${this.maxColorAttachments} are supported.`,
      )
    }

    if (options.resource) {
      // if a resource is provided, use it
      this.assign({ resource: options.resource })
    }

    let needsRebind = false
    // ensure framebuffer is created
    if (this.resource == null || !gl.isFramebuffer(this.resource)) {
      this.assign({ resource: gl.createFramebuffer() })
      needsRebind = true
    }

    //
    // BEGIN UPDATE
    //
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.resource)

    // replace color attachments
    let count = 0
    for (let i = 0; i < targetCount; i++) {
      const oldTexture: TextureGL = this.colorAttachments[i] as TextureGL
      const newTexture: TextureGL = textures[i] as TextureGL

      if (!needsRebind && newTexture && oldTexture && newTexture.resource === oldTexture.resource) {
        // skip binding if the new texture is already bound
        count += 1
        continue
      }
      if (newTexture) {
        // bind the new texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, newTexture.resource, 0)
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

    let oldBuffer: DepthBufferGL = this.depthAttachment as DepthBufferGL
    let newBuffer: DepthBufferGL = options.depthBuffer as DepthBufferGL
    if (oldBuffer && newBuffer && oldBuffer.resource === newBuffer.resource) {
      // skip binding if the new buffer is already bound
    } else if (newBuffer) {
      // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, newBuffer.resource)
    } else {
      // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null)
    }
    this.depthAttachment = newBuffer

    //
    // END UPDATE
    //
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return this
  }

  public destroy() {
    if (this.resource != null && this.device.context.isFramebuffer(this.resource)) {
      this.device.context.deleteFramebuffer(this.resource)
      this.assign({ resource: null })
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

  public unsetSamplersUsedAsAttachments() {
    for (const texture of this.colorAttachments) {
      for (const unit of this.device.textureUnits) {
        if (texture === unit.texture) {
          unit.texture = null
          unit.commit()
        }
      }
    }
  }

  private assign(options: Partial<FrameBufferGL>) {
    Object.assign(this, options)
  }
}
