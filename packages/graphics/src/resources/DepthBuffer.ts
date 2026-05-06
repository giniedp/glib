import type { DepthStencilFormat } from '../enums'
import type { TextureOptions } from './Texture'

export interface DepthBufferOptions extends TextureOptions {
  format: DepthStencilFormat
}
