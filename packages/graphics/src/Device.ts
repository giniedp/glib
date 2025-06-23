import { PixelFormat, PrimitiveType, PrimitiveTypeName, ShaderType } from './enums'
import {
  Buffer,
  BufferOptions,
  DepthBuffer,
  DepthBufferOptions,
  Shader,
  ShaderOptions,
  ShaderProgram,
  ShaderProgramOptions,
  Texture,
  TextureImage,
  TextureImageOptions,
  TextureOptions,
} from './resources'
import {
  BlendState,
  BlendStateParams,
  CullState,
  CullStateParams,
  DepthState,
  DepthStateParams,
  ICullState,
  OffsetState,
  OffsetStateParams,
  SamplerState,
  SamplerStateParams,
  ScissorState,
  ScissorStateParams,
  StencilState,
  StencilStateParams,
  TextureUnitState,
  VertexAttribArrayState,
  ViewportState,
  ViewportStateParams,
} from './states'

import { Capabilities } from './Capabilities'
import { Color } from './Color'
import { Effect, EffectOptions } from './Effect'
import { VertexBuffer, VertexBufferOptions } from './resources/VertexBuffer'
import { SpriteBatch } from './SpriteBatch'
import { AttributeSemantic, VertexLayout } from './VertexLayout'
import { Scheduler } from './Scheduler'

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
export abstract class Device<T = unknown> {
  /**
   * The html canvas element
   * see {@link https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement | HTMLCanvasElement}
   */
  public readonly canvas: HTMLCanvasElement

  /**
   * The rendering context.
   */
  public readonly context: T

  /**
   * A collection of capabilities of the currently running graphics unit.
   */
  public abstract capabilities: Capabilities

  /**
   * Collection of assigned textures
   *
   * @remarks
   * The number of texture units is limited by {@link Capabilities.maxTextureUnits}
   */
  public readonly textures: TextureImage[]

  /**
   * Collection of {@link SamplerState}.
   *
   * @remarks
   * The number of sampler states is limited by {@link Capabilities.maxTextureUnits}
   */
  public readonly textureUnits: TextureUnitState[] = []

  /**
   * A simple task scheduler that can be used for poll tasks or even game loops
   *
   * @remarks
   * Primarily used for scheduling poll tasks for shader compilation results or texture uploads.
   * Can be used for game loops as well, yet it's not optimized for that purpose.
   */
  public readonly scheduler = new Scheduler()

  /**
   * Gets a copy of the cull state parameters
   * Updates the cull state parameters and commits the state to the GPU
   */
  public get cullState() {
    return this._cullState.copy()
  }
  public set cullState(v: CullStateParams) {
    this._cullState.commit(v)
  }

  /**
   * Copies the current cull state parameters to a target object.
   *
   * @remarks
   * This is a garbage free way to get the current cull state parameters.
   */
  public getCullState(target: Partial<ICullState>): CullStateParams {
    return this._cullState.copy(target)
  }

  /**
   * Gets a copy of the blend state parameters.
   * Updates the blend state parameters and commits the state to the GPU.
   */
  public get blendState() {
    return this._blendState.copy()
  }
  public set blendState(v: BlendStateParams) {
    this._blendState.commit(v)
  }

  /**
   * Copies the current blend state parameters to a target object.
   */
  public getBlendState(target: Partial<BlendStateParams>): BlendStateParams {
    return this._blendState.copy(target)
  }

  /**
   * Gets a copy of the depth state parameters
   * Updates the depth state parameters and commits the state to the GPU
   */
  public get depthState() {
    return this._depthState.copy()
  }
  public set depthState(v: DepthStateParams) {
    this._depthState.commit(v)
  }

  /**
   * Copies the current depth state parameters to a target object.
   */
  public getDepthState(target: Partial<DepthStateParams>): DepthStateParams {
    return this._depthState.copy(target)
  }

  /**
   * Gets a copy of the offset state parameters
   * Updates the offset state parameters and commits the state to the GPU
   */
  public get offsetState() {
    return this._offsetState.copy()
  }
  public set offsetState(v: OffsetStateParams) {
    this._offsetState.commit(v)
  }

  /**
   * Copies the current offset state parameters to a target object.
   */
  public getOffsetState(target: Partial<OffsetStateParams>): OffsetStateParams {
    return this._offsetState.copy(target)
  }

  /**
   * Gets a copy of the stencil state parameters
   * Updates the stencil state parameters and commits the state to the GPU
   */
  public get stencilState() {
    return this._stencilState.copy()
  }
  public set stencilState(v: StencilStateParams) {
    this._stencilState.commit(v)
  }

