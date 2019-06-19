// tslint:disable no-bitwise

import { extend, isString, Log } from '@gglib/utils'

import {
  BufferType,
  PrimitiveType,
  PrimitiveTypeName,
  valueOfDataType,
  valueOfPrimitiveType,
} from './enums'

import {
  BlendState,
  BlendStateParams,
  CullState,
  CullStateParams,
  DepthState,
  DepthStateParams,
  OffsetState,
  OffsetStateParams,
  SamplerState,
  ScissorState,
  ScissorStateParams,
  StencilState,
  StencilStateParams,
  VertexAttribArrayState,
  ViewportState,
  ViewportStateParams,
} from './states'

import { DepthBuffer, DepthBufferOptions } from './DepthBuffer'
import { FrameBuffer, FrameBufferOptions } from './FrameBuffer'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'
import { Texture, TextureOptions } from './Texture'
import { VertexLayout } from './VertexLayout'

import { Buffer, BufferOptions } from './Buffer'
import { Capabilities } from './Capabilities'
import { Color, RGBA_FORMAT } from './Color'
import { Model, ModelOptions } from './Model'
import { ShaderProgram, ShaderProgramOptions } from './ShaderProgram'
import { SpriteBatch } from './SpriteBatch'

const supportsWebGL = typeof WebGLRenderingContext === 'function'
const supportsWebGL2 = typeof WebGL2RenderingContext === 'function'

/**
 * Options that will be passed to
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext | HTMLCanvasElement.getContext() }
 *
 * @public
 */
export interface ContextAttributes {
  /**
   * Indicates if the canvas contains an alpha buffer.
   */
  alpha?: boolean,
  /**
   * Indicates that the drawing buffer has a depth buffer of at least 16 bits.
   */
  depth?: boolean,
  /**
   * Indicates that the drawing buffer has a stencil buffer of at least 8 bits.
   */
  stencil?: boolean,
  /**
   * Indicates whether or not to perform anti-aliasing.
   */
  antialias?: boolean,
  /**
   * Indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
   */
  premultipliedAlpha?: boolean,
  /**
   * If true the buffers will not be cleared and will preserve their values until cleared or overwritten by the author.
   */
  preserveDrawingBuffer?: boolean
}

/**
 * Options for the {@link Device.constructor}
 *
 * @public
 */
export interface DeviceOptions {
  /**
   * Canvas element or selector
   */
  canvas?: string|HTMLCanvasElement,
  /**
   * Rendering context or a context type
   */
  context?: 'webgl'|'webgl2'|'experimental-webgl'|WebGLRenderingContext|WebGL2RenderingContext,
  /**
   * Context attributes
   */
  contextAttributes?: ContextAttributes,
}

export const DEFAULT_CONTEXT_ATTRIBUTES = Object.freeze<ContextAttributes>({
  alpha: true,
  antialias: true,
  depth: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: true,
  stencil: true,
})

function getOrCreateCanvas(canvas?: string|HTMLCanvasElement): HTMLCanvasElement {
  if (canvas instanceof HTMLCanvasElement) {
    return canvas
  }
  if (isString(canvas)) {
    const element = document.getElementById(canvas as string)
    if (element instanceof HTMLCanvasElement) {
      return element
    } else {
      throw new Error(`expected '${canvas}' to select a HTMLCanvasElement but got '${element}'`)
    }
  }
  return document.createElement('canvas') as HTMLCanvasElement
}

function getOrCreateContext(canvas: HTMLCanvasElement, options: any): WebGLRenderingContext | WebGL2RenderingContext {
  let context = options.context
  const attributes = extend({}, DEFAULT_CONTEXT_ATTRIBUTES, options.contextAttributes || {})

  if (context && typeof context !== 'string') {
    // assume a valid context is already given
    return context as any
  }

  if (context) {
    // specific context is requested
    try {
      context = canvas.getContext(context, attributes) as any
    } catch (e) {
      context = null
    }
  }

  // apply fallback strategy
  for (const name of ['webgl2', 'webgl', 'experimental-webgl']) {
    try {
      context = context || canvas.getContext(name, attributes)
    } catch (e) {
      Log.i('[Device]', `${name} is not supported`)
    }
  }

  if (!context) {
    throw Error('WebGL is not supported')
  }

  return context
}

