import { IVec4 } from '@gglib/math'
import type { SurfaceFormat } from '../../enums'
import type { WebglResource } from '../types'
import type { WebglDevice } from '../WebglDevice'
import type { WebglTexture } from './WebglTexture'

export interface RenderTargetAttachment {
  index: number
  texture: WebglTexture
  mipLevel: number
  arrayLayer: number
  changed: boolean
  clearColor: [number, number, number, number]
}

export class WebglFrameBuffer implements WebglResource<WebGLFramebuffer> {
  public readonly device: WebglDevice
  public readonly maxRenderTargets: number

  public readonly glHandle: WebGLFramebuffer

  public get changed() {
    return this.dirty
  }

  private attachments: RenderTargetAttachment[] = []
  private depthTarget: WebglTexture | null = null
  private depthMipLevel: number = 0
  private depthArrayLayer: number = 0
  private depthTargetChanged: boolean = false
  private dirty = false
  private drawBuffers: number[] = []
  private clearDepth: [number] = [1]
  private clearStencil: [number] = [0]

  public constructor(device: WebglDevice) {
    this.device = device
    this.device.onContextLost.add(this.handleContextLoss)
    this.device.onContextRestored.add(this.handleContextRestored)
    this.maxRenderTargets = this.device.capabilities.maxRenderTargets
    this.attachments = Array.from({ length: this.maxRenderTargets }, (_, i) => {
      return {
        index: i,
        texture: null,
        mipLevel: 0,
        arrayLayer: 0,
        changed: true,
        clearColor: [0, 0, 0, 1],
      }
    })
    this.restore()
  }

  private handleContextLoss = () => {
    const self = this as Mutable<this>
    self.glHandle = null
  }

  private handleContextRestored = () => {
    this.restore()
  }

  private restore() {
    const self = this as Mutable<this>
    self.glHandle = this.device.context.createFramebuffer()
    for (const attachment of this.attachments) {
      attachment.changed = true
    }
    this.depthTargetChanged = true
    this.dirty = true
  }

  public dispose() {
    const gl = this.device.context
    const self = this as Mutable<this>
    if (gl.isFramebuffer(this.glHandle)) {
      gl.deleteFramebuffer(this.glHandle)
    }
    self.glHandle = null
    this.device.onContextLost.remove(this.handleContextLoss)
    this.device.onContextRestored.remove(this.handleContextRestored)
  }

  public getAttachment(index: number): Readonly<RenderTargetAttachment> {
    return this.attachments[index]
  }

  public setRenderTarget(index: number, texture: WebglTexture, mipLevel: number = 0, arrayLayer: number = 0) {
    if (index < 0 || index >= this.maxRenderTargets) {
      throw new Error(`Render target index ${index} is out of bounds. Max render targets: ${this.maxRenderTargets}`)
    }
    const slot = this.attachments[index]

    let changed = slot.changed
    changed ||= slot.mipLevel !== mipLevel
    changed ||= slot.arrayLayer !== arrayLayer
    changed ||= slot.texture?.glHandle !== texture?.glHandle

    slot.changed = changed
    slot.texture = texture
    slot.mipLevel = mipLevel
    slot.arrayLayer = arrayLayer
    this.dirty ||= changed
  }

  public setDepthTarget(depth: WebglTexture, mipLevel: number = 0, arrayLayer: number = 0) {
    let changed = this.depthTargetChanged
    changed ||= this.depthTarget?.glHandle !== depth?.glHandle
    changed ||= this.depthArrayLayer !== arrayLayer
    changed ||= this.depthMipLevel !== mipLevel
    this.depthTargetChanged = changed
    this.depthTarget = depth
    this.depthArrayLayer = arrayLayer
    this.depthMipLevel = mipLevel
    this.dirty ||= changed
  }

  public setClearDepth(depth: number) {
    this.clearDepth[0] = depth
  }

  public setClearStencil(stencil: number) {
    this.clearStencil[0] = stencil
  }

  public setClearColor(index: number, color: GPUColor | IVec4) {
    const slot = this.attachments[index]
    if (!slot) {
      throw new Error(`Render target index ${index} is out of bounds. Max render targets: ${this.maxRenderTargets}`)
    }
    if (!color) {
      slot.clearColor[0] = 0
      slot.clearColor[1] = 0
      slot.clearColor[2] = 0
      slot.clearColor[3] = 1
      return
    }
    if (Array.isArray(color)) {
      slot.clearColor[0] = color[0]
      slot.clearColor[1] = color[1]
      slot.clearColor[2] = color[2]
      slot.clearColor[3] = color[3]
    } else if ('r' in color) {
      slot.clearColor[0] = color.r
      slot.clearColor[1] = color.g
      slot.clearColor[2] = color.b
      slot.clearColor[3] = color.a
    } else if ('x' in color) {
      slot.clearColor[0] = color.x
      slot.clearColor[1] = color.y
      slot.clearColor[2] = color.z
      slot.clearColor[3] = color.w
    }
  }

  /**
   * Commits pending changes.
   */
  public commit(force?: boolean) {
    if (!this.dirty && !force) {
      return
    }
    this.dirty = false

    const restoreRead = this.device.framebuffer.read
    const restoreDraw = this.device.framebuffer.draw
    this.device.framebuffer.activate(this.glHandle)
    this.commitState(force)
    this.device.framebuffer.restore(restoreRead, restoreDraw)
  }

