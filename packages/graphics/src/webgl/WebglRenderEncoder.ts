import {
  blendFunctionToWebGL,
  blendToWebGL,
  compareFunctionToWebGL,
  cullModeToWebGL,
  frontFaceToWebGL,
  primitiveTypeToWebGL,
  stencilOperationToWebGL,
  type PrimitiveType,
} from '../enums'
import { RenderEncoder } from '../RenderEncoder'
import type { Buffer, DeviceOutput, Program, Texture, VertexBuffer } from '../resources'
import {
  BlendState,
  CullState,
  DepthBiasState,
  DepthState,
  StencilState,
  type ScissorState,
  type ViewportState,
} from '../states'
import {
  WebglFrameBuffer,
  WebglTexture,
  type WebglBuffer,
  type WebglProgram,
  type WebglShaderModule,
  type WebglVertexArray,
  type WebglVertexBuffer,
} from './resources'
import type { WebglDevice } from './WebglDevice'

export class WebglRenderEncoder extends RenderEncoder {
  public readonly device: WebglDevice
  private readonly gl: WebGL2RenderingContext

  private scissorStateChanged: boolean = true
  private scissorState: ScissorState & { enabled: boolean } = {
    enabled: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }

  private viewportStateChanged: boolean = true
  private viewportState: ViewportState = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    zMin: 0,
    zMax: 1,
  }

  private cullState: CullState = null
  private cullStatePending: CullState = CullState.Disabled
  private cullStateChanged: boolean = true

  private depthState: DepthState = null
  private depthStatePending: DepthState = DepthState.Disabled
  private depthStateChanged: boolean = true

  private depthBiasState: DepthBiasState = null
  private depthBiasStatePending: DepthBiasState = DepthBiasState.Default
  private depthBiasStateChanged: boolean = true

  private stencilState: StencilState = null
  private stencilStatePending: StencilState = StencilState.Default
  private stencilStateChanged: boolean = true

  private stencilReference: number = null
  private stencilReferencePending: number = 0
  private stencilReferenceChanged: boolean = true

  private blendConstants: [number, number, number, number] = null
  private blendConstantsChanged: boolean = true

  private primitiveType: PrimitiveType | null = null

  private vertexBuffer: WebglVertexBuffer | null = null
  private vertexBufferPending: WebglVertexBuffer | null = null
  private vertexBufferChanged: boolean = true

  private indexBuffer: WebglBuffer | null = null
  private indexBufferOffset: number = 0
  private indexBufferSize: number = 0
  private indexBufferPending: WebglBuffer | null = null
  private indexBufferOffsetPending: number = 0
  private indexBufferSizePending: number = 0
  private indexBufferChanged: boolean = true

  private shader: WebglShaderModule = null
  private shaderPending: WebglShaderModule = null
  private shaderChanged: boolean = true

  private program: WebglProgram = null
  private programPending: WebglProgram = null
  private programChanged: boolean = true

  private activeFrameBuffer: WebglFrameBuffer = null
  private frameBuffer: WebglFrameBuffer
  private resolveBuffer: WebglFrameBuffer
  private resolveModes: boolean[] = []
  private defaultClearColor: [number, number, number, number] = [0, 0, 0, 1]
  private clearColor: [number, number, number, number] = [0, 0, 0, 1]
  private clearDepth: number = 1
  private clearStencil: number = 0

  public constructor(device: WebglDevice) {
    super()
    this.device = device
    this.gl = device.context
    this.frameBuffer = new WebglFrameBuffer(device)
    this.resolveBuffer = new WebglFrameBuffer(device)
    this.reset()
  }

  public getCullState(): CullState {
    return this.cullState
  }
  public getDepthState(): DepthState {
    return this.depthState
  }
  public getDepthBiasState(): DepthBiasState {
    return this.depthBiasState
  }
  public getRenderBlend(index: number): BlendState {
    return this.renderBlendParam(index)?.state
  }

  public setProgram(bindings: Program): void {
    this.shaderPending = bindings?.module as WebglShaderModule
    this.shaderChanged = this.shader !== this.shaderPending

    this.programPending = bindings as WebglProgram
    this.programChanged = this.program !== this.programPending
  }
  public setCullState(state: CullState): void {
    this.cullStatePending = state
    this.cullStateChanged = this.cullStatePending !== this.cullState
  }
  public setDepthState(state: DepthState): void {
    this.depthStatePending = state
    this.depthStateChanged = this.depthStatePending !== this.depthState
  }
  public setDepthBiasState(state: DepthBiasState): void {
    this.depthBiasStatePending = state
    this.depthBiasStateChanged = this.depthBiasStatePending !== this.depthBiasState
  }
  public setStencilState(state: StencilState): void {
    this.stencilStatePending = state
    this.stencilStateChanged = this.stencilStatePending !== this.stencilState
  }
  public setPrimitiveType(type: PrimitiveType): void {
    this.primitiveType = type
  }
  public setIndexBuffer(buffer: Buffer, offset?: number, size?: number): void {
    this.indexBufferPending = buffer as WebglBuffer
    this.indexBufferOffsetPending = offset ?? 0
    this.indexBufferSizePending = size ?? (buffer ? buffer.size : 0)
    this.indexBufferChanged =
      this.indexBufferPending !== this.indexBuffer ||
      this.indexBufferOffsetPending !== this.indexBufferOffset ||
      this.indexBufferSizePending !== this.indexBufferSize
  }
  public setVertexBuffer(buffer: VertexBuffer): void {
    this.vertexBufferPending = buffer as WebglVertexBuffer
    this.vertexBufferChanged = this.vertexBufferPending !== this.vertexBuffer
  }

  private renderBlend: RenderBlend[] = []
  private renderBlendChanged: boolean = true
  private renderBlendParam(index: number) {
    if (!this.renderBlend[index]) {
      this.renderBlend[index] = {
        state: BlendState.Disabled,
        changed: true,
      }
    }
    return this.renderBlend[index]
  }

  private renderMask: RenderMask[] = []
  private renderMaskChanged: boolean = true
  private renderMaskParam(index: number) {
    if (!this.renderMask[index]) {
      this.renderMask[index] = {
        value: 1 | 2 | 4 | 8,
        changed: true,
      }
    }
    return this.renderMask[index]
  }

  public setRenderBlend(index: number, blendState: BlendState): void {
    const param = this.renderBlendParam(index)
    blendState ||= BlendState.Disabled
    param.changed ||= param.state !== blendState
    param.state = blendState
    this.renderBlendChanged ||= param.changed
  }

  public setRenderMask(index: number, writeMask: number): void {
    const param = this.renderMaskParam(index)
    writeMask ??= 1 | 2 | 4 | 8
    param.changed ||= param.value !== writeMask
    param.value = writeMask
    this.renderMaskChanged ||= param.changed
  }

  public setRenderTarget(
    index: number,
    texture: Texture | DeviceOutput,
    mipLevel?: number,
    arrayLayer?: number,
    resolve?: Texture | DeviceOutput,
  ): void {
    if (texture instanceof WebglTexture) {
      this.frameBuffer.setRenderTarget(index, texture as WebglTexture, mipLevel, arrayLayer)
    } else if (texture && index > 0) {
      throw new Error('Only first render target can be set to DeviceOutput')
    } else {
      this.frameBuffer.setRenderTarget(index, null, mipLevel, arrayLayer)
    }

    if (!resolve) {
      this.resolveBuffer.setRenderTarget(index, null, 0, 0)
      this.resolveModes[index] = false
    } else if (resolve instanceof WebglTexture) {
      this.resolveBuffer.setRenderTarget(index, resolve, 0, 0)
      this.resolveModes[index] = true
    } else {
      this.resolveBuffer.setRenderTarget(index, null, 0, 0)
      this.resolveModes[index] = true
    }
  }

  public setDepthTarget(buffer: Texture): void {
    this.frameBuffer.setDepthTarget(buffer as WebglTexture)
  }

  public setClearColor(index: number, color: GPUColor): void {
    color ||= this.defaultClearColor
    this.frameBuffer.setClearColor(index, color)
    if (index !== 0) {
      return
    }
    if (Array.isArray(color)) {
      this.clearColor[0] = color[0]
      this.clearColor[1] = color[1]
      this.clearColor[2] = color[2]
      this.clearColor[3] = color[3]
    } else if ('r' in color) {
      this.clearColor[0] = color.r
      this.clearColor[1] = color.g
      this.clearColor[2] = color.b
      this.clearColor[3] = color.a
    }
  }

  public setClearDepth(depth: number): void {
    this.frameBuffer.setClearDepth(depth)
    this.clearDepth = depth
  }
  public setClearStencil(stencil: number): void {
    this.frameBuffer.setClearStencil(stencil)
    this.clearStencil = stencil
  }
  public setBlendConstants(r: number, g: number, b: number, a: number): void {
    this.blendConstantsChanged ||=
      !this.blendConstants ||
      this.blendConstants[0] !== r ||
      this.blendConstants[1] !== g ||
      this.blendConstants[2] !== b ||
      this.blendConstants[3] !== a

    this.blendConstants ||= [r, g, b, a]
    this.blendConstants[0] = r
    this.blendConstants[1] = g
    this.blendConstants[2] = b
    this.blendConstants[3] = a
  }

  public setStencilReference(value: number): void {
    this.stencilReferencePending = value
    this.stencilReferenceChanged = this.stencilReferencePending !== this.stencilReference
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
    this.viewportStateChanged ||=
      this.viewportState.x !== xOrState ||
      this.viewportState.y !== y ||
      this.viewportState.width !== width ||
      this.viewportState.height !== height ||
      this.viewportState.zMin !== (zMin ?? 0) ||
      this.viewportState.zMax !== (zMax ?? 1)

    this.viewportState.x = xOrState
    this.viewportState.y = y
    this.viewportState.width = width
    this.viewportState.height = height
    this.viewportState.zMin = zMin ?? 0
    this.viewportState.zMax = zMax ?? 1
  }

  public setScissorState(x: number, y: number, width: number, height: number): void
  public setScissorState(state: ScissorState | null): void
  public setScissorState(xOrState: ScissorState | number, y?: number, width?: number, height?: number): void {
    if (xOrState == null) {
      this.scissorStateChanged ||= this.scissorState.enabled
      this.scissorState.enabled = false
      return
    }
    if (typeof xOrState != 'number') {
      this.setScissorState(xOrState.x, xOrState.y, xOrState.width, xOrState.height)
      return
    }
    this.scissorStateChanged ||=
      !this.scissorState.enabled ||
      this.scissorState.x !== xOrState ||
      this.scissorState.y !== y ||
      this.scissorState.width !== width ||
      this.scissorState.height !== height
    this.scissorState.enabled = true
    this.scissorState.x = xOrState
    this.scissorState.y = y
    this.scissorState.width = width
    this.scissorState.height = height
  }

  public draw(vertexCount: number, instanceCount?: number, vertexOffset?: number, instanceOffset?: number) {
    this.commitChanges()

    if (instanceOffset > 0) {
      throw new Error('instanceOffset is not supported in WebGL')
    }

    const gl = this.gl
    if (instanceCount > 1) {
      gl.drawArraysInstanced(primitiveTypeToWebGL(this.primitiveType), vertexOffset ?? 0, vertexCount, instanceCount)
    } else {
      gl.drawArrays(primitiveTypeToWebGL(this.primitiveType), vertexOffset ?? 0, vertexCount)
    }
  }

  public drawIndexed(
    indexCount: number,
    instanceCount?: number,
    indexOffset?: number,
    baseVertex?: number,
    instanceOffset?: number,
  ): void {
    this.commitChanges()

    if (!this.indexBuffer) {
      throw new Error('No index buffer set for indexed draw call')
    }
    if (baseVertex) {
      throw new Error('baseVertex is not supported in WebGL')
    }
    if (instanceOffset > 0) {
      throw new Error('instanceOffset is not supported in WebGL')
    }

    const gl = this.gl
    if (instanceCount > 1) {
      gl.drawElementsInstanced(
        primitiveTypeToWebGL(this.primitiveType),
        indexCount,
        this.indexBuffer.indexType === 'uint16' ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
        (indexOffset ?? 0) + this.indexBufferOffset,
        instanceCount,
      )
    } else {
      gl.drawElements(
        primitiveTypeToWebGL(this.primitiveType),
        indexCount,
        this.indexBuffer.indexType === 'uint16' ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
        (indexOffset ?? 0) + this.indexBufferOffset,
      )
    }
  }

  public clear(enableScissor?: boolean): void {
    const oldScissor = this.scissorState
    if (!enableScissor) {
      this.setScissorState(null)
    }

    this.commitChanges()
    this.activateFrameBuffer()
    if (this.activeFrameBuffer) {
      this.activeFrameBuffer.clear()
    } else {
      const gl = this.gl
      const color = this.clearColor
      gl.clearColor(color[0], color[1], color[2], color[3])
      gl.clearDepth(this.clearDepth)
      gl.clearStencil(this.clearStencil)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    }

    if (!enableScissor && oldScissor?.enabled) {
      this.setScissorState(oldScissor)
    }
  }

  public resolve(): void {
    this.commitChanges()
    this.frameBuffer.commit()
    this.resolveBuffer.commit()
    this.switchToFrameBuffer(null)

    const gl = this.gl
    for (let i = 0; i < this.resolveModes.length; i++) {
      if (!this.resolveModes[i]) {
        continue
      }

      const src = this.frameBuffer.getAttachment(i)
      const dst = this.resolveBuffer.getAttachment(i)

      if (src.texture) {
        this.device.framebuffer.activateRead(this.frameBuffer.glHandle)
        gl.readBuffer(gl.COLOR_ATTACHMENT0 + i)
      } else {
        this.device.framebuffer.activateRead(null)
      }

      if (dst.texture) {
        this.device.framebuffer.activateDraw(this.resolveBuffer.glHandle)
        gl.drawBuffers([gl.COLOR_ATTACHMENT0 + i])
      } else {
        this.device.framebuffer.activateDraw(null)
      }

      const srcTexture = src?.texture ?? this.device.output
      const dstTexture = dst?.texture ?? this.device.output

      gl.blitFramebuffer(
        0,
        0,
        srcTexture.width,
        srcTexture.height,
        0,
        0,
        dstTexture.width,
        dstTexture.height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST,
      )
    }

    // reset read/write framebuffer to default
    this.switchToFrameBuffer(null)
  }

  public submit(): void {
    // No-op in WebGL as draw calls are executed immediately
  }

  public flush(): void {
    this.submit()
    this.reset()
  }

  private reset() {
    this.setIndexBuffer(null)
    this.setVertexBuffer(null)
    this.setViewportState(null)
    this.setScissorState(null)
    this.setProgram(null)

    this.setCullState(CullState.Disabled)
    this.setDepthState(DepthState.Disabled)
    this.setDepthBiasState(DepthBiasState.Default)
    this.setStencilState(StencilState.Default)
    this.setPrimitiveType('TriangleList')

    this.setClearDepth(DepthState.DefaultClear)
    this.setClearStencil(StencilState.DefaultClear)
    this.setBlendConstants(0, 0, 0, 0)
    this.setDepthTarget(null)
    for (let i = 0; i < this.frameBuffer.maxRenderTargets; i++) {
      this.setClearColor(i, this.defaultClearColor)
      this.setRenderTarget(i, null, 0, 0, null)
      this.setRenderBlend(i, BlendState.Disabled)
      this.setRenderMask(i, 1 | 2 | 4 | 8)
    }
  }

  private commitChanges() {
    if (this.cullStateChanged) {
      applyCullState(this.gl, this.cullStatePending)
      this.cullState = this.cullStatePending
      this.cullStateChanged = false
    }
    if (this.depthStateChanged) {
      applyDepthState(this.gl, this.depthStatePending)
      this.depthState = this.depthStatePending
      this.depthStateChanged = false
    }
    if (this.depthBiasStateChanged) {
      applyDepthBiasState(this.gl, this.depthBiasStatePending)
      this.depthBiasState = this.depthBiasStatePending
      this.depthBiasStateChanged = false
    }
    if (this.stencilStateChanged || this.stencilReferenceChanged) {
      applyStencilState(this.gl, this.stencilStatePending, this.stencilReferencePending)

      this.stencilState = this.stencilStatePending
      this.stencilStateChanged = false

      this.stencilReference = this.stencilReferencePending
      this.stencilReferenceChanged = false
    }
    if (this.scissorStateChanged) {
      applyScissorState(this.gl, this.scissorState)
      this.scissorStateChanged = false
    }
    if (this.viewportStateChanged) {
      // TODO: invert y coordinate
      applyViewportState(this.gl, this.viewportState)
      this.viewportStateChanged = false
    }
    if (this.blendConstantsChanged) {
      this.gl.blendColor(this.blendConstants[0], this.blendConstants[1], this.blendConstants[2], this.blendConstants[3])
      this.blendConstantsChanged = false
    }

    if (this.renderBlendChanged) {
      const ext = this.device.capabilities.extension('OES_draw_buffers_indexed')
      for (let i = 0; i < this.renderBlend.length; i++) {
        const param = this.renderBlend[i]
        if (!param?.changed) {
          continue
        }
        applyRenderTargetBlend(this.gl, ext, i, param.state)
        param.changed = false
        if (i === 0) {
          applyRenderBlend(this.gl, param.state)
        }
      }
      this.renderBlendChanged = false
    }
    if (this.renderMaskChanged) {
      const ext = this.device.capabilities.extension('OES_draw_buffers_indexed')
      for (let i = 0; i < this.renderMask.length; i++) {
        const param = this.renderMask[i]
        if (!param?.changed) {
          continue
        }
        applyRenderTargetMask(this.gl, ext, i, param.value)
        param.changed = false
        if (i === 0) {
          applyRenderMask(this.gl, param.value)
        }
      }
      this.renderMaskChanged = false
    }

    this.activateProgramParams()
    this.activateProgram()
    this.activateFrameBuffer()
  }

  private vao: WebglVertexArray = null
  private activateProgram() {
    if (!this.shaderChanged && !this.vertexBufferChanged && !this.indexBufferChanged) {
      return
    }
    this.shader = this.shaderPending
    this.vertexBuffer = this.vertexBufferPending
    this.indexBuffer = this.indexBufferPending
    this.shaderChanged = false
    this.vertexBufferChanged = false
    this.indexBufferChanged = false

    if (this.shader && this.vertexBuffer) {
      this.vao = this.device.vaoCache.get(this.shader, this.vertexBuffer, this.indexBuffer)
      this.device.activateProgram(this.shader.glHandle)
      this.device.context.bindVertexArray(this.vao.glHandle)
      return
    }
    if (this.shader && !this.shader.isReady) {
      throw new Error('Shader program is not ready')
    }

    this.device.activateProgram(this.shader?.glHandle || null)
    this.device.context.bindVertexArray(null)
    this.vao = null
  }

  private activateProgramParams() {
    if (!this.programChanged) {
      this.program?.activate()
      return
    }
    this.program = this.programPending
    this.programChanged = false
    if (this.program) {
      this.program.commit()
      this.program.activate()
    }
  }

  private activateFrameBuffer() {
    if (this.checkFrameBufferRequirement()) {
      this.switchToFrameBuffer(this.frameBuffer)
    } else {
      this.switchToFrameBuffer(null)
    }
  }

  private switchToFrameBuffer(frameBuffer: WebglFrameBuffer) {
    this.activeFrameBuffer = frameBuffer
    if (frameBuffer) {
      //console.log('Switching to framebuffer:')
      frameBuffer.activate()
    } else {
      //console.log('Switching to default framebuffer')
      this.device.framebuffer.activate(null)
    }
  }

  private checkFrameBufferRequirement(): boolean {
    if (!this.shader) {
      // no program is set, assume user wants to issue the clear operation
      // framebuffer is required if there are any attachments
      return this.frameBuffer.hasAttachments()
    }

    const outputs = this.shader.reflection?.outputs
    if (!outputs) {
      throw new Error('Shader is missing reflection data for fragment output')
    }
    if (!outputs.length) {
      throw new Error('Shader has no output color defined')
    }

    if (outputs.length === 1) {
      // single output, framebuffer is required if the output is bound to a render target
      return !!this.frameBuffer.getAttachment(outputs[0].location)?.texture
    }

    // multiple outputs, framebuffer is required and all outputs must be bound to render targets
    for (const output of outputs) {
      const attachment = this.frameBuffer.getAttachment(output.location)
      if (!attachment.texture) {
        throw new Error(`No render target set for output: ${output.location} (${output.name})`)
      }
    }
    return true
  }
}

