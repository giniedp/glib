import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import { BlendState, DepthState, TextureUsage, type Device, type Program, type TextureDescriptor } from '@gglib/graphics'
import {
  FrameGraph,
  renderChannel,
  RenderChannel,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'

export const NwCopyChannel = {
  /**
   * Copy of the (single sample) scene color, sampled by transparent materials as scene color input
   * when they render into the same color target (no MSAA)
   */
  SceneColor: renderChannel('nw_scene_color'),
}

const SCENE_COLOR_DESC: Readonly<TextureDescriptor> = {
  name: 'NwCopyChannel.SceneColor',
  type: '2d',
  format: 'rgba16float',
  width: 1,
  height: 1,
  depth: 1,
  sampleCount: 1,
  mipLevelCount: 1,
  usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
}

const COPY_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

@group(0) @binding(0) var source: texture_2d<f32>;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  return textureLoad(source, vec2i(in.position.xy), 0);
}
`

export interface CopyPassOptions {
  name?: string
  /**
   * Single sample channel to copy from
   */
  input: RenderChannel
  /**
   * Channel to copy into. {@link NwCopyChannel.SceneColor} is registered by this pass.
   */
  output?: RenderChannel
}

/**
 * Copies a single sample color channel into another channel with a fullscreen draw
 * (the game copies the HDR target before each transparent group, too)
 */
export class CopyPass implements RenderPass {
  public name: string = 'Copy'
  public enabled = true

  private input: RenderChannel
  private output: RenderChannel
  private program: Program
  private isActive = false
  private source: FrameResource
  private target: FrameResource

  public constructor(device: Device, options: CopyPassOptions) {
    this.name = options.name ?? this.name
    this.input = options.input
    this.output = options.output ?? NwCopyChannel.SceneColor
    device.ready.then(() => {
      this.program = device.createShaderModule({ name: 'NW Copy', wgsl: { source: COPY_WGSL } }).program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    // the output is always declared, later passes read it. Until the program is compiled (or when disabled)
    // the copy is skipped and the target keeps undefined content
    this.isActive = this.enabled && !!this.program?.isCompiled
    if (this.output === NwCopyChannel.SceneColor) {
      frame.setDescriptors({ [this.output]: SCENE_COLOR_DESC })
    }
    frame.addPass(this)
    this.source = frame.read(this.input)
    this.target = frame.write(this.output)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const pass = ctx.device.renderPass
    const target = this.target.texture
    pass.flush()
    this.program.mustSet('source', this.source.texture)
    this.program.commit()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setRenderTarget(0, target)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