/**
 * Describes the Graphics Device
 *
 * @remarks
 * The {@link Device} class ties all concepts of the Graphics package together.
 * It's a central component for rendering geometries. It holds system state variables and
 * is able to create resources such as buffers, shaders, textures and render targets.
 *
 * @public
 */
export class Device {

  /**
   * The html canvas element
   * see {@link https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement | HTMLCanvasElement}
   */
  public canvas: HTMLCanvasElement

  /**
   * The webgl rendering context.
   *
   * @remarks
   * see
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext | WebGLRenderingContext}
   * and
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext | WebGL2RenderingContext}
   */
  public context: WebGLRenderingContext | WebGL2RenderingContext

  /**
   * A collection of capabilites of the currently running graphics unit.
   */
  public capabilities: Capabilities

  /**
   * Collection of {@link SamplerState}.
   *
   * @remarks
   * The size of the collection and thus the number of
   * sampler units is determined by `capabilities.maxTextureUnits`
   */
  public samplerStates: SamplerState[]

  private $indexBuffer: Buffer
  private $vertexBuffer: Buffer
  private $vertexBuffers: Buffer[]
  private $program: ShaderProgram
  private quadIndexBuffer: Buffer
  private quadVertexBuffer: Buffer
  private quadVertexBufferFlipped: Buffer

  private $cullState: CullState
  private $blendState: BlendState
  private $depthState: DepthState
  private $offsetState: OffsetState
  private $stencilState: StencilState
  private $scissorState: ScissorState
  private $viewportState: ViewportState
  private $vertexAttribArrayState: VertexAttribArrayState
  private registeredRenderTargets: Texture[] = []
  private registeredDepthBuffers: DepthBuffer[] = []
  private registeredFrameBuffers: FrameBuffer[] = []

  private currentFrameBuffer: FrameBuffer
  private customFrameBuffer: FrameBuffer
  private customFrameBufferOptions: FrameBufferOptions = { textures: [], depthBuffer: null }

  private defaultTextureInstance: Texture

  /**
   * Constructs a {@link Device}
   *
   * @param options
   */
  constructor(options: DeviceOptions = {}) {

    this.canvas = getOrCreateCanvas(options.canvas)
    this.context = getOrCreateContext(this.canvas, options)
    this.capabilities = new Capabilities(this)

    this.$cullState = new CullState(this).commit(CullState.Default).resolve()
    this.$blendState = new BlendState(this).commit(BlendState.Default).resolve()
    this.$depthState = new DepthState(this).commit(DepthState.Default).resolve()
    this.$offsetState = new OffsetState(this).commit(OffsetState.Default).resolve()
    this.$stencilState = new StencilState(this).commit(StencilState.Default).resolve()
    this.$scissorState = new ScissorState(this).commit(ScissorState.Default).resolve()
    this.$viewportState = new ViewportState(this)
    this.$vertexAttribArrayState = new VertexAttribArrayState(this)

    this.samplerStates = []
    let max = Number(this.capabilities.maxTextureUnits)
    while (this.samplerStates.length < max) {
      this.samplerStates.push(new SamplerState(this, this.samplerStates.length))
    }
  }