  /**
   * Copies the current stencil state parameters to a target object.
   */
  public getStencilState(target: Partial<StencilStateParams>): StencilStateParams {
    return this._stencilState.copy(target)
  }

  /**
   * Gets a copy of the scissor state parameters
   * Updates the scissor state parameters and commits the state to the GPU
   */
  public get scissorState() {
    return this._scissorState.copy()
  }
  public set scissorState(v: ScissorStateParams) {
    this._scissorState.commit(v)
  }

  /**
   * Copies the current scissor state parameters to a target object.
   */
  public getScissorState(target: Partial<ScissorStateParams>): ScissorStateParams {
    return this._scissorState.copy(target)
  }

  /**
   * Gets a copy of the viewport state parameters
   * Updates the viewport state parameters and commits the state to the GPU
   */
  public get viewportState() {
    return this._viewportState.copy()
  }
  public set viewportState(v: ViewportStateParams) {
    this._viewportState.commit(v)
  }

  public abstract canRenderFloat: boolean
  public abstract canRenderHalf: boolean
  public abstract canFilterFloat: boolean
  public abstract canFilterHalf: boolean

  /**
   * Copies the current viewport state parameters to a target object.
   */
  public getViewportState(target: Partial<ViewportStateParams>): ViewportStateParams {
    return this._viewportState.copy(target)
  }

  public get defaultTexture(): Texture {
    if (!this.defaultTextureInstance) {
      this.defaultTextureInstance = this.createTexture({
        name: 'default2x2',
        sampler: SamplerState.PointWrap,
        type: 'Texture2D',
        // prettier-ignore
        source: [
          0x0f, 0x0f, 0x0f, 0xff,
          0x00, 0x00, 0x00, 0xff,
          0x00, 0x00, 0x00, 0xff,
          0x0f, 0x0f, 0x0f, 0xff,
        ],
        width: 2,
        height: 2,
        pixelFormat: PixelFormat.RGBA,
      })
    }
    return this.defaultTextureInstance
  }

  protected abstract _indexBuffer: Buffer
  protected abstract _vertexBuffer: VertexBuffer
  protected abstract _program: ShaderProgram
  protected abstract _cullState: CullState
  protected abstract _blendState: BlendState
  protected abstract _depthState: DepthState
  protected abstract _offsetState: OffsetState
  protected abstract _stencilState: StencilState
  protected abstract _scissorState: ScissorState
  protected abstract _viewportState: ViewportState

  protected quadIndexBuffer: Buffer
  protected quadVertexBuffer: VertexBuffer
  protected quadVertexBufferFlipped: VertexBuffer

  protected $vertexAttribArrayState: VertexAttribArrayState
  protected registeredDepthBuffers: DepthBuffer[] = []

  protected defaultTextureInstance: Texture

  public drawCalls = 0
  public get driverInfo(): string {
    return ''
  }

  public init(): Promise<void> {
    return Promise.resolve()
  }

  /**
   * Clears the color, depth and stencil buffers
   */
  public abstract clear(color?: number | number[] | Color, depth?: number, stencil?: number): this

  /**
   * Renders geometry using the current index buffer, indexing vertices of current vertex buffer.
   */
  public abstract drawIndexedPrimitives(
    primitiveType?: PrimitiveType | PrimitiveTypeName,
    elementOffset?: number,
    elementCount?: number,
  ): this

  public abstract drawInstancedPrimitives(
    instanceCount?: number,
    primitiveType?: PrimitiveType | PrimitiveTypeName,
    offset?: number,
    count?: number,
  ): this

  /**
   * Renders geometry defined by current vertex buffer and the given primitive type.
   */
  public abstract drawPrimitives(
    primitiveType?: PrimitiveType | PrimitiveTypeName,
    offset?: number,
    count?: number,
  ): this

