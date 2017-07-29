// tslint:disable no-bitwise

import { extend, isString, Log } from '@glib/core'

import {
  BufferType,
  DataType,
  DepthFormat,
  PrimitiveType,
  TextureType,
} from './enums'
import {
  BlendState,
  BlendStateOptions,
  CullState,
  CullStateOptions,
  DepthState,
  DepthStateOptions,
  OffsetState,
  OffsetStateOptions,
  SamplerState,
  ScissorState,
  ScissorStateOptions,
  StencilState,
  StencilStateOptions,
  VertexAttribArrayState,
  ViewportState,
  ViewportStateOptions,
} from './states'

import { DepthBuffer, DepthBufferOptions } from './DepthBuffer'
import { FrameBuffer, FrameBufferOptions } from './FrameBuffer'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'
import { Texture, TextureOptions } from './Texture'
import { VertexLayout } from './VertexLayout'

import { Buffer } from './Buffer'
import { Capabilities } from './Capabilities'
import { Color } from './Color'
import { Model, ModelOptions } from './Model'
import { ShaderProgram, ShaderProgramOptions } from './ShaderProgram'
import { SpriteBatch } from './SpriteBatch'

const supportsWebGL = typeof WebGLRenderingContext === 'function'
const supportsWebGL2 = typeof WebGL2RenderingContext === 'function'

export interface ContextAttributes {
  /**
   * If true, requests a drawing buffer with an alpha channel for the
   * purposes of performing OpenGL destination alpha operations
   * and compositing with the page.
   */
  alpha?: boolean,
  /**
   * If true, requests drawing buffer with a depth buffer of at least 16 bits.
   */
  depth?: boolean,
  /**
   * If true, requests a stencil buffer of at least 8 bits.
   */
  stencil?: boolean,
  /**
   * If true, requests drawing buffer with antialiasing using its choice
   * of technique (multisample/supersample) and quality.
   */
  antialias?: boolean,
  /**
   * If true, requests drawing buffer which contains colors with
   * premultiplied alpha. (Ignored if Alpha is false.)
   */
  premultipliedAlpha?: boolean,
  /**
   * If true, requests that contents of the drawing buffer remain in
   * between frames, at potential performance cost.
   */
  preserveDrawingBuffer?: boolean
}