  /**
   * Gets a copy of the cull state parameters
   *
   * @remarks
   * On set it updates the cull state parameters and direclty commits the state to the GPU
   */
  public get cullState() {
    return this.$cullState.copy()
  }
  public set cullState(v: CullStateParams) {
    this.$cullState.commit(v)
  }
  /** Gets a copy of the blend state parameters */
  public get blendState() {
    return this.$blendState.copy()
  }
  /** Updates the blend state parameters and direclty commits the state to the GPU */
  public set blendState(v: BlendStateParams) {
    this.$blendState.commit(v)
  }
  /** Gets a copy of the depth state parameters */
  public get depthState() {
    return this.$depthState.copy()
  }
  /** Updates the depth state parameters and direclty commits the state to the GPU */
  public set depthState(v: DepthStateParams) {
    this.$depthState.commit(v)
  }
  /** Gets a copy of the offset state parameters */
  public get offsetState() {
    return this.$offsetState.copy()
  }
  /** Updates the offset state parameters and direclty commits the state to the GPU */
  public set offsetState(v: OffsetStateParams) {
    this.$offsetState.commit(v)
  }
  /** Gets a copy of the stencil state parameters */
  public get stencilState() {
    return this.$stencilState.copy()
  }
  /** Updates the stencil state parameters and direclty commits the state to the GPU */
  public set stencilState(v: StencilStateParams) {
    this.$stencilState.commit(v)
  }
  /** Gets a copy of the scissor state parameters */
  public get scissorState() {
    return this.$scissorState.copy()
  }
  /** Updates the scissor state parameters and direclty commits the state to the GPU */
  public set scissorState(v: ScissorStateParams) {
    this.$scissorState.commit(v)
  }
  /** Gets a copy of the viewport state parameters */
  public get viewportState() {
    return this.$viewportState.copy()
  }
  /** Updates the viewport state parameters and direclty commits the state to the GPU */
  public set viewportState(v: ViewportStateParams) {
    this.$viewportState.commit(v)
  }

  public get defaultTexture(): Texture {
    if (!this.defaultTextureInstance) {
      this.defaultTextureInstance = this.createTexture2D({
        data: [
          0x0F, 0x0F, 0x0F, 0xFF,
          0x00, 0x00, 0x00, 0xFF,
          0x0F, 0x0F, 0x0F, 0xFF,
          0x00, 0x00, 0x00, 0xFF,
        ],
        sampler: SamplerState.PointWrap,
      })
    }
    return this.defaultTextureInstance
  }

  public get isWebGL2(): boolean {
    return supportsWebGL2 && this.context instanceof WebGL2RenderingContext
  }