  /**
   * Draws a full screen quad with the [0,0] texture coordinate starting at the bottom left.
   * @param flipY - if true, then the [0,0] texture coordinate starts in the top left.
   *
   */
  public drawQuad(flipY?: boolean): this {
    this.quadIndexBuffer ||= this.createIndexBuffer({
      data: [0, 3, 1, 0, 2, 3],
      dataType: 'ushort',
    })
    this.quadVertexBufferFlipped ||= this.createVertexBuffer([
      {
        // prettier-ignore
        data: [
          -1,  1, 0, /* uv */ 0, 0,
           1,  1, 0, /* uv */ 1, 0,
          -1, -1, 0, /* uv */ 0, 1,
           1, -1, 0, /* uv */ 1, 1
        ],
        layout: this.createVertexLayout(['position', 'texture']),
        dataType: 'float',
      },
    ])
    this.quadVertexBuffer ||= this.createVertexBuffer([
      {
        // prettier-ignore
        data: [
          -1,  1, 0, /* uv */ 0, 1,
           1,  1, 0, /* uv */ 1, 1,
          -1, -1, 0, /* uv */ 0, 0,
           1, -1, 0, /* uv */ 1, 0,
        ],
        layout: this.createVertexLayout(['position', 'texture']),
        dataType: 'float',
      },
    ])

    this.indexBuffer = this.quadIndexBuffer
    this.vertexBuffer = flipY ? this.quadVertexBufferFlipped : this.quadVertexBuffer
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
  public abstract resize(pixelRatio?: number): this
  /**
   *
   */
  public abstract reset(): this

  /**
   * Sets or un sets a single render target
   */
  public setRenderTarget(texture: TextureImage | null) {
    this.setRenderTargets(texture)
  }

  /**
   * Sets or un sets multiple render targets
   */
  public abstract setRenderTargets(...targets: TextureImage[]): this

  /**
   * Gets the currently active vertex buffer
   */
  public abstract get vertexBuffer(): VertexBuffer

  /**
   * Sets and activates a buffer as the currently active vertex buffer
   */
  public abstract set vertexBuffer(buffer: VertexBuffer)

  /**
   * Gets the currently active index buffer
   */
  public abstract get indexBuffer(): Buffer

  /**
   * Sets and activates a buffer as the currently active index buffer
   */
  public abstract set indexBuffer(buffer: Buffer)

  /**
   * Gets the currently active shader program
   */
  public abstract get program(): ShaderProgram

  /**
   * Sets and activates a program as the currently active program
   */
  public abstract set program(program: ShaderProgram)

  /**
   * Gets the current width of the drawing buffer
   */
  public abstract get drawingBufferWidth(): number

  /**
   * Gets the current height of the drawing buffer
   */

  public abstract get drawingBufferHeight(): number
  /**
   * Gets the aspect ratio of the drawing buffer
   */
  public abstract get drawingBufferAspectRatio(): number

  /**
   * Creates a new Buffer of type IndexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public abstract createIndexBuffer(options: BufferOptions): Buffer

  /**
   * Creates a new Buffer of type VertexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public abstract createVertexBuffer(options: VertexBufferOptions): VertexBuffer

  /**
   * Creates a new Shader
   */
  public abstract createShader(options: ShaderOptions): Shader

  /**
   *
   */
  public createVertexShader(options: Partial<ShaderOptions> = {}): Shader {
    return this.createShader({
      type: ShaderType.VertexShader,
      ...options,
    })
  }

  /**
   *
   */
  public createFragmentShader(options: Partial<ShaderOptions> = {}): Shader {
    return this.createShader({
      type: ShaderType.FragmentShader,
      ...options,
    })
  }
  /**
   * Creates a new ShaderProgram. Calls the ShaderProgram constructor with given options.
   */
  public abstract createProgram(options: ShaderProgramOptions): ShaderProgram

  /**
   * Creates a new Texture
   */
  public abstract createTexture(options?: TextureOptions): Texture

  /**
   * Creates a new TextureImage
   */
  public abstract createTextureImage(options?: TextureImageOptions): TextureImage

  /**
   * Creates a new Texture that can be used as a render target. Ensures that
   * the depthFormat option and a reasonable sampler are set.
   */
  public abstract createRenderTarget(options?: TextureOptions): Texture

  /**
   * Creates a new sampler state object
   */
  public abstract createSamplerState(options?: SamplerStateParams): SamplerState

  /**
   * Creates a depth buffer
   */
  public abstract createDepthBuffer(options: DepthBufferOptions): DepthBuffer
  /**
   * Creates a new sprite batch.
   */
  public createSpriteBatch(): SpriteBatch {
    return new SpriteBatch(this)
  }
  /**
   * Creates a vertex layout object from name
   */
  public createVertexLayout(semantic: AttributeSemantic[]): any {
    return VertexLayout.create(semantic)
  }

  /**
   * Creates an Effect with given options
   */
  public createEffect(options: EffectOptions): Effect {
    return new Effect(this, options)
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
    let buffer = this.createDepthBuffer({
      width: options.width,
      height: options.height,
      depthFormat: options.depthFormat,
    })

    this.registerDepthBuffer(buffer)
    return buffer
  }

  protected set<K extends keyof this>(key: K, value: this[K]) {
    this[key] = value
  }

  public abstract stats(out?: Record<string, any>): Record<string, any>

  public dispose() {
    this.scheduler.dispose()
  }
}
