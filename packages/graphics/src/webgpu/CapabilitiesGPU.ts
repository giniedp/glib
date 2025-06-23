import { Capabilities } from '../Capabilities'
import type { Device } from '../Device'
import type { DeviceGPU } from './DeviceGPU'

/**
 * @public
 */
export class CapabilitiesGPU implements Capabilities {
  public device: DeviceGPU

  public get maxViewportWidth(): number {
    return 0
  }
  public get maxViewportHeight(): number {
    return 0
  }
  public get maxRenderBufferSize(): number {
    return 0
  }
  public get maxTextureUnits(): number {
    return 0
  }
  public get maxTextureSize(): number {
    return 0
  }
  public get maxVertexAttributes(): number {
    return 0
  }
  public get maxVertexTextureUnits(): number {
    return 0
  }
  public get maxVertexUniformVectors(): number {
    return 0
  }
  public get maxVaryingVectors(): number {
    return 0
  }
  public get maxFragmentUniformVectors(): number {
    return 0
  }

  get maxDrawBuffers(): number {
    return 0
  }

  get maxColorAttachments(): number {
    return 0
  }

  get textureFormatFloat() {
    return true
  }
  get textureFormatHalfFloat() {
    return true
  }

  constructor(device: Device) {
    this.device = device as any
  }

  get textureCompressionAstc(): boolean {
    return false
  }
  get textureCompressionEtc2(): boolean {
    return false
  }
  get textureCompressionEtc1(): boolean {
    return false
  }
  get textureCompressionPvrtc(): boolean {
    return false
  }
  get textureCompressionBc(): boolean {
    return false
  }
  get textureCompressionBptc(): boolean {
    return false
  }

}