  /**
   * Clears the color, depth and stencil buffers
   */
  public clear(color?: number|number[]|Color, depth?: number, stencil?: number): Device {
    let gl = this.context
    let mask = 0

    if (color instanceof Color) {
      mask = mask | gl.COLOR_BUFFER_BIT
      gl.clearColor(color.x, color.y, color.z, color.w)
    } else if (typeof color === 'number') {
      mask = mask | gl.COLOR_BUFFER_BIT
      gl.clearColor(RGBA_FORMAT.x(color), RGBA_FORMAT.y(color), RGBA_FORMAT.z(color), RGBA_FORMAT.w(color))
    } else if (color !== undefined) {
      mask = mask | gl.COLOR_BUFFER_BIT
      gl.clearColor(color[0], color[1], color[2], color[3])
    }
    if (depth != null) {
      mask = mask | gl.DEPTH_BUFFER_BIT
      gl.clearDepth(depth)
    }
    if (stencil != null) {
      mask = mask | gl.STENCIL_BUFFER_BIT
      gl.clearStencil(stencil)
    }

    if (mask) {
      gl.clear(mask)
    }
    return this
  }
  /**
   * Clears the color buffer
   */
  public clearColor(color: number|number[]|Color= 0xFFFFFFFF): Device {
    let gl = this.context
    let mask = gl.COLOR_BUFFER_BIT
    if (color instanceof Color) {
      gl.clearColor(color.x, color.y, color.z, color.w)
    } else if (typeof color === 'number') {
      gl.clearColor(RGBA_FORMAT.x(color), RGBA_FORMAT.y(color), RGBA_FORMAT.z(color), RGBA_FORMAT.w(color))
    } else {
      gl.clearColor(color[0], color[1], color[2], color[3])
    }
    gl.clear(mask)
    return this
  }
  /**
   * Clears the color and depth buffers
   */
  public clearColorDepth(color: number|number[]|Color= 0xFFFFFFFF, depth: number = 1): Device {
    let gl = this.context
    let mask = 0

    if (color instanceof Color) {
      mask = mask | gl.COLOR_BUFFER_BIT
      gl.clearColor(color.x, color.y, color.z, color.w)
    } else if (typeof color === 'number') {
      mask = mask | gl.COLOR_BUFFER_BIT

      gl.clearColor(RGBA_FORMAT.x(color), RGBA_FORMAT.y(color), RGBA_FORMAT.z(color), RGBA_FORMAT.w(color))
    } else if (color !== undefined) {
      mask = mask | gl.COLOR_BUFFER_BIT
      gl.clearColor(color[0], color[1], color[2], color[3])
    }
    if (depth != null) {
      mask = mask | gl.DEPTH_BUFFER_BIT
      gl.clearDepth(depth)
    }
    if (mask) {
      gl.clear(mask)
    }
    return this
  }
  /**
   * Clears the depth buffer
   */
  public clearDepth(depth: number = 1): Device {
    let gl = this.context
    gl.clearDepth(depth)
    gl.clear(gl.DEPTH_BUFFER_BIT)
    return this
  }
  /**
   * Clears the stencil buffer
   */
  public clearStencil(stencil: number = 0): Device {
    let gl = this.context
    gl.clearDepth(stencil)
    gl.clear(gl.STENCIL_BUFFER_BIT)
    return this
  }
  /**
   * Clears the depth and stencil buffer
   */
  public clearDepthStencil(depth: number = 1, stencil: number = 0): Device {
    let gl = this.context
    gl.clearDepth(depth)
    gl.clearDepth(stencil)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    return this
  }

  /**
   * Renders geometry using the current index buffer, indexing vertices of current vertex buffer.
   *
   *
   *
   */
  public drawIndexedPrimitives(primitiveType?: PrimitiveType | PrimitiveTypeName, elementOffset?: number, elementCount?: number): Device {
    const iBuffer = this.$indexBuffer
    const vBuffer = this.$vertexBuffer
    const vBuffers = this.$vertexBuffers
    const program = this.$program
    if (!iBuffer) {
      throw new Error(`device.indexBuffer must be set before calling drawIndexedPrimitives()`)
    }
    if (!vBuffer && !vBuffers && !vBuffers.length) {
      throw new Error(`device.vertexBuffer or device.vertexBuffers must be set before calling drawIndexedPrimitives()`)
    }
    if (!program) {
      throw new Error(`device.program must be set before calling drawIndexedPrimitives()`)
    }

    const dataType = iBuffer.dataType
    const type = valueOfPrimitiveType(primitiveType) || PrimitiveType.TriangleList

    elementOffset = (elementOffset || 0) * iBuffer.stride
    elementCount = elementCount || iBuffer.elementCount

    this.bindAttribPointerAndLocation(vBuffer || vBuffers, program)
    this.context.drawElements(type, elementCount, dataType, elementOffset)

    return this
  }

  /**
   * Renders multiple instances of the same geometry defined by current index buffer, indexing vertices in current vertex buffer.
   */
  public drawInstancedPrimitives(
    instanceCount?: number, primitiveType?: PrimitiveType | PrimitiveTypeName, offset?: number, count?: number,
  ): Device {
    const iBuffer = this.$indexBuffer
    const vBuffer = this.$vertexBuffer
    const vBuffers = this.$vertexBuffers
    const program = this.$program
    if (!iBuffer) {
      throw new Error(`device.indexBuffer must be set before calling drawInstancedPrimitives()`)
    }
    if (!vBuffer && !vBuffers && !vBuffers.length) {
      throw new Error(`device.vertexBuffer or device.vertexBuffers must be set before calling drawInstancedPrimitives()`)
    }
    if (!program) {
      throw new Error(`device.program must be set before calling drawInstancedPrimitives()`)
    }

    const dataType = iBuffer.dataType
    const type = valueOfPrimitiveType(primitiveType) || PrimitiveType.TriangleList

    offset = offset || 0
    count = count || iBuffer.elementCount
    instanceCount = instanceCount || 1

    this.bindAttribPointerAndLocation(vBuffer || vBuffers, program);
    (this.context as any).drawElementsInstanced(type, count, dataType, offset * iBuffer.stride, instanceCount)
    return this
  }

