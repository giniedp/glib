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

  textureCompressionAstc: boolean
  textureCompressionEtc2: boolean
  textureCompressionEtc1: boolean
  textureCompressionPvrtc: boolean
  textureCompressionBc: boolean
  textureCompressionBptc: boolean
}