export const DEFAULT_CONTEXT_ATTRIBUTES: ContextAttributes = Object.freeze({
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
    let element = document.getElementById(canvas as string)
    if (element instanceof HTMLCanvasElement) {
      return element
    } else {
      throw new Error(`expected '${canvas}' to be a HTMLCanvasElement but found '${element}'`)
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
 * The Glib.Graphics.Device class ties all concepts of the Graphics package together.
 * It's a central component for rendering geometries. It holds system state variables and
 * is able to create resources such as buffers, shaders, textures and render targets.
 */
export class Device {

  /**
   * The html canvas element
   * @link https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement
   */
  public canvas: HTMLCanvasElement

  /**
   * The webgl rendering context.
   * @link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
   * @link https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
   */
  public context: WebGLRenderingContext | WebGL2RenderingContext

  /**
   * A collection of capabilites of the currently running graphics unit.
   */
  public capabilities: Capabilities

  /**
   * Register of render states. The size of the collection and thus the number of
   * sampler units is determined by `capabilities.maxTextureUnits`
   */
  public samplerStates: SamplerState[]

  /**
   * The indexBuffer propery value. Do not set this value directly. Use the property accessors instead
   */
  private $indexBuffer: Buffer

  /**
   * The vertexBuffer propery value. Do not set this value directly. Use the property accessors instead
   */
  private $vertexBuffer: Buffer
  /**
   * The program propery value. Do not set this value directly. Use the property accessors instead
   */
  private $program: ShaderProgram
  /**
   * The cached index buffer that is used to draw a full screen quad.
   */
  private quadIndexBuffer: Buffer
  /**
   * The cached vertex buffer that is used to draw a full screen quad.
   */
  private quadVertexBuffer: Buffer
  /**
   * The cached vertex buffer that is used to draw a full screen quad with flipped texture coordinates.
   */
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

  constructor(options: {
    canvas?: string|HTMLCanvasElement,
    context?: string|WebGLRenderingContext|WebGL2RenderingContext,
    contextAttributes?: ContextAttributes,
  } = {}) {

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

  /** Gets a copy of the cull state parameters */
  get cullState() {
    return this.$cullState.copy()
  }
  /** Updates the cull state parameters and direclty commits the state to the GPU */
  set cullState(v: CullStateOptions) {
    this.$cullState.commit(v)
  }
  /** Gets a copy of the blend state parameters */
  get blendState() {
    return this.$blendState.copy()
  }
  /** Updates the blend state parameters and direclty commits the state to the GPU */
  set blendState(v: BlendStateOptions) {
    this.$blendState.commit(v)
  }
  /** Gets a copy of the depth state parameters */
  get depthState() {
    return this.$depthState.copy()
  }
  /** Updates the depth state parameters and direclty commits the state to the GPU */
  set depthState(v: DepthStateOptions) {
    this.$depthState.commit(v)
  }
  /** Gets a copy of the offset state parameters */
  get offsetState() {
    return this.$offsetState.copy()
  }
  /** Updates the offset state parameters and direclty commits the state to the GPU */
  set offsetState(v: OffsetStateOptions) {
    this.$offsetState.commit(v)
  }
  /** Gets a copy of the stencil state parameters */
  get stencilState() {
    return this.$stencilState.copy()
  }
  /** Updates the stencil state parameters and direclty commits the state to the GPU */
  set stencilState(v: StencilStateOptions) {
    this.$stencilState.commit(v)
  }
  /** Gets a copy of the scissor state parameters */
  get scissorState() {
    return this.$scissorState.copy()
  }
  /** Updates the scissor state parameters and direclty commits the state to the GPU */
  set scissorState(v: ScissorStateOptions) {
    this.$scissorState.commit(v)
  }
  /** Gets a copy of the viewport state parameters */
  get viewportState() {
    return this.$viewportState.copy()
  }
  /** Updates the viewport state parameters and direclty commits the state to the GPU */
  set viewportState(v: ViewportStateOptions) {
    this.$viewportState.commit(v)
  }

  get defaultTexture(): Texture {
    if (!this.defaultTextureInstance) {
      this.defaultTextureInstance = this.createTexture2D({
        data: [0, 0, 0, 0],
      })
    }
    return this.defaultTextureInstance
  }

  get isWebGL2(): boolean {
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
      let c = Color
      gl.clearColor(c.x(color), c.y(color), c.z(color), c.w(color))
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
      gl.clearColor(Color.x(color), Color.y(color), Color.z(color), Color.w(color))
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
      let c = Color
      gl.clearColor(c.x(color), c.y(color), c.z(color), c.w(color))
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
   * @param [primitiveType=TriangleList]
   * @param [elementOffset=0]
   * @param [elementCount=indexBuffer.elementCount]
   */
  public drawIndexedPrimitives(primitiveType?: number, elementOffset?: number, elementCount?: number): Device {
    let iBuffer = this.$indexBuffer
    let vBuffer = this.$vertexBuffer
    let program = this.$program
    if (!iBuffer) {
      throw new Error(`drawIndexedPrimitives() requires an indexBuffer`)
    }
    if (!vBuffer) {
      throw new Error(`drawIndexedPrimitives() requires a vertexBuffer`)
    }
    if (!program) {
      throw new Error(`drawIndexedPrimitives() requires a program`)
    }

    let type = iBuffer.dataType
    let Enum = PrimitiveType
    primitiveType = Enum[primitiveType || Enum.TriangleList]

    elementOffset = (elementOffset || 0) * iBuffer.elementSize
    elementCount = elementCount || iBuffer.elementCount

    this.bindAttribPointerAndLocation(vBuffer, program, vBuffer.layout, program.attributes)
    this.context.drawElements(primitiveType, elementCount, type, elementOffset)

    return this
  }

  /**
   * Renders multiple instances of the same geometry defined by current index buffer, indexing vertices in current vertex buffer.
   * @param {number} [instanceCount=1]
   * @param {number} [primitiveType=TriangleList]
   * @param {number} [offset=0]
   * @param {number} [count=indexBuffer.elementCount]
   * @return {Device}
   */
  public drawInstancedPrimitives(instanceCount?: number, primitiveType?: number, offset?: number, count?: number): Device {
    let iBuffer = this.$indexBuffer
    let vBuffer = this.$vertexBuffer
    let program = this.$program
    if (!iBuffer) {
      throw new Error(`drawInstancedPrimitives() requires an indexBuffer`)
    }
    if (!vBuffer) {
      throw new Error(`drawInstancedPrimitives() requires a vertexBuffer`)
    }
    if (!program) {
      throw new Error(`drawInstancedPrimitives() requires a program`)
    }

    let type = iBuffer.dataType
    let Enum = PrimitiveType
    primitiveType = Enum[primitiveType || Enum.TriangleList]
    offset = offset || 0
    count = count || iBuffer.elementCount
    instanceCount = instanceCount || 1

    this.bindAttribPointerAndLocation(vBuffer, program, vBuffer.layout, program.attributes);
    (this.context as any).drawElementsInstanced(primitiveType, count, type, offset * iBuffer.elementSize, instanceCount)
    return this
  }

  /**
   * Renders geometry defined by current vertex buffer and the given primitive type.
   * @param {number} [primitiveType=TriangleList]
   * @param {number} [offset=0]
   * @param {number} [count=indexBuffer.elementCount]
   * @return {Device}
   */
  public drawPrimitives(primitiveType?: number, offset?: number, count?: number): Device {
    let vBuffer = this.$vertexBuffer
    let program = this.$program
    if (!vBuffer) {
      throw new Error(`drawInstancedPrimitives() requires a vertexBuffer`)
    }
    if (!program) {
      throw new Error(`drawInstancedPrimitives() requires a program`)
    }

    primitiveType = (PrimitiveType[primitiveType] || PrimitiveType.TriangleList)
    count = count || vBuffer.elementCount
    offset = offset || 0

    this.bindAttribPointerAndLocation(vBuffer, program, vBuffer.layout, program.attributes)
    this.context.drawArrays(primitiveType, offset, count)
    return this
  }

  /**
   * Draws a full screen quad with the [0,0] texture coordinate starting at the bottom left.
   * @param flipY if true, then the [0,0] texture coordinate starts in the top left.
   * @returns {Glib.Graphics.Device}
   */
  public drawQuad(flipY?: boolean): Device {
    let iBuffer = this.quadIndexBuffer || this.createIndexBuffer({
        data: [0, 1, 3, 0, 3, 2],
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
   * @param [ratio] The pixel ratio for retina displays
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

    // There is at leas one render target set.
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

  private bindAttribPointerAndLocation(vBuffer: Buffer, program: ShaderProgram, layout?: any, attributes?: any) {
    layout = layout || vBuffer.layout
    attributes = attributes || program.attributes

    for (const key in attributes) {
      if (attributes.hasOwnProperty(key)) {

        const channel = layout[key]
        const attribute = attributes[key]
        if (!channel) {
          // tslint:disable-next-line
          throw new Error(`Can not use current shader program with current vertex buffer. The program requires '${Object.keys(attributes)}' attributes. '${key}' is missing in vertex buffer.`)
        }

        this.context.vertexAttribPointer(
          attribute.location,
          channel.elements,
          DataType[channel.type],
          !!attribute.normalize || !!channel.normalize,
          vBuffer.elementSize,
          channel.offset)
      }
    }
    this.$vertexAttribArrayState.commit(program.attributeLocations)
  }

  /**
   * used internally when a render target is created
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
  public createIndexBuffer(options: any): Buffer {
    options.type = 'IndexBuffer'
    options.dataType = options.dataType || 'ushort'
    return new Buffer(this, options)
  }

  /**
   * Creates a new Buffer of type VertexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public createVertexBuffer(options: any): Buffer {
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
   * @see VertexLayout.create
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
}
