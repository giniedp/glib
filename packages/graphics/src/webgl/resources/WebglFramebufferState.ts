import type { WebGLHandle } from '../types'
import type { WebglDevice } from '../WebglDevice'

export class WebglFramebufferState {
  private device: WebglDevice
  private readBuffer: WebGLFramebuffer | null = undefined
  private drawBuffer: WebGLFramebuffer | null = undefined

  public get read() {
    return this.readBuffer
  }
  public get draw() {
    return this.drawBuffer
  }

  public constructor(device: WebglDevice) {
    this.device = device
    this.device.onContextLost.add(() => {
      this.readBuffer = undefined
      this.drawBuffer = undefined
    })
  }

  public activate(resource: WebGLHandle<WebGLFramebuffer> | null) {
    if (this.readBuffer !== resource || this.drawBuffer !== resource) {
      this.readBuffer = resource
      this.drawBuffer = resource
      this.device.context.bindFramebuffer(this.device.context.FRAMEBUFFER, resource)
    }
  }

  public activateRead(resource: WebGLHandle<WebGLFramebuffer> | null) {
    if (this.readBuffer !== resource) {
      this.readBuffer = resource
      this.device.context.bindFramebuffer(this.device.context.READ_FRAMEBUFFER, resource)
    }
  }

  public activateDraw(resource: WebGLHandle<WebGLFramebuffer> | null) {
    if (this.drawBuffer !== resource) {
      this.drawBuffer = resource
      this.device.context.bindFramebuffer(this.device.context.DRAW_FRAMEBUFFER, resource)
    }
  }

  public restore(read: WebGLFramebuffer | null, draw: WebGLFramebuffer | null) {
    if (read === draw) {
      this.activate(read)
    } else {
      this.activateRead(read)
      this.activateDraw(draw)
    }
  }
}
