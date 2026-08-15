import { Device, TextureDescriptor, TextureUsage } from '@gglib/graphics'
import { brand, Brand } from '@gglib/utils'

export function renderChannel(name: string): RenderChannel {
  return brand(name)
}
export type RenderChannel = Brand<string, 'RenderChannel'>
export const RenderChannel = {
  /**
   * Msaa depth buffer
   */
  DepthMsaa: renderChannel('depth_msaa'),
  /**
   * Non-msaa depth buffer
   */
  Depth: renderChannel('depth'),

  /**
   * Msaa color buffer
   */
  ColorMsaa: renderChannel('color_msaa'),
  /**
   * Non-msaa color buffer
   */
  Color: renderChannel('color'),

  /**
   * Msaa linear depth texture (MRT)
   */
  LinearDepthMsaa: renderChannel('linear_depth_msaa'),
  /**
   * Resolved linear depth texture (MRT)
   */
  LinearDepthRes: renderChannel('linear_depth_res'),
  // LinearDepthResHalf: renderChannel('linear_depth_res_half'),
  // LinearDepthResQuat: renderChannel('linear_depth_res_quat'),
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
      usage: TextureUsage.RenderTarget,
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
      usage: TextureUsage.RenderTarget,
    },
    [RenderChannel.LinearDepthRes]: {
      name: 'RenderChannel.LinearDepthRes',
      type: 'Texture2D',
      format: 'R16_FLOAT',
      width: 1,
      height: 1,
      depth: 1,
      sampleCount: 1,
      mipLevelCount: 1,
      usage: TextureUsage.RenderTarget,
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
      usage: TextureUsage.RenderTarget,
    },
  }
}