  /**
   * Renders geometry defined by current vertex buffer and the given primitive type.
   */
  public drawPrimitives(primitiveType?: PrimitiveType | PrimitiveTypeName, offset?: number, count?: number): Device {
    const vBuffer = this.$vertexBuffer
    const vBuffers = this.$vertexBuffers
    const program = this.$program
    if (!vBuffer && !vBuffers && !vBuffers.length) {
      throw new Error(`device.vertexBuffer or device.vertexBuffers must be set before calling drawPrimitives()`)
    }
    if (!program) {
      throw new Error(`device.program must be set before calling drawPrimitives()`)
    }

    const type = valueOfPrimitiveType(primitiveType) || PrimitiveType.TriangleList
    count = count || (vBuffer || vBuffers[0]).elementCount
    offset = offset || 0

    this.bindAttribPointerAndLocation(vBuffer || vBuffers, program)
    this.context.drawArrays(type, offset, count)
    return this
  }

  /**
   * Draws a full screen quad with the [0,0] texture coordinate starting at the bottom left.
   * @param flipY - if true, then the [0,0] texture coordinate starts in the top left.
   *
   */
  public drawQuad(flipY?: boolean): Device {
    let iBuffer = this.quadIndexBuffer || this.createIndexBuffer({
        data: [0, 3, 1, 0, 2, 3],
        dataType: 'ushort',
      })
    this.quadIndexBuffer = iBuffer

    let vBuffer
    if (flipY) {
      vBuffer = this.quadVertexBufferFlipped || this.createVertexBuffer({
        data: [
          -1,  1, 0, 0, 0,
            1,  1, 0, 1, 0,
          -1, -1, 0, 0, 1,
            1, -1, 0, 1, 1,
        ],
        layout: this.createVertexLayout('PositionTexture'),
        dataType: 'float',
      })
      this.quadVertexBufferFlipped = vBuffer
    } else {
      vBuffer = this.quadVertexBuffer || this.createVertexBuffer({
        data: [
          -1,  1, 0, 0, 1,
            1,  1, 0, 1, 1,
          -1, -1, 0, 0, 0,
            1, -1, 0, 1, 0,
        ],
        layout: this.createVertexLayout('PositionTexture'),
        dataType: 'float',
      })
      this.quadVertexBuffer = vBuffer
    }

    this.indexBuffer = iBuffer
    this.vertexBuffer = vBuffer
    this.drawIndexedPrimitives()
    this.indexBuffer = null
    this.vertexBuffer = null
    return this
  }

  /**
   * If the display size of the canvas is controlled with CSS this will resize the
   * canvas to match the CSS dimensions in order to avoid stretched and blurry image.
   *
   * @param ratio - The pixel ratio for retina displays
   */
  public resize(pixelRatio: number= window.devicePixelRatio || 1): Device {
    if (this.frameBuffer) {
      throw new Error('can not perform a resize while a render target is still active. Unset the rendertarget before calling resize()')
    }
    let displayWidth  = Math.floor(this.canvas.clientWidth  * pixelRatio)
    let displayHeight = Math.floor(this.canvas.clientHeight * pixelRatio)

    // Check if the canvas is not the same size.
    if (this.canvas.width  !== displayWidth ||
        this.canvas.height !== displayHeight) {

      // Make the canvas the same size
      this.canvas.width  = displayWidth
      this.canvas.height = displayHeight

      let state = this.$viewportState
      state.x = 0
      state.y = 0
      state.width = this.context.drawingBufferWidth
      state.height = this.context.drawingBufferHeight
      state.commit()
    }

    return this
  }

