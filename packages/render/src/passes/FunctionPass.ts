import { InputSlot, InputValueType } from '@gglib/graphics'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderContext, RenderPass } from '../Types'

export interface FunctionPassOptions {
  name?: string
  enabled?: boolean
  /**
   * Channels read by this pass. The resources are passed to the render function in the same order.
   */
  reads?: RenderChannel[]
  /**
   * Called when the pass executes
   */
  render: (ctx: RenderContext, resources: ReadonlyArray<FrameResource>) => void
}

/**
 * A pass that executes a function at its position in the pipeline, e.g. to update render inputs between passes.
 *
 * The pass is never culled, since its effect is not visible to the frame graph.
 */
export class FunctionPass implements RenderPass {
  public name: string = 'FunctionPass'
  public enabled: boolean = true

  private reads: RenderChannel[]
  private resources: FrameResource[] = []
  private fn: FunctionPassOptions['render']

  public constructor(options: FunctionPassOptions) {
    this.name = options.name ?? this.name
    this.enabled = options.enabled ?? this.enabled
    this.reads = options.reads ?? []
    this.fn = options.render
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!this.enabled) {
      return
    }
    frame.addPass(this)
    frame.keepAlive()
    for (let i = 0; i < this.reads.length; i++) {
      this.resources[i] = frame.read(this.reads[i])
    }
    this.resources.length = this.reads.length
  }

  public render(ctx: RenderContext): void {
    this.fn(ctx, this.resources)
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}

export interface RenderInputsPassOptions {
  name?: string
  enabled?: boolean
  /**
   * Render input values to set
   */
  values?: Array<[slot: InputSlot, value: InputValueType]>
  /**
   * Texture slots to bind to the current resource of a channel
   */
  textures?: Array<[slot: InputSlot<'texture'>, channel: RenderChannel]>
}

/**
 * Creates a {@link FunctionPass} that updates render inputs of the render context
 *
 * @example
 * ```ts
 * const pass = renderInputsPass({
 *   name: 'UpdateRenderInputs',
 *   values: [
 *     [InputSlot('exposure'), 1.0],
 *     [InputSlot('gamma'), 2.2],
 *   ],
 *   textures: [
 *     [InputSlot('sceneColorMap'), RenderChannel.Color],
 *     [InputSlot('sceneDepthMap'), RenderChannel.LinearDepth],
 *   ],
 * })
 * ```
 */
export function renderInputsPass(options: RenderInputsPassOptions): FunctionPass {
  const values = options.values ?? []
  const textures = options.textures ?? []
  return new FunctionPass({
    name: options.name ?? 'RenderInputs',
    enabled: options.enabled,
    reads: textures.map(([, channel]) => channel),
    render: (ctx, resources) => {
      for (const [slot, value] of values) {
        ctx.renderInputs.set(slot, value)
      }
      for (let i = 0; i < textures.length; i++) {
        ctx.renderInputs.set(textures[i][0], resources[i].texture)
      }
    },
  })
}
