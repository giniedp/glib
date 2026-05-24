import type { Device } from './Device'
import type { PrimitiveType } from './enums'
import type { Buffer, DeviceOutput, Program, Texture, VertexBuffer } from './resources'

import type {
  BlendState,
  CullState,
  DepthBiasState,
  DepthState,
  ScissorState,
  StencilState,
  ViewportState,
} from './states'
import { Renderable } from './types'

export abstract class RenderEncoder {
  public abstract readonly device: Device

  public abstract setProgram(bindings: Program): void

  public abstract setCullState(state: CullState): void
  public abstract getCullState(): CullState
  public abstract setDepthState(state: DepthState): void
  public abstract getDepthState(): DepthState
  public abstract setDepthBiasState(state: DepthBiasState): void
  public abstract getDepthBiasState(): DepthBiasState

  public abstract setStencilState(state: StencilState): void
  public abstract setPrimitiveType(type: PrimitiveType): void
  public abstract setIndexBuffer(buffer: Buffer, offset?: number, size?: number): void
  public abstract setVertexBuffer(buffer: VertexBuffer): void
  public abstract setRenderBlend(index: number, blend: BlendState): void
  public abstract getRenderBlend(index: number): BlendState
  public abstract setRenderMask(index: number, mask?: number): void
  public abstract setRenderTarget(
    index: number,
    target: Texture | DeviceOutput | null,
    mipLevel?: number,
    arrayLayer?: number,
    resolve?: Texture | DeviceOutput,
  ): void
  public abstract setDepthTarget(target: Texture): void
  public abstract setClearColor(index: number, color: GPUColor): void
  public abstract setClearDepth(depth: number): void
  public abstract setClearStencil(stencil: number): void
  public abstract setBlendConstants(r: number, g: number, b: number, a: number): void
  public abstract setStencilReference(value: number): void

  /**
   * Sets the viewport state for the render pass.
   */
  public abstract setViewportState(
    x: number,
    y: number,
    width: number,
    height: number,
    zMin?: number,
    zMax?: number,
  ): void

  /**
   * Sets the viewport state for the render pass. If null is passed, the dimensions will be set to the size of current render buffer (not render target)
   */
  public abstract setViewportState(state: ViewportState | null): void

  /**
   * Sets the scissor state for the render pass.
   */
  public abstract setScissorState(x: number, y: number, width: number, height: number): void
  /**
   * Sets the scissor state for the render pass. If the state is null, scissor testing will be disabled.
   */
  public abstract setScissorState(state: ScissorState | null): void

  public abstract draw(
    vertexCount: number,
    instanceCount?: number,
    vertexOffset?: number,
    instanceOffset?: number,
  ): void

  public abstract drawIndexed(
    indexCount: number,
    instanceCount?: number,
    indexOffset?: number,
    baseVertex?: number,
    instanceOffset?: number,
  ): void

  /**
   * Just calls the render method on the given object
   */
  public render(renderable: Renderable): void {
    renderable.render(this)
  }

  /**
   * Clears the render targets and depth/stencil buffers according to the current clear values.
   */
  public abstract clear(): void

  /**
   * Resolve the render targets to their resolve targets if they are set.
   *
   * @remarks
   * Meant to resolve multisampled render targets to non-multisampled textures.
   * For webgl this may work for arbitrary combinations of render and resolve targets.
   * For webgpu the source must be a multisampled texture.
   */
  public abstract resolve(): void

  /**
   * Ends the current render pass and submits the command buffer to the GPU.
   * Keeps the state of the render pass to be reused for next draw call.
   *
   * @remarks
   * For webgl, this is a no-op since there is no explicit render pass management.
   */
  public abstract submit(): void

  /**
   * Ends and submits the current render pass, and resets the state.
   *
   * @remarks
   * For webgl, this will reset internal state variables to default values
   * but not upload them to the GPU until the next draw call.
   */
  public abstract flush(): void
}