  public reset(): Device {
    let ext = this.context.getExtension('WEBGL_lose_context')
    if (ext) {
      ext.loseContext() // trigger a context loss
      ext.restoreContext() // restores the context
    } else {
      Log.l('[reset]', 'reset is not available due to missing extension: WEBGL_lose_context')
      // TODO:
      // this.trigger('reset')
    }
    return this
  }

  public getBackBufferData() {
    throw new Error('not supported')
  }

  public getRenderTargets() {
    throw new Error('not supported')
  }

  /**
   * Sets or unsets a single render target
   */
  public setRenderTarget(texture: Texture) {
    this.setRenderTargets(texture)
  }

  /**
   * Sets or unsets multiple render targets
   */
  public setRenderTargets(
    rt01?: Texture, rt02?: Texture, rt03?: Texture, rt04?: Texture,
    rt05?: Texture, rt06?: Texture, rt07?: Texture, rt08?: Texture,
    rt09?: Texture, rt10?: Texture, rt11?: Texture, rt12?: Texture,
    rt13?: Texture, rt14?: Texture, rt15?: Texture, rt16?: Texture,
  ): Device {
    let opts = this.customFrameBufferOptions
    opts.textures.length = arguments.length
    let firstTexture: Texture = null
    for (let i = 0; i < arguments.length; i++) {
      let argument = arguments[i]
      opts.textures[i] = argument
      if (argument instanceof Texture) {
        firstTexture = firstTexture || argument
      }
    }

    // render targets are set to null
    // unset the framebuffer
    if (!firstTexture) {
      this.frameBuffer = null
      this.viewportState = {
        x: 0,
        y: 0,
        width: this.context.drawingBufferWidth,
        height: this.context.drawingBufferHeight,
      }
      return this
    }

    // There is at least one render target set.
    // The first defines the depth buffer and the size of the frame buffer.

    if (firstTexture.depthFormat) {
      opts.depthBuffer = this.getSharedDepthBuffer(firstTexture)
    } else {
      opts.depthBuffer = null
    }

    // Reuse cached framebuffer
    if (this.customFrameBuffer) {
      this.customFrameBuffer.setup(opts)
    } else {
      this.customFrameBuffer = new FrameBuffer(this, opts)
    }
    this.frameBuffer = this.customFrameBuffer
    this.viewportState = {
      x: 0,
      y: 0,
      width: firstTexture.width,
      height: firstTexture.height,
    }
    return this
  }

  /**
   * Gets the currently active frame buffer
   */
  get frameBuffer(): FrameBuffer {
    return this.currentFrameBuffer
  }
  /**
   * Sets and activates a frame buffer as the currently active frane buffer
   */
  set frameBuffer(buffer: FrameBuffer) {
    if (this.currentFrameBuffer !== buffer) {
      let handle = buffer ? buffer.handle : null
      this.context.bindFramebuffer(this.context.FRAMEBUFFER, handle)
      this.currentFrameBuffer = buffer
    }
  }

  /**
   * Sets multiple vertex buffers
   *
   * @remarks
   * Restricts the `vertexBuffer` property to only this set of buffers.
   */
  set vertexBuffers(buffer: Buffer[]) {
    this.$vertexBuffers = buffer
    this.vertexBuffer = null
  }

  /**
   * Gets the currently active vertex buffer
   */
  get vertexBuffer(): Buffer {
    return this.$vertexBuffer
  }
  /**
   * Sets and activates a buffer as the currently active vertex buffer
   */
  set vertexBuffer(buffer: Buffer) {
    if (this.$vertexBuffer !== buffer) {
      if (buffer && this.$vertexBuffers && this.$vertexBuffers.indexOf(buffer) === -1) {
        throw new Error('vertexBuffer is not part of the vertexBuffers list')
      }
      this.context.bindBuffer(BufferType.VertexBuffer, buffer ? buffer.handle : null)
      this.$vertexBuffer = buffer
    }
  }

