import { Device, TextureDescriptor, TextureUsage } from '@gglib/graphics'
import { brand, Brand } from '@gglib/utils'

export function renderChannel(name: string): RenderChannel {
  return brand(name)
}
export type RenderChannel = Brand<string, 'RenderChannel'>
export const RenderChannel = {
  /**
   * Msaa color buffer
   */
  ColorMsaa: renderChannel('color_msaa'),
  /**
   * Non-msaa color buffer
   */
  Color: renderChannel('color'),

  /**
   * Msaa depth buffer
   */
  DepthMsaa: renderChannel('depth_msaa'),
  /**
   * Non-msaa depth buffer
   */
  Depth: renderChannel('depth'),

  /**
   * Msaa linear depth texture (MRT)
   */
  LinearDepthMsaa: renderChannel('linear_depth_msaa'),
  /**
   * Resolved linear depth texture (MRT)
   */
  LinearDepth: renderChannel('linear_depth'),
}

export function createRenderChannelSchema(device: Device): Record<RenderChannel, Readonly<TextureDescriptor>> {
  return {
    [RenderChannel.Color]: {
      name: 'RenderChannel.Color',
      type: 'Texture2D',
      format: 'RGBA16_FLOAT',
      width: 1,
      height: 1,
      depth: 1,
      sampleCount: 1,
      mipLevelCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    },
    [RenderChannel.ColorMsaa]: {
      name: 'RenderChannel.ColorMsaa',
      type: 'Texture2D',
      format: 'RGBA16_FLOAT',
      width: 1,
      height: 1,
      depth: 1,
      sampleCount: 4,
      mipLevelCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    },
    [RenderChannel.Depth]: {
      name: 'RenderChannel.Depth',
      type: 'Texture2D',
      format: 'DEPTH24_PLUS_STENCIL8',
      width: 1,
      height: 1,
      depth: 1,
      sampleCount: 1,
      mipLevelCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    },
    [RenderChannel.DepthMsaa]: {
      name: 'RenderChannel.DepthMsaa',
      type: 'Texture2D',
      format: 'DEPTH24_PLUS_STENCIL8',
      width: 1,
      height: 1,
      depth: 1,
      sampleCount: 4,
      mipLevelCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    },
    [RenderChannel.LinearDepth]: {
      name: 'RenderChannel.LinearDepthRes',
      type: 'Texture2D',
      format: 'R16_FLOAT',
      width: 1,
      height: 1,
      depth: 1,
      sampleCount: 1,
      mipLevelCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    },
    [RenderChannel.LinearDepthMsaa]: {
      name: 'RenderChannel.LinearDepthMsaa',
      type: 'Texture2D',
      format: 'R16_FLOAT',
      width: 1,
      height: 1,
      depth: 1,
      sampleCount: 4,
      mipLevelCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    },
  }
}
