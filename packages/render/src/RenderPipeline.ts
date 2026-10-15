import { isOwnable, type Ownable, ResourceOwnership } from '@gglib/graphics'
import { FrameGraph, FrameResource } from './FrameGraph'
import { type RenderContext, type RenderPass } from './Types'

export interface RenderPipelineOptions {
  name?: string
  passes?: RenderPass[]
}

/**
 * Executes a list of render passes
 *
 * @remarks
 * The pipeline owns the passes it is constructed with, if they are {@link Ownable}.
 * They are finalized together with the pipeline, or when removed with {@link RenderPipeline.clear}.
 */
export class RenderPipeline implements Ownable {
  /**
   * The ownership state of this pipeline
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  /**
   * Name of this pipeline
   */
  public name: string

  public passes: RenderPass[]

  private graph = new FrameGraph<RenderPass>()
  private exports: FrameResource<RenderPass>[] = []

  public constructor(options?: RenderPipelineOptions) {
    this.name = options?.name ?? 'Render Pipeline'
    this.passes = options?.passes || []
    for (const pass of this.passes) {
      if (isOwnable(pass)) {
        this.ownership.adopt(pass)
      }
    }
  }

  /**
   * Removes all passes from this pipeline
   */
  public clear(): void {
    for (const pass of this.passes) {
      if (isOwnable(pass)) {
        this.ownership.drop(pass)
      }
    }
    this.passes = []
    this.graph.begin([], 1, 1)
    this.graph.compile()
  }

  /**
   * Executes this render pipeline, rendering the given context into the output of the current view.
   */
  public execute(ctx: RenderContext): void {
    this.graph.setDescriptors(ctx.channelDescriptors)
    this.graph.begin(ctx.view.output, ctx.viewWidth, ctx.viewHeight)
    for (const pass of this.passes) {
      pass.setup(this.graph, ctx)
    }
    this.exports.length = 0
    for (const channel of ctx.view.output) {
      this.exports.push(this.graph.export(channel))
    }

    this.graph.compile()

    for (const node of this.graph.nodes) {
      for (const resource of node.acquire) {
        resource.texture = ctx.resources.acquire(resource.desc, `v${resource.version}`)
      }
      const timer = node.pass.gpuTimer
      if (timer) {
        ctx.device.renderPass.beginTimer(timer)
      }
      try {
        node.pass.render(ctx)
      } catch (err) {
        console.error(`Error executing render pass ${node.pass.name}:`, err)
      } finally {
        if (timer) {
          ctx.device.renderPass.endTimer(timer)
        }
        for (const resource of node.release) {
          ctx.resources.release(resource.texture)
          resource.texture = null
        }
      }
    }
    for (const pass of this.passes) {
      pass.cleanup(ctx)
    }

    for (const resource of this.exports) {
      const oldTexture = ctx.view.exports[resource.channel]
      const newTexture = resource.texture
      if (oldTexture && oldTexture !== newTexture) {
        ctx.resources.release(oldTexture)
      }
      ctx.view.exports[resource.channel] = newTexture
    }
  }

  /**
   * Immediately finalizes this pipeline and its passes
   */
  public dispose() {
    this.ownership.finalize()
  }
}
