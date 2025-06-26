import type { SurfaceFormat } from './enums'

export type TextureCompression = 'Astc' | 'Etc1' | 'Etc2' | 'Pvrtc' | 'Bc' | 'Bptc'
/**
 * @public
 */
export interface Capabilities {
  maxViewportWidth: number
  maxViewportHeight: number
  maxRenderBufferSize: number
  maxTextureUnits: number
  maxTextureSize: number
  maxVertexAttributes: number
  maxVertexTextureUnits: number
  maxVertexUniformVectors: number
  maxVaryingVectors: number
  maxFragmentUniformVectors: number
  maxDrawBuffers: number
  maxColorAttachments: number
  textureFormatFloat: boolean
  textureFormatHalfFloat: boolean

  textureCompression: TextureCompression[]
  textureCompressionAstc: boolean
  textureCompressionEtc2: boolean
  textureCompressionEtc1: boolean
  textureCompressionPvrtc: boolean
  textureCompressionBc: boolean
  textureCompressionBptc: boolean

  isFormatSupported(format: SurfaceFormat): boolean
}