  /**
   * Activates this framebuffer for rendering and commits any pending state changes.
   */
  public activate() {
    this.device.framebuffer.activate(this.glHandle)
    this.commit()
  }

  /**
   * Activates this framebuffer, commits changes and clears the attachments with their specified clear colors
   */
  public clear() {
    this.activate()
    const gl = this.device.context
    for (const attachment of this.attachments) {
      if (attachment.texture) {
        gl.clearBufferfv(gl.COLOR, attachment.index, attachment.clearColor)
      }
    }
    if (this.depthTarget) {
      const depthFormat = this.depthTarget.format
      switch (depthFormat) {
        case 'DEPTH16_UNORM':
        case 'DEPTH24_PLUS':
          gl.clearBufferfv(gl.DEPTH, 0, this.clearDepth)
          break
        case 'STENCIL8':
          gl.clearBufferiv(gl.STENCIL, 0, this.clearStencil)
          break
        case 'DEPTH24_PLUS_STENCIL8':
          gl.clearBufferfi(gl.DEPTH_STENCIL, 0, this.clearDepth[0], this.clearStencil[0])
          break
      }
    }
  }

  public hasAttachments() {
    if (this.depthTarget) {
      return true
    }
    for (const attachment of this.attachments) {
      if (attachment.texture) {
        return true
      }
    }
    return false
  }

  private commitState(force?: boolean) {
    for (const attachment of this.attachments) {
      this.commitColorAttachment(attachment, force)
    }
    this.commitDepthAttachment(force)
    this.commitDrawBuffers()
    if (this.hasAttachments()) {
      this.device.checkFramebufferStatus(this)
    }
  }

  private commitColorAttachment(attachment: RenderTargetAttachment, force?: boolean) {
    const gl = this.device.context
    if (!attachment.changed && !force) {
      return
    }
    attachment.changed = false

    const attachmentPoint = gl.COLOR_ATTACHMENT0 + attachment.index
    if (!attachment.texture) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, null, 0)
      return
    }

    if (attachment.texture.isRenderBuffer) {
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachmentPoint, gl.RENDERBUFFER, attachment.texture.glHandle)
      return
    }

    switch (attachment.texture.type) {
      case 'TextureCube': {
        const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + attachment.arrayLayer
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          attachmentPoint,
          target,
          attachment.texture.glHandle,
          attachment.mipLevel,
        )
        break
      }
      case 'Texture2DArray':
      case 'Texture3D': {
        gl.framebufferTextureLayer(
          gl.FRAMEBUFFER,
          attachmentPoint,
          attachment.texture.glHandle,
          attachment.mipLevel,
          attachment.arrayLayer,
        )
        break
      }
      case 'Texture2D':
      default: {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          attachmentPoint,
          gl.TEXTURE_2D,
          attachment.texture.glHandle,
          attachment.mipLevel,
        )
        break
      }
    }
  }

  private commitDepthAttachment(force?: boolean) {
    const gl = this.device.context
    if (!this.depthTargetChanged && !force) {
      return
    }
    this.depthTargetChanged = false
    const texture = this.depthTarget
    const mipLevel = this.depthMipLevel
    const arrayLayer = this.depthArrayLayer
    if (!texture) {
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null)
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, null)
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null)
      return
    }

    const attachmentPoint = getDepthAttachmentPoint(gl, texture.format)
    if (texture.isRenderBuffer) {
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachmentPoint, gl.RENDERBUFFER, texture.glHandle)
      return
    }

    switch (texture.type) {
      case 'TextureCube': {
        const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + arrayLayer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, target, texture.glHandle, mipLevel)
        break
      }
      case 'Texture3D':
      case 'Texture2DArray': {
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachmentPoint, texture.glHandle, mipLevel, arrayLayer)
        break
      }
      case 'Texture2D': {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture.glHandle, mipLevel)
        break
      }
    }
  }

  private commitDrawBuffers(force?: boolean) {
    const gl = this.device.context
    let changed = !!force
    for (let i = 0; i < this.attachments.length; i++) {
      const slot = this.attachments[i]
      let target = gl.NONE
      if (slot.texture) {
        target = gl.COLOR_ATTACHMENT0 + slot.index
      }
      changed ||= this.drawBuffers[i] !== target
      this.drawBuffers[i] = target
    }

    if (changed) {
      gl.drawBuffers(this.drawBuffers)
    }
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

function getDepthAttachmentPoint(gl: WebGL2RenderingContext, surface: SurfaceFormat) {
  switch (surface) {
    case 'DEPTH16_UNORM':
    case 'DEPTH24_PLUS':
    case 'DEPTH32_FLOAT':
      return gl.DEPTH_ATTACHMENT
    case 'DEPTH24_PLUS_STENCIL8':
    case 'DEPTH32_FLOAT_STENCIL8':
      return gl.DEPTH_STENCIL_ATTACHMENT
    case 'STENCIL8':
      return gl.STENCIL_ATTACHMENT
    default:
      return gl.DEPTH_ATTACHMENT
  }
}
