import { TextureUsage, type TextureDescriptor } from '@gglib/graphics'
import { renderChannel, type RenderChannel } from '@gglib/render'

type TextureFormat = TextureDescriptor['format']

/**
 * Render channels of the GBuffer (layout in material/gbuffer.wgsl.ts).
 *
 * The *Msaa channels are rendered by the GBuffer pass with MSAA, the single sample channels without.
 * Screen space passes read the single sample channels or sample 0 of the multisampled ones.
 */
export const GBufferChannel = {
  /**
   * Octahedral normal (rg), transmittance luma (b), lighting model (a)
   */
  A: renderChannel('nw_gbuffer_a'),
  AMsaa: renderChannel('nw_gbuffer_a_msaa'),
  /**
   * sqrt(albedo) (rgb), occlusion (a)
   */
  B: renderChannel('nw_gbuffer_b'),
  BMsaa: renderChannel('nw_gbuffer_b_msaa'),
  /**
   * Smoothness (r), reflectance YCbCr (gba) or transmittance chroma (ba)
   */
  C: renderChannel('nw_gbuffer_c'),
  CMsaa: renderChannel('nw_gbuffer_c_msaa'),
  /**
   * Linear view depth of the single sample GBuffer, 0 without geometry. The lighting pass writes the scene
   * LinearDepth from it (with MSAA it reads LinearDepthMsaa).
   */
  LinearDepth: renderChannel('nw_gbuffer_linear_depth'),
  /**
   * Single sample sky, drawn before the lighting pass, which composes it into pixels and samples without geometry
   */
  SkyColor: renderChannel('nw_sky_color'),
  /**
   * Own depth targets of the debug gbuffer pass, which runs next to the forward pipeline (phase 3)
   */
  DebugDepth: renderChannel('nw_gbuffer_debug_depth'),
  DebugLinearDepth: renderChannel('nw_gbuffer_debug_linear_depth'),
}

const FORMAT_A: TextureFormat = 'rgb10a2unorm'
const FORMAT_BC: TextureFormat = 'rgba8unorm'

function descriptor(name: string, format: TextureFormat, sampleCount: number): Readonly<TextureDescriptor> {
  return {
    name,
    type: '2d',
    format,
    width: 1,
    height: 1,
    depth: 1,
    sampleCount,
    mipLevelCount: 1,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
  }
}

/**
 * Descriptors of all GBuffer channels, to be registered on the frame graph by the passes that write them
 */
export const GBUFFER_DESCRIPTORS: Record<RenderChannel, Readonly<TextureDescriptor>> = {
  [GBufferChannel.A]: descriptor('GBufferChannel.A', FORMAT_A, 1),
  [GBufferChannel.AMsaa]: descriptor('GBufferChannel.AMsaa', FORMAT_A, 4),
  [GBufferChannel.B]: descriptor('GBufferChannel.B', FORMAT_BC, 1),
  [GBufferChannel.BMsaa]: descriptor('GBufferChannel.BMsaa', FORMAT_BC, 4),
  [GBufferChannel.C]: descriptor('GBufferChannel.C', FORMAT_BC, 1),
  [GBufferChannel.CMsaa]: descriptor('GBufferChannel.CMsaa', FORMAT_BC, 4),
  [GBufferChannel.LinearDepth]: descriptor('GBufferChannel.LinearDepth', 'r32float', 1),
  [GBufferChannel.SkyColor]: descriptor('GBufferChannel.SkyColor', 'rgba16float', 1),
  [GBufferChannel.DebugDepth]: descriptor('GBufferChannel.DebugDepth', 'depth24plus-stencil8', 1),
  [GBufferChannel.DebugLinearDepth]: descriptor('GBufferChannel.DebugLinearDepth', 'r32float', 1),
}
