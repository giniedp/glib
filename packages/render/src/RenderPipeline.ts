import { FrameGraph, FrameResource } from './FrameGraph'
import { type RenderContext, type RenderPass } from './types'

export class RenderPipeline {
  /**
   * Name of this pipeline
   */
  public name: string

  public passes: RenderPass[] = []

  private graph = new FrameGraph<RenderPass>()
  private exports: FrameResource<RenderPass>[] = []

  /**
   * Removes all passes from this pipeline
   */
  public clear(): void {
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
    this.passes.sort(byOrder)
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
      try {
        node.pass.render(ctx)
      } catch (err) {
        console.error(`Error executing render pass ${node.pass.name}:`, err)
      } finally {
        for (const resource of node.release) {
          ctx.resources.release(resource.texture)
          resource.texture = null
        }
      }
    }
    for (const step of this.passes) {
      step.cleanup(ctx)
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
}

function byOrder(a: RenderPass, b: RenderPass) {
  return a.order - b.order
}
