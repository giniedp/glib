import type { SurfaceFormat, TextureCompression } from './enums'

/**
 * @public
 */
export interface Capabilities {
  maxTextureCount: number
  maxTextureSize: number
  maxVertexAttributes: number
  maxVertexTextureCount: number
  maxRenderTargets: number
  maxRenderTargetSize: number

  canRenderR32F: boolean
  canRenderRG32F: boolean
  canRenderRGBA32F: boolean
  canFilterR32F: boolean
  canFilterRG32F: boolean
  canFilterRGBA32F: boolean

  canRenderR16F: boolean
  canRenderRG16F: boolean
  canRenderRGBA16F: boolean
  canFilterR16F: boolean
  canFilterRG16F: boolean
  canFilterRGBA16F: boolean

  textureCompression: TextureCompression[]
  textureCompressionAstc: boolean
  textureCompressionEtc2: boolean
  textureCompressionEtc1: boolean
  textureCompressionPvrtc: boolean
  textureCompressionBc: boolean
  textureCompressionBptc: boolean

  isFormatSupported(format: SurfaceFormat): boolean
}
