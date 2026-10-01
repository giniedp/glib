import { FrameGraph } from '../FrameGraph'
import { RenderContext, RenderPass } from '../Types'

export interface GroupPassOptions {
  name?: string
  enabled?: boolean
  passes: RenderPass[]
}

/**
 * Creates a new group pass that can be used to group multiple render passes
 * together, allowing them to be enabled and disabled all at once
 *
 * @param options
 * @returns
 */
export function groupPass(options: GroupPassOptions): GroupPass {
  return new GroupPass(options)
}

/**
 * A render pass that groups multiple render passes together, allowing them to be
 * enabled and disabled all at once
 */
export class GroupPass implements RenderPass {
  public name: string = 'GroupPass'
  public enabled: boolean = true
  public passes: RenderPass[] = []

  public constructor(options?: GroupPassOptions) {
    this.name = options?.name ?? this.name
    this.enabled = options?.enabled ?? this.enabled
    this.passes = options?.passes ?? this.passes
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!this.enabled) {
      return
    }
    for (const pass of this.passes) {
      pass.setup(frame, ctx)
    }
  }

  public render(ctx: RenderContext): void {
    // the group itself does not render
    // the passes will be rendered by the pipeline
  }

  public cleanup(ctx: RenderContext): void {
    for (const pass of this.passes) {
      pass.cleanup(ctx)
    }
  }
}
