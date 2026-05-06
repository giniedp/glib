import { Device, TextureDescriptor, TextureUsage } from '@gglib/graphics'
import { brand, Brand } from '@gglib/utils'

export function renderChannel(name: string): RenderChannel {
  return brand(name)
}
export type RenderChannel = Brand<string, 'RenderChannel'>
export const RenderChannel = {
  /**
   * The default color channel
   */
  Color: renderChannel('color'),
  /**
   * The default depth channel
   */
  Depth: renderChannel('depth'),
  ColorMsaa: renderChannel('color_msaa'),
  DepthMsaa: renderChannel('depth_msaa'),
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
      usage: TextureUsage.RenderTarget | TextureUsage.Sampled,
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
      usage: TextureUsage.RenderTarget | TextureUsage.Sampled,
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
  }
}
