

import { Log, getOrCreateCanvas } from '@gglib/utils'

import { BufferType, PrimitiveType, PrimitiveTypeName, valueOfPrimitiveType } from '../enums'
import {
  Buffer,
  BufferOptions,
  DepthBuffer,
  DepthBufferOptions,
  FrameBufferOptions,
  ShaderOptions,
  ShaderProgram,
  ShaderProgramOptions,
  Texture,
  TextureOptions,
} from '../resources'
import {
  VertexAttribArrayState,
} from '../states'

import { Capabilities } from '../Capabilities'
import { Color, RGBA_FORMAT } from '../Color'
import { Device } from '../Device'
import { Model, ModelOptions } from '../model/Model'
import { ShaderEffect, ShaderEffectOptions } from '../ShaderEffect'
import { SpriteBatch } from '../SpriteBatch'
import { VertexLayout } from '../VertexLayout'

import {
  BlendStateGL,
  CullStateGL,
  DepthStateGL,
  OffsetStateGL,
  SamplerStateGL,
  ScissorStateGL,
  StencilStateGL,
  TextureUnitStateGL,
  ViewportStateGL,
} from './states'

import { BufferGL, DepthBufferGL, FrameBufferGL, ShaderGL, ShaderProgramGL, TextureGL } from './resources'

/**
 * Determines whether webgl is supported
 * @public
 */
export const supportsWebGL = typeof WebGLRenderingContext === 'function'

/**
 * Determines whether webgl 2.0 is supported
 * @public
 */
export const supportsWebGL2 = typeof WebGL2RenderingContext === 'function'

/**
 * Constructor options for the {@link Device}
 *
 * @public
 */
export interface DeviceGLOptions {
  /**
   * Canvas element or selector
   */
  canvas?: string | HTMLCanvasElement
  /**
   * Rendering context or a context type
   */
  context?: 'webgl' | 'webgl2' | 'experimental-webgl' | WebGLRenderingContext | WebGL2RenderingContext
  /**
   * Context attributes
   */
  contextAttributes?: WebGLContextAttributes & { xrCompatible?: boolean }
}

/**
 * @public
 */
export const DefaultContextAttributes = Object.freeze<WebGLContextAttributes & { xrCompatible?: boolean }>({
  alpha: true,
  antialias: true,
  depth: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: true,
  stencil: true,
})