  /**
   * Gets the currently active index buffer
   */
  get indexBuffer(): Buffer {
    return this.$indexBuffer
  }
  /**
   * Sets and activates a buffer as the currently active index buffer
   */
  set indexBuffer(buffer: Buffer) {
    if (this.$indexBuffer !== buffer) {
      this.context.bindBuffer(BufferType.IndexBuffer, buffer ? buffer.handle : null)
      this.$indexBuffer = buffer
    }
  }

  /**
   * Gets the currently active shader program
   */
  get program(): ShaderProgram {
    return this.$program
  }
  /**
   * Sets and activates a program as the currently active program
   */
  set program(program: ShaderProgram) {
    if (this.$program !== program) {
      let handle = program ? program.handle : null
      this.context.useProgram(handle)
      this.$program = program
    }
  }

  /**
   * Gets the aspect ratio of the drawing buffer
   */
  get drawingBufferAspectRatio(): number {
    return this.context.drawingBufferWidth / this.context.drawingBufferHeight
  }

  private bindAttribPointerAndLocation(vBuffer: Buffer | Buffer[], program: ShaderProgram) {
    if (Array.isArray(vBuffer)) {
      program.attributes.forEach((attribute, name) => {
        for (const buffer of vBuffer) {
          const channel = buffer.layout[name]
          if (channel) {
            buffer.use()
            this.context.vertexAttribPointer(
              attribute.location,
              channel.elements,
              valueOfDataType(channel.type),
              !!attribute.normalize || !!channel.normalize,
              buffer.stride,
              channel.offset,
            )
            this.context.enableVertexAttribArray(attribute.location)
            return
          }
        }
        // tslint:disable-next-line
        throw new Error(`VertexBuffer is not compatible with Program. Required attributes are '${Array.from(program.attributes.keys())}' but '${name}' is missing in vertex buffer.`)
      })
    } else {
      program.attributes.forEach((attribute, name) => {
        const channel = vBuffer.layout[name]
        if (channel) {
          vBuffer.use()
          this.context.vertexAttribPointer(
            attribute.location,
            channel.elements,
            valueOfDataType(channel.type),
            !!attribute.normalize || !!channel.normalize,
            vBuffer.stride,
            channel.offset,
          )
          this.context.enableVertexAttribArray(attribute.location)
          return
        }

        // tslint:disable-next-line
        throw new Error(`VertexBuffer is not compatible with Program. Required attributes are '${Array.from(program.attributes.keys())}' but '${name}' is missing in vertex buffer.`)
      })
    }
    // enable attributes so that the vertex shader is actually able to use them
    // this.$vertexAttribArrayState.commit(program.attributeLocations)
  }

  /**
   * used internally when a render target is created
   *
   * @internal
   */
  public registerRenderTarget(texture: Texture) {
    let list = this.registeredRenderTargets
    let index = list.indexOf(texture)
    if (index >= 0) { return }
    for (let i in list) {
      if (list[i] == null) {
        list[i] = texture
        return
      }
    }
    list.push(texture)
  }

  /**
   * used internally when a render target is destroyed
   *
   * @internal
   */
  public unregisterRenderTarget(texture: Texture) {
    let list = this.registeredRenderTargets
    let index = list.indexOf(texture)
    if (index < 0) { return }
    list[index] = null
    if (list.length === (index + 1)) {
      list.length = index
    }
  }

  /**
   * used internally when a depth buffer is created
   *
   * @internal
   */
  public registerDepthBuffer(buffer: DepthBuffer) {
    let list = this.registeredDepthBuffers
    let index = list.indexOf(buffer)
    if (index >= 0) { return }
    for (let i in list) {
      if (list[i] == null) {
        list[i] = buffer
        return
      }
    }
    list.push(buffer)
  }

