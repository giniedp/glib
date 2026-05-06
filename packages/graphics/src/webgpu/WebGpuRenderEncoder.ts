import { Color } from '../Color'
import { RenderEncoder } from '../RenderEncoder'
import { surfaceIsStencilFormat, type PrimitiveType } from '../enums'
import { Texture, type Buffer, type DeviceOutput, type Program, type VertexBuffer } from '../resources'
import {
  BlendState,
  CullState,
  DepthBiasState,
  DepthState,
  StencilState,
  type BlendConstant,
  type ScissorState,
  type ViewportState,
} from '../states'
import type { WebGpuDevice } from './WebGpuDevice'
import type { ColorTargetParams } from './cache/ColorTargetCache'
import type { PipelineParams } from './cache/PipelineCache'
import type { WebGpuProgram } from './resources'
import {
  WebGpuDeviceOutput,
  WebGpuTexture,
  type WebGpuBuffer,
  type WebGpuShaderModule,
  type WebGpuVertexBuffer,
} from './resources'

export class WebGpuRenderEncoder extends RenderEncoder {
  public device: WebGpuDevice

  private vertexBuffer: WebGpuVertexBuffer
  private indexBuffer: WebGpuBuffer
  private indexBufferOffset: number = 0
  private indexBufferSize: number = 0
  private readonly viewportState: ViewportState = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    zMin: 0,
    zMax: 1,
  }
  private readonly scissorState: ScissorState & { enabled: boolean } = {
    enabled: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }
  private blendConstants: BlendConstant = null
  private stencilReference: number

  private pipelineParamsChanged = true
  private pipelineParams: PipelineParams = {
    depthFormat: null,
    cullState: CullState.Disabled,
    depthBiasState: DepthBiasState.Default,
    depthState: DepthState.Disabled,
    stencilState: StencilState.Default,
    program: null,
    primitiveType: 'TriangleList',
    vertexLayout: [],
    targets: [],
    multisampleCount: null,
    multisampleMask: null,
    multisampleAlphaCoverage: false,
  }
  private programParams: WebGpuProgram
  private programParamsChanged = false

  private encoder: GPUCommandEncoder
  private pipeline: GPURenderPipeline
  private pass: GPURenderPassEncoder

  private outputWidth: number
  private outputHeight: number

  public constructor(device: WebGpuDevice) {
    super()
    this.device = device
  }

  public getCullState(): CullState {
    return this.pipelineParams.cullState
  }
  public getDepthState(): DepthState {
    return this.pipelineParams.depthState
  }
  public getDepthBiasState(): DepthBiasState {
    return this.pipelineParams.depthBiasState
  }
  public getRenderBlend(index: number): BlendState {
    return this.colorTargetParam(index).blendState
  }

  public setProgram(bindings: Program) {
    if (this.pipelineParams.program !== bindings?.module) {
      this.pipelineParamsChanged = true
      this.pipelineParams.program = bindings?.module as WebGpuShaderModule
    }
    if (this.programParams !== bindings) {
      this.programParams = bindings as WebGpuProgram
      this.programParamsChanged = true
    }
  }

  public setDepthState(state: DepthState) {
    if (this.pipelineParams.depthState !== state) {
      this.pipelineParamsChanged = true
      this.pipelineParams.depthState = state
    }
  }

  public setCullState(state: CullState) {
    if (this.pipelineParams.cullState !== state) {
      this.pipelineParamsChanged = true
      this.pipelineParams.cullState = state
    }
  }

  public setDepthBiasState(state: DepthBiasState) {
    if (this.pipelineParams.depthBiasState !== state) {
      this.pipelineParamsChanged = true
      this.pipelineParams.depthBiasState = state
    }
  }

  public setStencilState(state: StencilState) {
    if (this.pipelineParams.stencilState !== state) {
      this.pipelineParamsChanged = true
      this.pipelineParams.stencilState = state
    }
  }

  public setPrimitiveType(type: PrimitiveType) {
    if (this.pipelineParams.primitiveType !== type) {
      this.pipelineParams.primitiveType = type
      this.pipelineParamsChanged = true
    }
  }

  public setIndexBuffer(buffer: Buffer, offset?: number, size?: number): void
  public setIndexBuffer(buffer: WebGpuBuffer, offset?: number, size?: number): void {
    offset = offset ?? 0
    size = size ?? buffer.size - offset
    if (buffer !== this.indexBuffer || offset !== this.indexBufferOffset || size !== this.indexBufferSize) {
      this.indexBuffer = buffer
      this.indexBufferOffset = offset
      this.indexBufferSize = size
      this.applyIndexBuffer()
    }
  }

  public setVertexBuffer(buffer: VertexBuffer): void
  public setVertexBuffer(buffer: WebGpuVertexBuffer): void {
    this.pipelineParamsChanged ||= buffer !== this.vertexBuffer
    this.vertexBuffer = buffer
  }

  private colorTargetParams: ColorTargetParams[] = []
  private colorTargetStates: GPUColorTargetState[] = []
  private colorPassAttachments: GPURenderPassColorAttachment[] = []
  private clearPassAttachments: GPURenderPassColorAttachment[] = []

  private colorPassAttachment(index: number) {
    if (!this.colorPassAttachments[index]) {
      this.colorPassAttachments[index] = {
        view: null,
        loadOp: 'load',
        storeOp: 'store',
      }
    }
    return this.colorPassAttachments[index]
  }

  private clearPassAttachment(index: number) {
    if (!this.clearPassAttachments[index]) {
      this.clearPassAttachments[index] = {
        view: null,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
      }
    }
    return this.clearPassAttachments[index]
  }

  private colorTargetParam(index: number) {
    if (!this.colorTargetParams[index]) {
      this.colorTargetParams[index] = {
        format: null,
        blendState: BlendState.Disabled,
        writeMask: GPUColorWrite.ALL,
      }
    }
    return this.colorTargetParams[index]
  }

  private updateColorTargetBlend(index: number, blendState: BlendState) {
    this.colorTargetParam(index).blendState = blendState ?? BlendState.Disabled
    this.colorTargetStates[index] = this.device.colorTargetCache.get(this.colorTargetParam(index))
  }

  private updateColorTargetMask(index: number, writeMask: number) {
    this.colorTargetParam(index).writeMask = writeMask ?? GPUColorWrite.ALL
    this.colorTargetStates[index] = this.device.colorTargetCache.get(this.colorTargetParam(index))
  }

  private updateColorTargetFormat(index: number, format: GPUTextureFormat) {
    this.colorTargetParam(index).format = format
    this.colorTargetStates[index] = this.device.colorTargetCache.get(this.colorTargetParam(index))
  }

  public setRenderBlend(index: number, blendState: BlendState) {
    this.endPass()
    this.updateColorTargetBlend(index, blendState)
  }

  public setRenderMask(index: number, writeMask: number) {
    this.endPass()
    this.updateColorTargetMask(index, writeMask)
  }

  public setRenderTarget(
    index: number,
    texture: Texture | GPUTexture | DeviceOutput,
    mipLevel?: number,
    arrayLayer?: number,
    resolve?: Texture | GPUTexture | DeviceOutput,
  ) {
    this.endPass()

    let gpuTarget: GPUTexture | null = null
    if (texture instanceof WebGpuTexture) {
      gpuTarget = texture.gpuObject
    } else if (texture instanceof WebGpuDeviceOutput) {
      if (index > 0) {
        throw new Error('Only first render target can be set to DeviceOutput')
      }
      gpuTarget = texture.gpuObject
    } else if (texture instanceof GPUTexture) {
      gpuTarget = texture
    } else if (texture) {
      throw new Error('Invalid render target')
    } else {
      gpuTarget = null
    }

    let gpuResolve: GPUTexture = null
    if (resolve instanceof WebGpuTexture || resolve instanceof WebGpuDeviceOutput) {
      gpuResolve = (resolve as WebGpuTexture).gpuObject
    } else if (resolve instanceof GPUTexture) {
      gpuResolve = resolve
    } else if (resolve) {
      throw new Error('Invalid resolve target')
    }

    let gpuTargetView: GPUTexture | GPUTextureView | null = gpuTarget
    if (gpuTarget) {
      if (mipLevel != null || arrayLayer != null || gpuTarget.mipLevelCount > 1 || gpuTarget.depthOrArrayLayers > 1) {
        gpuTargetView = gpuTarget.createView({
          dimension: '2d',
          baseMipLevel: mipLevel ?? 0,
          mipLevelCount: 1,
          baseArrayLayer: arrayLayer ?? 0,
          arrayLayerCount: 1,
        })
      }

      const sampleCount = gpuTarget.sampleCount || 1
      if (this.pipelineParams.multisampleCount !== sampleCount) {
        this.pipelineParams.multisampleCount = sampleCount
        this.pipelineParamsChanged = true
      }
    }

    this.updateColorTargetFormat(index, gpuTarget?.format)

    if (gpuTargetView) {
      this.colorPassAttachment(index).view = gpuTargetView
      this.clearPassAttachment(index).view = gpuTargetView
      this.outputWidth = gpuTarget.width
      this.outputHeight = gpuTarget.height
    } else {
      delete this.colorPassAttachment(index).view
      delete this.clearPassAttachment(index).view
    }

    if (gpuResolve) {
      this.colorPassAttachment(index).resolveTarget = gpuResolve
      this.clearPassAttachment(index).resolveTarget = gpuResolve
    } else {
      delete this.colorPassAttachment(index).resolveTarget
      delete this.clearPassAttachment(index).resolveTarget
    }
  }

  private depthBufferAttachment: GPURenderPassDepthStencilAttachment = {
    view: null,
    depthLoadOp: 'load',
    depthStoreOp: 'store',
    depthReadOnly: false,
    stencilLoadOp: 'load',
    stencilStoreOp: 'store',
    stencilReadOnly: false,
  }
  private depthClearAttachment: GPURenderPassDepthStencilAttachment = {
    view: null,
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
    depthClearValue: 1.0,
    depthReadOnly: false,
    stencilLoadOp: 'clear',
    stencilStoreOp: 'store',
    stencilClearValue: 0,
    stencilReadOnly: false,
  }
  public setDepthTarget(buffer: Texture) {
    this.endPass()
    if (!buffer) {
      this.pipelineParamsChanged = !!this.depthBufferAttachment.view
      this.pipelineParams.depthFormat = null
      this.depthClearAttachment.view = null
      this.depthBufferAttachment.view = null
    } else {
      const format = buffer?.format
      const surface = (buffer as WebGpuTexture)?.gpuObject

      this.pipelineParamsChanged = this.pipelineParams.depthFormat !== format
      this.pipelineParams.depthFormat = format
      this.depthClearAttachment.view = surface
      this.depthBufferAttachment.view = surface
      if (surfaceIsStencilFormat(format)) {
        this.depthClearAttachment.stencilLoadOp = this.depthClearAttachment.depthLoadOp
        this.depthClearAttachment.stencilStoreOp = this.depthClearAttachment.depthStoreOp
        this.depthClearAttachment.stencilReadOnly = false

        this.depthBufferAttachment.stencilLoadOp = this.depthBufferAttachment.depthLoadOp
        this.depthBufferAttachment.stencilStoreOp = this.depthBufferAttachment.depthStoreOp
        this.depthBufferAttachment.stencilReadOnly = false
      } else {
        delete this.depthClearAttachment.stencilLoadOp
        delete this.depthClearAttachment.stencilStoreOp
        delete this.depthClearAttachment.stencilReadOnly

        delete this.depthBufferAttachment.stencilLoadOp
        delete this.depthBufferAttachment.stencilStoreOp
        delete this.depthBufferAttachment.stencilReadOnly
      }
    }
  }

  public setClearColor(index: number, color: GPUColor) {
    this.clearPassAttachment(index).clearValue = color
  }

  public setClearDepth(depth: number) {
    this.depthClearAttachment.depthClearValue = depth
  }

  public setClearStencil(stencil: number) {
    this.depthClearAttachment.stencilClearValue = stencil
  }

  public setBlendConstants(r: number, g: number, b: number, a: number) {
    if (!this.blendConstants) {
      this.blendConstants = [0, 0, 0, 0]
    }
    const values = this.blendConstants
    if (values[0] !== r || values[1] !== g || values[2] !== b || values[3] !== a) {
      values[0] = r
      values[1] = g
      values[2] = b
      values[3] = a
      this.applyBlendConstants(this.pass)
    }
  }

  public setStencilReference(value: number) {
    if (this.stencilReference !== value) {
      this.stencilReference = value
      this.applyStencilReference(this.pass)
    }
  }

  public setViewportState(x: number, y: number, width: number, height: number, zMin?: number, zMax?: number): void
  public setViewportState(state: ViewportState | null): void
  public setViewportState(
    xOrState: ViewportState | number,
    y?: number,
    width?: number,
    height?: number,
    zMin?: number,
    zMax?: number,
  ): void {
    if (xOrState == null) {
      this.setViewportState(0, 0, this.device.output.width, this.device.output.height)
      return
    }
    if (typeof xOrState !== 'number') {
      this.setViewportState(
        xOrState.x,
        xOrState.y,
        xOrState.width,
        xOrState.height,
        xOrState.zMin ?? 0,
        xOrState.zMax ?? 1,
      )
      return
    }
    this.viewportState.x = xOrState
    this.viewportState.y = y
    this.viewportState.width = width
    this.viewportState.height = height
    this.viewportState.zMin = zMin ?? 0
    this.viewportState.zMax = zMax ?? 1
    this.applyViewportState(this.pass)
  }

  public setScissorState(x: number, y: number, width: number, height: number): void
  public setScissorState(state: ScissorState | null): void
  public setScissorState(xOrState: ScissorState | number, y?: number, width?: number, height?: number): void {
    if (xOrState == null) {
      this.scissorState.enabled = false
      this.applyScissorState(this.pass)
      return
    }
    if (typeof xOrState != 'number') {
      this.setScissorState(xOrState.x, xOrState.y, xOrState.width, xOrState.height)
      return
    }
    this.scissorState.enabled = true
    this.scissorState.x = xOrState
    this.scissorState.y = y
    this.scissorState.width = width
    this.scissorState.height = height
    this.applyScissorState(this.pass)
  }

  private applyIndexBuffer() {
    if (this.pass && this.indexBuffer) {
      this.pass.setIndexBuffer(
        this.indexBuffer.resource,
        this.indexBuffer.indexType === 'uint16' ? 'uint16' : 'uint32',
        this.indexBufferOffset,
        this.indexBufferSize,
      )
    }
  }
  private applyBlendConstants(pass: GPURenderPassEncoder) {
    if (pass && this.blendConstants) {
      pass.setBlendConstant(this.blendConstants)
    }
  }

  private applyViewportState(pass: GPURenderPassEncoder) {
    if (!pass) {
      return
    }
    if (this.viewportState) {
      const vp = this.viewportState
      pass.setViewport(vp.x, vp.y, vp.width, vp.height, vp.zMin, vp.zMax)
    } else if (this.outputWidth && this.outputHeight) {
      pass.setViewport(0, 0, this.outputWidth, this.outputHeight, 0, 1)
    }
  }

  private applyScissorState(pass: GPURenderPassEncoder) {
    if (!pass || !this.scissorState?.enabled) {
      return
    }
    const rect = this.scissorState
    pass.setScissorRect(rect.x, rect.y, rect.width, rect.height)
  }

  private applyStencilReference(pass: GPURenderPassEncoder) {
    if (pass && this.stencilReference != null) {
      pass.setStencilReference(this.stencilReference)
    }
  }

  private applyBindGroups() {
    const params = this.programParams || this.pipelineParams.program?.program
    if (!this.pass || !params) {
      return
    }
    const bindGroups = params.bindGroups
    for (let i = 0; i < bindGroups.length; i++) {
      if (bindGroups[i]) {
        // TODO: utilize bind group offsets
        this.pass.setBindGroup(i, bindGroups[i])
      }
    }
    this.programParamsChanged = false
  }

  private applyVertexBuffer() {
    if (!this.pass || !this.vertexBuffer) {
      return
    }
    for (let i = 0; i < this.vertexBuffer.buffers.length; i++) {
      this.pass.setVertexBuffer(i, this.vertexBuffer.buffers[i].resource)
    }
  }

  public draw(vertexCount: number, instanceCount?: number, vertexOffset?: number, instanceOffset?: number) {
    this.getPass().draw(vertexCount, instanceCount ?? 1, vertexOffset ?? 0, instanceOffset ?? 0)
  }

  public drawIndexed(
    indexCount: number,
    instanceCount?: number,
    indexOffset?: number,
    baseVertex?: number,
    /* instanceOffset: number */
  ) {
    this.getPass().drawIndexed(indexCount, instanceCount ?? 1, indexOffset ?? 0, baseVertex ?? 0, 0)
  }

  private getClearPassDescriptor(): GPURenderPassDescriptor {
    this.updatePassDescriptor()
    return this.clearPassDescriptor
  }

  private getColorPassDescriptor(): GPURenderPassDescriptor {
    this.updatePassDescriptor()
    return this.colorPassDescriptor
  }

  private clearPassDescriptor: GPURenderPassDescriptor = {
    label: 'Clear Pass',
    colorAttachments: [],
  }
  private colorPassDescriptor: GPURenderPassDescriptor = {
    label: 'Color Pass',
    colorAttachments: [],
  }

  private updatePassDescriptor() {
    const clearAttachments = this.clearPassDescriptor.colorAttachments as GPURenderPassColorAttachment[]
    const colorAttachments = this.colorPassDescriptor.colorAttachments as GPURenderPassColorAttachment[]
    clearAttachments.length = 0
    colorAttachments.length = 0

    for (let i = 0; i < this.colorPassAttachments.length; i++) {
      const clear = this.clearPassAttachment(i)
      const color = this.colorPassAttachment(i)
      if (color.view) {
        clearAttachments.push(clear)
        colorAttachments.push(color)
      }
    }

    if (colorAttachments.length === 0) {
      const clear = this.clearPassAttachment(0)
      const color = this.colorPassAttachment(0)
      const target = this.device.output.gpuObject
      clear.view = target
      color.view = target
      this.updateColorTargetFormat(0, target.format)

      clearAttachments.push(clear)
      colorAttachments.push(color)
      this.outputWidth = this.device.output.width
      this.outputHeight = this.device.output.height
    }

    if (this.depthBufferAttachment.view) {
      this.colorPassDescriptor.depthStencilAttachment = this.depthBufferAttachment
      this.clearPassDescriptor.depthStencilAttachment = this.depthClearAttachment
    } else {
      delete this.colorPassDescriptor.depthStencilAttachment
      delete this.clearPassDescriptor.depthStencilAttachment
    }
  }

  public clear() {
    this.endPass()
    const descriptor = this.getClearPassDescriptor()

    const pass = this.getEncoder('clear').beginRenderPass(descriptor)
    this.applyStencilReference(pass)
    this.applyBlendConstants(pass)
    this.applyViewportState(pass)
    this.applyScissorState(pass)
    pass.end()
  }

  public resolve() {
    this.endPass()
    const descriptor = this.getColorPassDescriptor()
    const pass = this.getEncoder('resolve').beginRenderPass(descriptor)
    pass.end()
  }

  private getEncoder(label: string) {
    this.encoder ||= this.device.gpu.createCommandEncoder({ label })
    return this.encoder
  }

  private getVertexLayout() {
    if (!this.pipelineParams.program || !this.vertexBuffer) {
      return null
    }
    return this.pipelineParams.program.getVertexLayout(this.vertexBuffer)
  }

  private getColorTargetState() {
    const program = this.pipelineParams.program
    const count = (program ? program.getMaxOutputLocation() : 0) + 1
    return this.device.colorTargetListCache.get(this.colorTargetStates, count)
  }

  private getPipeline() {
    if (this.pipeline && !this.pipelineParamsChanged) {
      return this.pipeline
    }
    this.pipelineParamsChanged = false
    this.pipelineParams.vertexLayout = this.getVertexLayout()
    this.pipelineParams.targets = this.getColorTargetState()
    this.pipeline = this.device.pipelineCache.get(this.pipelineParams)
    return this.pipeline
  }

  private getPass(): GPURenderPassEncoder {
    if (!this.pass) {
      const descriptor = this.getColorPassDescriptor()
      this.pass = this.getEncoder('draw').beginRenderPass(descriptor)

      this.pass.setPipeline(this.getPipeline())
      this.applyBindGroups()
      this.applyVertexBuffer()
      this.applyIndexBuffer()

      this.applyStencilReference(this.pass)
      this.applyBlendConstants(this.pass)
      this.applyViewportState(this.pass)
      this.applyScissorState(this.pass)
    }
    if (this.pipelineParamsChanged) {
      this.pass.setPipeline(this.getPipeline())
      this.applyBindGroups()
      this.applyVertexBuffer()
    }
    if (this.programParamsChanged) {
      this.applyBindGroups()
    }

    return this.pass
  }

  private endPass() {
    if (!this.pass) {
      return
    }
    this.pass.end()
    this.pass = null
  }

  /**
   * Ends the current render pass and submits the command buffer to the GPU
   */
  public submit() {
    if (!this.encoder) {
      return
    }
    this.endPass()
    const buffer = this.encoder.finish()
    this.encoder = null
    this.device.queue.submit([buffer])
  }

  /**
   * Ends and submits the current render pass, and resets the state
   */
  public flush() {
    this.submit()
    this.reset()
  }

  public reset() {
    this.indexBuffer = null
    this.vertexBuffer = null
    this.setViewportState(null)
    this.setScissorState(null)

    this.blendConstants = null
    this.stencilReference = null
    this.programParams = null

    this.pipelineParamsChanged = true
    this.pipelineParams.cullState = CullState.Disabled
    this.pipelineParams.depthBiasState = DepthBiasState.Default
    this.pipelineParams.depthState = DepthState.Disabled
    this.pipelineParams.stencilState = StencilState.Default
    this.pipelineParams.program = null
    this.pipelineParams.primitiveType = 'TriangleList'
    this.pipelineParams.vertexLayout = null
    this.pipelineParams.targets = null
    this.pipelineParams.multisampleCount = null
    this.pipelineParams.multisampleMask = null
    this.pipelineParams.multisampleAlphaCoverage = false

    this.setBlendConstants(0, 0, 0, 0)
    this.setDepthTarget(null)
    this.setClearDepth(DepthState.DefaultClear)
    this.setClearStencil(StencilState.DefaultClear)
    for (let i = 0; i < this.device.capabilities.maxRenderTargets; i++) {
      this.setClearColor(0, Color.TransparentBlack)
      this.setRenderTarget(i, null)
    }

    this.depthBufferAttachment.view = null
    this.depthClearAttachment.view = null
  }
}