function getOrCreateContext(
  canvas: HTMLCanvasElement,
  options: DeviceGLOptions,
): WebGLRenderingContext | WebGL2RenderingContext {
  let context = options.context
  const attributes = {
    ...DefaultContextAttributes,
    ...(options.contextAttributes || {}),
  }

  if (typeof context === 'string') {
    // specific context is requested
    return canvas.getContext(context, attributes) as any
  } else if (context) {
    return context
  }

  // apply fallback strategy
  for (const name of ['webgl2', 'webgl', 'experimental-webgl']) {
    try {
      return canvas.getContext(name, attributes) as WebGLRenderingContext | WebGL2RenderingContext
    } catch (e) {
      Log.error('[Device]', `${name} is not supported`)
    }
  }

  throw Error('WebGL is not supported')
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
export class DeviceGL extends Device<WebGLRenderingContext | WebGL2RenderingContext> {
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

  public get isWebGL2(): boolean {
    return supportsWebGL2 && this.context instanceof WebGL2RenderingContext
  }

  protected $program: ShaderProgramGL
  protected $indexBuffer: BufferGL
  protected $vertexBuffer: BufferGL
  protected $vertexBuffers: BufferGL[]
  protected $cullState: CullStateGL
  protected $blendState: BlendStateGL
  protected $depthState: DepthStateGL
  protected $offsetState: OffsetStateGL
  protected $stencilState: StencilStateGL
  protected $scissorState: ScissorStateGL
  protected $viewportState: ViewportStateGL

  protected currentFrameBuffer: FrameBufferGL
  protected reusableFrameBuffer: FrameBufferGL
  protected reusableFrameBufferOptions: FrameBufferOptions = {
    textures: [],
    depthBuffer: null,
  }

  public get backBuffer(): FrameBufferGL {
    return this.customFrameBuffer
  }

  public set backBuffer(value: FrameBufferGL) {
    if (this.customFrameBuffer) {
      this.customFrameBuffer.destroy()
    }
    this.customFrameBuffer = value
  }
  private customFrameBuffer: FrameBufferGL

  public get driverInfo() {
    // https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info
    const debugInfo = this.capabilities.extension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = this.context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = this.context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor} ${renderer}`
    }
    return ""
  }

  /**
   * Constructs a {@link Device}
   */
  constructor(options: DeviceGLOptions = {}) {
    super()

    this.canvas = getOrCreateCanvas(options.canvas)
    this.context = getOrCreateContext(this.canvas, options)
    this.capabilities = new Capabilities(this)

    this.$cullState = new CullStateGL(this).commit(CullStateGL.Default).resolve()
    this.$blendState = new BlendStateGL(this).commit(BlendStateGL.Default).resolve()
    this.$depthState = new DepthStateGL(this).commit(DepthStateGL.Default).resolve()
    this.$offsetState = new OffsetStateGL(this).commit(OffsetStateGL.Default).resolve()
    this.$stencilState = new StencilStateGL(this).commit(StencilStateGL.Default).resolve()
    this.$scissorState = new ScissorStateGL(this).commit(ScissorStateGL.Default).resolve()
    this.$viewportState = new ViewportStateGL(this)
    this.$vertexAttribArrayState = new VertexAttribArrayState(this)

    this.textureUnits.length = Number(this.capabilities.maxTextureUnits)
    for (let i = 0; i < this.textureUnits.length; i++) {
      this.textureUnits[i] = new TextureUnitStateGL(this, i)
    }
  }

  /**
   * Clears the color, depth and stencil buffers
   */
  public clear(color?: number | number[] | Color, depth?: number, stencil?: number): this {
    let gl = this.context
    let mask = 0

    if (color != null) {
      if (color instanceof Color) {
        mask = mask | gl.COLOR_BUFFER_BIT
        gl.clearColor(color.x, color.y, color.z, color.w)
      } else if (typeof color === 'number') {
        mask = mask | gl.COLOR_BUFFER_BIT
        gl.clearColor(RGBA_FORMAT.x(color), RGBA_FORMAT.y(color), RGBA_FORMAT.z(color), RGBA_FORMAT.w(color))
      } else if (Array.isArray(color)) {
        mask = mask | gl.COLOR_BUFFER_BIT
        gl.clearColor(color[0], color[1], color[2], color[3])
      }
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
   * Renders geometry using the current index buffer, indexing vertices of current vertex buffer.
   *
   *
   *
   */
  public drawIndexedPrimitives(
    primitiveType?: PrimitiveType | PrimitiveTypeName,
    elementOffset?: number,
    elementCount?: number,
  ): this {
    const iBuffer = this.$indexBuffer
    const vBuffer = this.$vertexBuffer
    const vBuffers = this.$vertexBuffers
    const program = this.$program as ShaderProgramGL
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

    program.bindAttribPointerAndLocation(vBuffer || vBuffers)
    this.context.drawElements(type, elementCount, dataType, elementOffset)

    return this
  }

  /**
   * Renders multiple instances of the same geometry defined by current index buffer, indexing vertices in current vertex buffer.
   */
  public drawInstancedPrimitives(
    instanceCount?: number,
    primitiveType?: PrimitiveType | PrimitiveTypeName,
    offset?: number,
    count?: number,
  ): this {
    const iBuffer = this.$indexBuffer
    const vBuffer = this.$vertexBuffer
    const vBuffers = this.$vertexBuffers
    const program = this.$program as ShaderProgramGL
    if (!iBuffer) {
      throw new Error(`device.indexBuffer must be set before calling drawInstancedPrimitives()`)
    }
    if (!vBuffer && !vBuffers && !vBuffers.length) {
      throw new Error(
        `device.vertexBuffer or device.vertexBuffers must be set before calling drawInstancedPrimitives()`,
      )
    }
    if (!program) {
      throw new Error(`device.program must be set before calling drawInstancedPrimitives()`)
    }
    if (this.context instanceof WebGL2RenderingContext) {
      const dataType = iBuffer.dataType
      const type = valueOfPrimitiveType(primitiveType) || PrimitiveType.TriangleList

      offset = offset || 0
      count = count || iBuffer.elementCount
      instanceCount = instanceCount || 1

      program.bindAttribPointerAndLocation(vBuffer || vBuffers)

      this.context.drawElementsInstanced(type, count, dataType, offset * iBuffer.stride, instanceCount)
    } else {
      throw new Error(`not supported`)
    }

    return this
  }

  /**
   * Renders geometry defined by current vertex buffer and the given primitive type.
   */
  public drawPrimitives(primitiveType?: PrimitiveType | PrimitiveTypeName, offset?: number, count?: number): this {
    const vBuffer = this.$vertexBuffer
    const vBuffers = this.$vertexBuffers
    const program = this.$program as ShaderProgramGL
    if (!vBuffer && !vBuffers && !vBuffers.length) {
      throw new Error(`device.vertexBuffer or device.vertexBuffers must be set before calling drawPrimitives()`)
    }
    if (!program) {
      throw new Error(`device.program must be set before calling drawPrimitives()`)
    }

    const type = valueOfPrimitiveType(primitiveType) || PrimitiveType.TriangleList
    count = count || (vBuffer || vBuffers[0]).elementCount
    offset = offset || 0

    program.bindAttribPointerAndLocation(vBuffer || vBuffers)
    this.context.drawArrays(type, offset, count)
    return this
  }

  /**
   * If the display size of the canvas is controlled with CSS this will resize the
   * canvas to match the CSS dimensions in order to avoid stretched and blurry image.
   *
   * @param ratio - The pixel ratio for retina displays
   */
  public resize(pixelRatio: number = window.devicePixelRatio || 1): this {
    const displayWidth = Math.floor(this.canvas.clientWidth * pixelRatio)
    const displayHeight = Math.floor(this.canvas.clientHeight * pixelRatio)

    // Check if the canvas is not the same size.
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      const restoreBuffer = this.frameBuffer
      if (this.frameBuffer) {
        this.frameBuffer = null
      }

      // Make the canvas the same size
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight

      let state = this.$viewportState
      state.x = 0
      state.y = 0
      state.width = this.context.drawingBufferWidth
      state.height = this.context.drawingBufferHeight
      state.commit()

      this.frameBuffer = restoreBuffer
    }

    return this
  }

  public reset(): this {
    let ext = this.context.getExtension('WEBGL_lose_context')
    if (ext) {
      ext.loseContext() // trigger a context loss
      ext.restoreContext() // restores the context
    } else {
      Log.warn('[reset]', 'reset is not available due to missing extension: WEBGL_lose_context')
      // TODO:
      // this.trigger('reset')
    }
    return this
  }

  /**
   * Sets or un sets a single render target
   */
  public setRenderTarget(texture: Texture) {
    this.setRenderTargets(texture)
  }

  /**
   * Sets or un sets multiple render targets
   */
  public setRenderTargets(...targets: Texture[]): this
  public setRenderTargets(): this {
    const opts = this.reusableFrameBufferOptions
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
      this.frameBuffer = this.customFrameBuffer
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
    if (this.reusableFrameBuffer) {
      this.reusableFrameBuffer.init(opts)
    } else {
      this.reusableFrameBuffer = new FrameBufferGL(this, opts)
    }
    this.frameBuffer = this.reusableFrameBuffer
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
  public get frameBuffer(): FrameBufferGL {
    return this.currentFrameBuffer
  }
  /**
   * Sets and activates a frame buffer as the currently active frame buffer
   */
  public set frameBuffer(buffer: FrameBufferGL) {
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
  public set vertexBuffers(buffer: Buffer[]) {
    this.$vertexBuffers = buffer as BufferGL[]
    this.vertexBuffer = null
  }

  /**
   * Gets the currently active vertex buffer
   */
  public get vertexBuffer(): Buffer {
    return this.$vertexBuffer
  }
  /**
   * Sets and activates a buffer as the currently active vertex buffer
   */
  public set vertexBuffer(buffer: Buffer) {
    if (this.$vertexBuffer !== buffer) {
      if (buffer && this.$vertexBuffers && this.$vertexBuffers.indexOf(buffer as BufferGL) === -1) {
        throw new Error('vertexBuffer is not part of the vertexBuffers list')
      }
      this.context.bindBuffer(BufferType.VertexBuffer, buffer ? (buffer as BufferGL).handle : null)
      this.$vertexBuffer = buffer as BufferGL
    }
  }

  /**
   * Gets the currently active index buffer
   */
  public get indexBuffer(): Buffer {
    return this.$indexBuffer
  }
  /**
   * Sets and activates a buffer as the currently active index buffer
   */
  public set indexBuffer(buffer: Buffer) {
    if (this.$indexBuffer !== buffer) {
      this.context.bindBuffer(BufferType.IndexBuffer, buffer ? (buffer as BufferGL).handle : null)
      this.$indexBuffer = buffer as BufferGL
    }
  }

  /**
   * Gets the currently active shader program
   */
  public get program(): ShaderProgram {
    return this.$program
  }
  /**
   * Sets and activates a program as the currently active program
   */
  public set program(program: ShaderProgram) {
    if (this.$program !== program) {
      let handle = program ? (program as ShaderProgramGL).handle : null
      this.context.useProgram(handle)
      this.$program = program as ShaderProgramGL
    }
  }
  /**
   * Gets the current width of the drawing buffer
   */
  public get drawingBufferWidth() {
    return this.context.drawingBufferWidth
  }
  /**
   * Gets the current height of the drawing buffer
   */
  public get drawingBufferHeight() {
    return this.context.drawingBufferHeight
  }
  /**
   * Gets the aspect ratio of the drawing buffer
   */
  public get drawingBufferAspectRatio(): number {
    return this.drawingBufferWidth / this.drawingBufferHeight
  }

  /**
   * used internally when a depth buffer is created
   *
   * @internal
   */
  public registerDepthBuffer(buffer: DepthBuffer) {
    let list = this.registeredDepthBuffers
    let index = list.indexOf(buffer)
    if (index >= 0) {
      return
    }
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
    if (index < 0) {
      return
    }
    list[index] = null
    if (list.length === index + 1) {
      list.length = index
    }
  }

  /**
   * Creates a new Buffer of type IndexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public createIndexBuffer(options: BufferOptions): BufferGL {
    options.type = 'IndexBuffer'
    options.dataType = options.dataType || 'ushort'
    return new BufferGL(this, options)
  }

  /**
   * Creates a new Buffer of type VertexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public createVertexBuffer(options: BufferOptions): BufferGL {
    options.type = 'VertexBuffer'
    return new BufferGL(this, options)
  }

  /**
   * Create a new Shader resource
   */
  public createShader(options: ShaderOptions): ShaderGL {
    return new ShaderGL(this, options)
  }

  /**
   * Creates a new ShaderProgram. Calls the ShaderProgram constructor with given options.
   */
  public createProgram(options: ShaderProgramOptions): ShaderProgramGL {
    options.vertexShader = this.convertShaderOption(options.vertexShader)
    options.fragmentShader = this.convertShaderOption(options.fragmentShader)
    return new ShaderProgramGL(this, options)
  }

  /**
   * Creates a new Texture. Calls the Texture constructor with given options.
   */
  public createTexture(options: TextureOptions): TextureGL {
    return new TextureGL(this, options)
  }

  /**
   * Creates a new Texture that can be used as a render target. Ensures that
   * the depthFormat option is set and calls the Texture constructor.
   */
  public createRenderTarget(options: TextureOptions): TextureGL {
    options.depthFormat = options.depthFormat || 'None'
    return new TextureGL(this, options)
  }

  /**
   * Creates a new Texture of type Texture2D. Overrides the type option
   * before it calls the Texture constructor with given options.
   */
  public createTexture2D(options: TextureOptions = {}): TextureGL {
    options.type = 'Texture2D'
    return new TextureGL(this, options)
  }

  /**
   * Creates a new Texture of type TextureCube. Overrides the type option
   * before it calls the Texture constructor with given options.
   */
  public createTextureCube(options: TextureOptions = {}): TextureGL {
    options.type = 'TextureCube'
    return new TextureGL(this, options)
  }
  /**
   * Creates a new sampler state object
   */
  public createSamplerState(options?: { texture?: Texture }): SamplerStateGL {
    return new SamplerStateGL(this, options ? options.texture as TextureGL : undefined)
  }

  public createDepthBuffer(options: DepthBufferOptions): DepthBufferGL {
    return new DepthBufferGL(this, options)
  }

  /**
   * Creates a new sprite batch.
   */
  public createSpriteBatch(): SpriteBatch {
    return new SpriteBatch(this)
  }

  /**
   * Creates a vertex layout object from name
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

  public unsetSamplersUsedAsAttachments() {
    if (this.frameBuffer) {
      this.frameBuffer.unsetSamplersUsedAsAttachments()
    }
  }
}