  /**
   * used internally when a depth buffer is destroyed
   *
   * @internal
   */
  public unregisterDepthBuffer(buffer: DepthBuffer) {
    let list = this.registeredDepthBuffers
    let index = list.indexOf(buffer)
    if (index < 0) { return }
    list[index] = null
    if (list.length === (index + 1)) {
      list.length = index
    }
  }

  /**
   * Creates a new Buffer of type IndexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public createIndexBuffer(options: BufferOptions): Buffer {
    options.type = 'IndexBuffer'
    options.dataType = options.dataType || 'ushort'
    return new Buffer(this, options)
  }

  /**
   * Creates a new Buffer of type VertexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public createVertexBuffer(options: BufferOptions): Buffer {
    options.type = 'VertexBuffer'
    return new Buffer(this, options)
  }

  /**
   * Creates a new ShaderProgram. Calls the ShaderProgram constructor with given options.
   */
  public createProgram(options: ShaderProgramOptions): ShaderProgram {
    let vSource = options.vertexShader
    let fSource = options.fragmentShader

    if (typeof vSource === 'string' && typeof fSource === 'string') {
      if (vSource.startsWith('#') && vSource.indexOf('\n') < 0) {
        vSource = document.getElementById(vSource.substr(1)).textContent
        options.vertexShader = vSource
      }
      if (fSource.startsWith('#') && fSource.indexOf('\n') < 0) {
        fSource = document.getElementById(fSource.substr(1)).textContent
        options.fragmentShader = fSource
      }
    }

    return new ShaderProgram(this, options)
  }

  /**
   * Creates a new Texture. Calls the Texture constructor with given options.
   */
  public createTexture(options: TextureOptions): Texture {
    return new Texture(this, options)
  }

  /**
   * Creates a new Texture that can be used as a render target. Ensures that
   * the depthFormat option is set and calls the Texture constructor.
   */
  public createRenderTarget(options: TextureOptions): Texture {
    options.depthFormat = (options.depthFormat || 'None')
    return new Texture(this, options)
  }

  /**
   * Creates a new Texture of type Texture2D. Overrides the type option
   * before it calls the Texture constructor with given options.
   */
  public createTexture2D(options: TextureOptions = {}): Texture {
    options.type = 'Texture2D'
    return new Texture(this, options)
  }

  /**
   * Creates a new Texture of type TextureCube. Overrides the type option
   * before it calls the Texture constructor with given options.
   */
  public createTextureCube(options: TextureOptions = {}): Texture {
    options.type = 'TextureCube'
    return new Texture(this, options)
  }

  /**
   * Creates a new sprite batch.
   */
  public createSpriteBatch(): SpriteBatch {
    return new SpriteBatch(this)
  }

  /**
   * Creates a vertex layout obect from name
   */
  public createVertexLayout(name: string): any {
    return VertexLayout.create.apply(this, arguments)
  }

  /**
   * Creates a new model. Calls the model constructor with given options.
   */
  public createModel(options: ModelOptions): Model {
    return new Model(this, options)
  }

  public createEffect(options: ShaderEffectOptions): ShaderEffect {
    return new ShaderEffect(this, options)
  }

  public getSharedDepthBuffer(options: DepthBufferOptions) {
    // no depthFormat no buffer
    if (!options.depthFormat) {
      return null
    }
    // search by matching width, height and depthFormat
    for (let item of this.registeredDepthBuffers) {
      if (item.width === options.width && item.height === options.height && item.depthFormat === options.depthFormat) {
        return item
      }
    }
    // create and register a new depth buffer
    let buffer = new DepthBuffer(this, {
      width: options.width,
      height: options.height,
      depthFormat: options.depthFormat,
    })
    this.registerDepthBuffer(buffer)
    return buffer
  }

  public unsetSamplersUsedAsAttachments() {
    if (this.frameBuffer) {
      this.frameBuffer.unsetSamplersUsedAsAttachments()
    }
  }
}