function applyCullState(gl: WebGL2RenderingContext, state: CullState) {
  if (!state?.enable) {
    gl.disable(gl.CULL_FACE)
    return
  }
  gl.enable(gl.CULL_FACE)
  gl.cullFace(cullModeToWebGL(state.cullMode))
  gl.frontFace(frontFaceToWebGL(state.frontFace))
}

function applyDepthState(gl: WebGL2RenderingContext, state: DepthState) {
  if (!state?.enabled) {
    gl.disable(gl.DEPTH_TEST)
    return
  }
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(compareFunctionToWebGL(state.depthFunction))
  gl.depthMask(state.depthWriteEnabled)
}

function applyDepthBiasState(gl: WebGL2RenderingContext, state: DepthBiasState) {
  if (!state?.enable) {
    gl.disable(gl.POLYGON_OFFSET_FILL)
    return
  }
  gl.enable(gl.POLYGON_OFFSET_FILL)
  gl.polygonOffset(state.slopeScale, state.bias)
}

function applyStencilState(gl: WebGL2RenderingContext, state: StencilState, reference: number) {
  if (!state.enable) {
    gl.disable(gl.STENCIL_TEST)
    return
  }
  gl.enable(gl.STENCIL_TEST)

  gl.stencilMaskSeparate(gl.FRONT, state.writeMask)
  gl.stencilFuncSeparate(gl.FRONT, compareFunctionToWebGL(state.frontFunction), reference, state.readMask)
  gl.stencilOpSeparate(
    gl.FRONT,
    stencilOperationToWebGL(state.frontFail),
    stencilOperationToWebGL(state.frontDepthFail),
    stencilOperationToWebGL(state.frontDepthPass),
  )

  gl.stencilMaskSeparate(gl.BACK, state.writeMask)
  gl.stencilFuncSeparate(gl.BACK, compareFunctionToWebGL(state.backFunction), reference, state.readMask)
  gl.stencilOpSeparate(
    gl.BACK,
    stencilOperationToWebGL(state.backFail),
    stencilOperationToWebGL(state.backDepthFail),
    stencilOperationToWebGL(state.backDepthPass),
  )
}

