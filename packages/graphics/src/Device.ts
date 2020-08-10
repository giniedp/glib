
import { isString } from '@gglib/utils'

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
  TextureOptions,
} from './resources'
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
  TextureUnitState,
  VertexAttribArrayState,
  ViewportState,
  ViewportStateParams,
} from './states'

import { Capabilities } from './Capabilities'
import { Color } from './Color'
import { Model, ModelOptions } from './model/Model'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'
import { SpriteBatch } from './SpriteBatch'
import { VertexLayout } from './VertexLayout'

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
  public capabilities: Capabilities

  /**
   * Collection of assigned textures
   *
   * @remarks
   * The number of texture units is limited by {@link Capabilities.maxTextureUnits}
   */
  public readonly textures: Texture[]

  /**
   * Collection of {@link SamplerState}.
   *
   * @remarks
   * The number of sampler states is limited by {@link Capabilities.maxTextureUnits}
   */
  public readonly textureUnits: TextureUnitState[] = []

  /**
   * Gets a copy of the cull state parameters
   * Updates the cull state parameters and commits the state to the GPU
   */
  public get cullState() {
    return this.$cullState.copy()
  }
  public set cullState(v: CullStateParams) {
    this.$cullState.commit(v)
  }
  /**
   * Gets a copy of the blend state parameters.
   * Updates the blend state parameters and commits the state to the GPU.
   */
  public get blendState() {
    return this.$blendState.copy()
  }
  public set blendState(v: BlendStateParams) {
    this.$blendState.commit(v)
  }
  /**
   * Gets a copy of the depth state parameters
   * Updates the depth state parameters and commits the state to the GPU
   */
  public get depthState() {
    return this.$depthState.copy()
  }
  public set depthState(v: DepthStateParams) {
    this.$depthState.commit(v)
  }
  /**
   * Gets a copy of the offset state parameters
   * Updates the offset state parameters and commits the state to the GPU
   */
  public get offsetState() {
    return this.$offsetState.copy()
  }
  public set offsetState(v: OffsetStateParams) {
    this.$offsetState.commit(v)
  }
  /**
   * Gets a copy of the stencil state parameters
   * Updates the stencil state parameters and commits the state to the GPU
   */
  public get stencilState() {
    return this.$stencilState.copy()
  }
  public set stencilState(v: StencilStateParams) {
    this.$stencilState.commit(v)
  }
  /**
   * Gets a copy of the scissor state parameters
   * Updates the scissor state parameters and commits the state to the GPU
   */
  public get scissorState() {
    return this.$scissorState.copy()
  }
  public set scissorState(v: ScissorStateParams) {
    this.$scissorState.commit(v)
  }
  /**
   * Gets a copy of the viewport state parameters
   * Updates the viewport state parameters and commits the state to the GPU
   */
  public get viewportState() {
    return this.$viewportState.copy()
  }
  public set viewportState(v: ViewportStateParams) {
    this.$viewportState.commit(v)
  }

  public get defaultTexture(): Texture {
    if (!this.defaultTextureInstance) {
      this.defaultTextureInstance = this.createTexture2D({
        data: [0x0f, 0x0f, 0x0f, 0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00, 0xff, 0x0f, 0x0f, 0x0f, 0xff],
        width: 2,
        height: 2,
        pixelFormat: PixelFormat.RGBA,
        samplerParams: SamplerState.PointWrap,
      })
    }
    return this.defaultTextureInstance
  }

  protected abstract $indexBuffer: Buffer
  protected abstract $vertexBuffer: Buffer
  protected abstract $vertexBuffers: Buffer[]
  protected abstract $program: ShaderProgram
  protected abstract $cullState: CullState
  protected abstract $blendState: BlendState
  protected abstract $depthState: DepthState
  protected abstract $offsetState: OffsetState
  protected abstract $stencilState: StencilState
  protected abstract $scissorState: ScissorState
  protected abstract $viewportState: ViewportState

  protected quadIndexBuffer: Buffer
  protected quadVertexBuffer: Buffer
  protected quadVertexBufferFlipped: Buffer

  protected $vertexAttribArrayState: VertexAttribArrayState
  protected registeredDepthBuffers: DepthBuffer[] = []

  protected defaultTextureInstance: Texture

  public get driverInfo(): string {
    return ""
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
    let iBuffer =
      this.quadIndexBuffer ||
      this.createIndexBuffer({
        data: [0, 3, 1, 0, 2, 3],
        dataType: 'ushort',
      })
    this.quadIndexBuffer = iBuffer

    let vBuffer
    if (flipY) {
      vBuffer =
        this.quadVertexBufferFlipped ||
        this.createVertexBuffer({
          data: [-1, 1, 0, 0, 0, 1, 1, 0, 1, 0, -1, -1, 0, 0, 1, 1, -1, 0, 1, 1],
          layout: this.createVertexLayout('PositionTexture'),
          dataType: 'float',
        })
      this.quadVertexBufferFlipped = vBuffer
    } else {
      vBuffer =
        this.quadVertexBuffer ||
        this.createVertexBuffer({
          data: [-1, 1, 0, 0, 1, 1, 1, 0, 1, 1, -1, -1, 0, 0, 0, 1, -1, 0, 1, 0],
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
  public abstract resize(pixelRatio?: number): this
  /**
   *
   */
  public abstract reset(): this

  /**
   * Sets or un sets a single render target
   */
  public setRenderTarget(texture: Texture) {
    this.setRenderTargets(texture)
  }

  /**
   * Sets or un sets multiple render targets
   */
  public abstract setRenderTargets(...targets: Texture[]): this

  /**
   * Sets multiple vertex buffers
   *
   * @remarks
   * Restricts the `vertexBuffer` property to only this set of buffers.
   */
  public set vertexBuffers(buffer: Buffer[]) {
    this.$vertexBuffers = buffer
    this.vertexBuffer = null
  }

  /**
   * Gets the currently active vertex buffer
   */
  public abstract get vertexBuffer(): Buffer
  /**
   * Sets and activates a buffer as the currently active vertex buffer
   */
  public abstract set vertexBuffer(buffer: Buffer)
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
  public abstract createVertexBuffer(options: BufferOptions): Buffer
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
   * Creates a new Texture. Calls the Texture constructor with given options.
   */
  public abstract createTexture(options?: TextureOptions): Texture
  /**
   * Creates a new Texture that can be used as a render target. Ensures that
   * the depthFormat option is set and calls the Texture constructor.
   */
  public abstract createRenderTarget(options?: TextureOptions): Texture
  /**
   * Creates a new Texture of type Texture2D. Overrides the type option
   * before it calls the Texture constructor with given options.
   */
  public abstract createTexture2D(options?: TextureOptions): Texture
  /**
   * Creates a new Texture of type TextureCube. Overrides the type option
   * before it calls the Texture constructor with given options.
   */
  public abstract createTextureCube(options?: TextureOptions): Texture
  /**
   * Creates a new sampler state object
   */
  public abstract createSamplerState(options?: { texture?: Texture }): SamplerState

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

  protected convertShaderOption<S>(input: string | S): string | S {
    if (typeof input === 'string' && input.startsWith('#') && input.indexOf('\n') < 0) {
      const element = document.getElementById(input.substr(1))
      if (element) {
        return element.textContent
      }
    }
    return input
  }

  protected set<K extends keyof this>(key: K, value: this[K]) {
    (this as any)[key] = value
  }
}
