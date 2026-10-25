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

export type RenderChannelOptions = Partial<TextureDescriptor> & { format: TextureDescriptor['format'] }

export function renderChannelSchema(options: RenderChannelOptions): Readonly<TextureDescriptor> {
  return {
    type: '2d',
    width: 1,
    height: 1,
    depth: 1,
    sampleCount: 1,
    mipLevelCount: 1,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    ...options,
  }
}

export function createRenderChannelSchema(device: Device): Record<RenderChannel, Readonly<TextureDescriptor>> {
  return {
    [RenderChannel.Color]: renderChannelSchema({
      name: 'RenderChannel.Color',
      format: 'rgba16float',
    }),
    [RenderChannel.ColorMsaa]: renderChannelSchema({
      name: 'RenderChannel.ColorMsaa',
      format: 'rgba16float',
      sampleCount: 4,
    }),
    [RenderChannel.Depth]: renderChannelSchema({
      name: 'RenderChannel.Depth',
      format: 'depth24plus-stencil8',
    }),
    [RenderChannel.DepthMsaa]: renderChannelSchema({
      name: 'RenderChannel.DepthMsaa',
      format: 'depth24plus-stencil8',
      sampleCount: 4,
    }),
    [RenderChannel.LinearDepth]: renderChannelSchema({
      name: 'RenderChannel.LinearDepthRes',
      format: 'r32float',
    }),
    [RenderChannel.LinearDepthMsaa]: renderChannelSchema({
      name: 'RenderChannel.LinearDepthMsaa',
      format: 'r32float',
      sampleCount: 4,
    }),
  }
}