function applyViewportState(gl: WebGL2RenderingContext, state: ViewportState) {
  gl.viewport(state.x, state.y, state.width, state.height)
  gl.depthRange(state.zMin, state.zMax)
}

function applyScissorState(gl: WebGL2RenderingContext, state: ScissorState & { enabled: boolean }) {
  if (!state?.enabled) {
    gl.disable(gl.SCISSOR_TEST)
    return
  }
  gl.enable(gl.SCISSOR_TEST)
  gl.scissor(state.x, state.y, state.width, state.height)
}

interface RenderBlend {
  state: BlendState
  changed: boolean
}

interface RenderMask {
  value: number
  changed: boolean
}

function applyRenderTargetBlend(
  gl: WebGL2RenderingContext,
  ext: OES_draw_buffers_indexed,
  index: number,
  state: BlendState,
) {
  if (!state.enable) {
    ext.disableiOES(gl.BLEND, index)
    return
  }
  ext.enableiOES(gl.BLEND, index)
  ext.blendEquationSeparateiOES(
    index,
    blendFunctionToWebGL(state.colorBlendFunction),
    blendFunctionToWebGL(state.alphaBlendFunction),
  )
  ext.blendFuncSeparateiOES(
    index,
    blendToWebGL(state.colorSrcBlend),
    blendToWebGL(state.colorDstBlend),
    blendToWebGL(state.alphaSrcBlend),
    blendToWebGL(state.alphaDstBlend),
  )
}

function applyRenderTargetMask(_: WebGL2RenderingContext, ext: OES_draw_buffers_indexed, index: number, mask: number) {
  // prettier-ignore
  ext.colorMaskiOES(
    index,
    !!(mask & 1),
    !!(mask & 2),
    !!(mask & 4),
    !!(mask & 8),
  )
}

function applyRenderBlend(gl: WebGL2RenderingContext, state: BlendState) {
  if (!state.enable) {
    gl.disable(gl.BLEND)
    return
  }
  gl.enable(gl.BLEND)
  gl.blendEquationSeparate(
    blendFunctionToWebGL(state.colorBlendFunction),
    blendFunctionToWebGL(state.alphaBlendFunction),
  )
  gl.blendFuncSeparate(
    blendToWebGL(state.colorSrcBlend),
    blendToWebGL(state.colorDstBlend),
    blendToWebGL(state.alphaSrcBlend),
    blendToWebGL(state.alphaDstBlend),
  )
}

function applyRenderMask(gl: WebGL2RenderingContext, mask: number) {
  // prettier-ignore
  gl.colorMask(
      !!(mask & 1),
      !!(mask & 2),
      !!(mask & 4),
      !!(mask & 8),
    )
}
