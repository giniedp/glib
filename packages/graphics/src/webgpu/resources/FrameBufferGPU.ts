import { getOption } from '@gglib/utils'

import { Color, RGBA_FORMAT } from '../../Color'
import { DepthBuffer, FrameBuffer, FrameBufferOptions, Texture } from '../../resources'
import { DeviceGPU } from '../DeviceGPU'
import { DepthBufferGPU } from './DepthBufferGPU'
import { TextureGPU } from './TextureGPU'

export class FrameBufferGPU extends FrameBuffer {
  public readonly device: DeviceGPU

  public readonly colorAttachments: ReadonlyArray<Texture>
  public readonly depthAttachment: DepthBuffer

  public readonly reanderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [],
    depthStencilAttachment: {
      attachment: null,
      depthLoadValue: 0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store',
    },
  }

  public get colorAttachmentsDesc() {
    return this.reanderPassDescriptor.colorAttachments
  }

  public get depthAttachmentDesc() {
    return this.reanderPassDescriptor.depthStencilAttachment
  }

  constructor(device: DeviceGPU, options: FrameBufferOptions) {
    super()
    this.device = device
    this.init(options)
  }

  public init(options: FrameBufferOptions) {
    const textures = getOption(options, 'textures', this.colorAttachments as any) || []
    const depthBuffer = getOption(options, 'depthBuffer', this.depthAttachment) as DepthBufferGPU

    const colorAttachmentsDesc = this.colorAttachmentsDesc as GPURenderPassColorAttachmentDescriptor[]
    colorAttachmentsDesc.length = textures.length
    for (let i = 0; i < textures.length; i++) {
      if (!colorAttachmentsDesc[i]) {
        colorAttachmentsDesc[i] = {
          attachment: null,
          loadValue: Color.TransparentBlack,
          storeOp: 'store',
        }
      }
      if (textures[i] === this.device.mainTexture) {
        colorAttachmentsDesc[i].attachment = this.device.mainTexture.handle.createView()
        colorAttachmentsDesc[i].resolveTarget = this.device.swapChain.getCurrentTexture().createView()
      } else {
        colorAttachmentsDesc[i].attachment = (textures[i] as TextureGPU).handle.createView()
        colorAttachmentsDesc[i].resolveTarget = null
      }
    }

    this.depthAttachmentDesc.attachment = depthBuffer ? depthBuffer.handle.createView() : null

    return this
  }

  public setClearValues(color?: number | number[] | Color, depth?: number, stencil?: number) {
    if (color != null) {
      for (const ca of this.colorAttachmentsDesc as GPURenderPassColorAttachmentDescriptor[]) {
        if (color instanceof Color) {
          ca.loadValue = color
        } else if (typeof color === 'number') {
          ca.loadValue = [RGBA_FORMAT.x(color), RGBA_FORMAT.y(color), RGBA_FORMAT.z(color), RGBA_FORMAT.w(color)]
        } else if (Array.isArray(color)) {
          ca.loadValue = color as [number, number, number, number]
        }
      }
    }
    if (depth != null) {
      this.depthAttachmentDesc.depthLoadValue = depth
    }

    if (stencil != null) {
      this.depthAttachmentDesc.stencilLoadValue = stencil
    }
  }
}
