

import { Log, getOrCreateCanvas } from '@gglib/utils'

import { PrimitiveType, PrimitiveTypeName, valueOfPrimitiveType } from '../enums'
import {
  Buffer,
  BufferOptions,
  DepthBufferOptions,
  FrameBufferOptions,
  ShaderOptions,
  ShaderProgram,
  ShaderProgramOptions,
  Texture,
  TextureOptions,
} from '../resources'
import {
  BlendState,
  CullState,
  DepthState,
  OffsetState,
  ScissorState,
  StencilState,
  VertexAttribArrayState,
} from '../states'

import { Color } from '../Color'
import { Device } from '../Device'

import { BufferGPU, DepthBufferGPU, FrameBufferGPU, ShaderGPU, ShaderProgramGPU, TextureGPU } from './resources'
import {
  BlendStateGPU,
  CullStateGPU,
  DepthStateGPU,
  OffsetStateGPU,
  SamplerStateGPU,
  ScissorStateGPU,
  StencilStateGPU,
  ViewportStateGPU,
} from './states'
import { TextureUnitStateGPU } from './states/TextureUnitStateGPU'

// tslint:disable-next-line: no-submodule-imports
// TODO: dynamic import
import initGlslang, { Glslang } from '@webgpu/glslang/dist/web-devel-onefile/glslang'
import { toPrimitiveTopology } from './utils/primitiveTopology'

/**
 * Constructor options for the {@link Device}
 *
 * @public
 */
export interface DeviceGPUOptions {
  /**
   * Canvas element or selector
   */
  canvas?: string | HTMLCanvasElement
  /**
   * Rendering context or a context type
   */
  context?: 'gpu'
}

function getOrCreateContext(canvas: HTMLCanvasElement, options: DeviceGPUOptions): GPUCanvasContext {
  let context = options.context

  if (typeof context === 'string') {
    return canvas.getContext(context) as any
  } else if (context) {
    return context
  }

  // apply fallback strategy
  for (const name of ['gpu']) {
    try {
      return canvas.getContext(name) as any
    } catch (e) {
      Log.e('[Device]', `${name} is not supported`)
    }
  }

  throw Error('WebGPU is not supported')
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
export class DeviceGPU extends Device<any> {
  /**
   * The html canvas element
   * see {@link https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement | HTMLCanvasElement}
   */
  public readonly canvas: HTMLCanvasElement

  /**
   * The webgpu rendering context.
   */
  public readonly context: GPUCanvasContext

  private readonly initPromise: Promise<void>

  /**
   * The web gpu api
   */
  public readonly device: GPUDevice
  public readonly adapter: GPUAdapter
  public readonly swapChain: GPUSwapChain
  public readonly glslang: Glslang

  public readonly msaaSampleCount = 4

  protected $indexBuffer: BufferGPU
  protected $vertexBuffer: BufferGPU
  protected $vertexBuffers: BufferGPU[]
  protected $program: ShaderProgramGPU
  protected $cullState: CullStateGPU
  protected $blendState: BlendStateGPU
  protected $depthState: DepthStateGPU
  protected $offsetState: OffsetStateGPU
  protected $stencilState: StencilStateGPU
  protected $scissorState: ScissorStateGPU
  protected $viewportState: ViewportStateGPU

  private renderCommandEncoder: GPUCommandEncoder
  private renderPassEncoder: GPURenderPassEncoder
  private renderBundleEncoder: GPURenderBundleEncoder
  private get renderEncoder() {
    return this.renderBundleEncoder || this.renderPassEncoder
  }

  private commandBuffers: GPUCommandBuffer[] = []

  public readonly mainTextureFormat: GPUTextureFormat = 'rgba8unorm'
  public readonly mainTexture: TextureGPU
  public readonly mainDepthFormat: GPUTextureFormat = 'depth24plus-stencil8'
  public readonly mainDepth: DepthBufferGPU

  private frameBuffer: FrameBufferGPU
  private frameBufferOptions: FrameBufferOptions = {
    textures: [],
    depthBuffer: null,
  }

  /**
   * Constructs a {@link Device}
   */
  constructor(options: DeviceGPUOptions = {}) {
    super()

    this.canvas = getOrCreateCanvas(options.canvas)
    this.context = getOrCreateContext(this.canvas, options)

    this.$cullState = new CullStateGPU().commit(CullState.Default)
    this.$blendState = new BlendStateGPU().commit(BlendState.Default)
    this.$depthState = new DepthStateGPU().commit(DepthState.Default)
    this.$offsetState = new OffsetStateGPU().commit(OffsetState.Default)
    this.$stencilState = new StencilStateGPU().commit(StencilState.Default)
    this.$scissorState = new ScissorStateGPU().commit(ScissorState.Default)
    this.$viewportState = new ViewportStateGPU()
    this.$vertexAttribArrayState = new VertexAttribArrayState(this)

    this.textureUnits.length = Number(24) // TODO:
    for (let i = 0; i < this.textureUnits.length; i++) {
      this.textureUnits[i] = new TextureUnitStateGPU(this, i)
    }

    this.initPromise = (async () => {
      this.set('glslang', await initGlslang())
      this.set('adapter', await navigator.gpu.requestAdapter({
        powerPreference: 'low-power',
      }))
      this.set('device', await this.adapter.requestDevice({
        //
      }))
      this.resize()
    })()
  }

  public init() {
    return this.initPromise
  }

  public begin() {
    this.flush()
    this.renderCommandEncoder = this.device.createCommandEncoder({
      label: 'loop',
    })
  }

  public flush() {
    if (this.renderPassEncoder) {
      this.renderPassEncoder.endPass()
      this.renderPassEncoder = null

      this.commandBuffers.length = 1
      this.commandBuffers[0] = this.renderCommandEncoder.finish()
      this.device.defaultQueue.submit(this.commandBuffers)
    }
  }

  /**
   * Clears the color, depth and stencil buffers
   */
  public clear(color?: number | number[] | Color, depth?: number, stencil?: number): this {
    this.begin()

    this.frameBuffer.setClearValues(color, depth, stencil)
    this.renderPassEncoder = this.renderCommandEncoder.beginRenderPass(this.frameBuffer.reanderPassDescriptor)
    return this
  }

  /**
   * Renders geometry using the current index buffer, indexing vertices of current vertex buffer.
   */
  public drawIndexedPrimitives(
    primitiveType?: PrimitiveType | PrimitiveTypeName,
    elementOffset?: number,
    elementCount?: number,
  ): this {
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

    elementOffset = (elementOffset || 0) * iBuffer.stride
    elementCount = elementCount || iBuffer.elementCount

    // TODO:
    this.renderEncoder.setIndexBuffer(iBuffer.handle)
    for (let i = 0; i < vBuffers.length; i++) {
      this.renderEncoder.setVertexBuffer(i, vBuffers[i].handle)
    }
    this.renderEncoder.setPipeline(this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [] }),
      vertexStage: program.vertexShader.descriptor,
      fragmentStage: program.fragmentShader.descriptor,
      primitiveTopology: 'triangle-list',
      colorStates: [{
        format: 'bgra8unorm' as GPUTextureFormat,
      }],
    }))
    this.renderEncoder.drawIndexed(elementCount, 1, elementOffset, 0, 0)
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
    const program = this.$program
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

    offset = offset || 0
    count = count || iBuffer.elementCount

    // TODO:
    this.renderEncoder.draw(count, instanceCount, offset, 0)
    return this
  }

  /**
   * Renders geometry defined by current vertex buffer and the given primitive type.
   */
  public drawPrimitives(primitiveType?: PrimitiveType | PrimitiveTypeName, offset?: number, count?: number): this {
    const vBuffer = this.$vertexBuffer
    const vBuffers = this.$vertexBuffers
    const program = this.$program
    if (!vBuffer && !vBuffers && !vBuffers.length) {
      throw new Error(`device.vertexBuffer or device.vertexBuffers must be set before calling drawPrimitives()`)
    }
    if (!program) {
      throw new Error(`device.program must be set before calling drawPrimitives()`)
    }

    count = count || (vBuffer || vBuffers[0]).elementCount
    offset = offset || 0
    // TODO:
    // this.renderEncoder.setIndexBuffer(iBuffer.handle)
    if (vBuffers) {
      for (let i = 0; i < vBuffers.length; i++) {
        this.renderEncoder.setVertexBuffer(i, vBuffers[i].handle)
      }
    } else if (vBuffer) {
      this.renderEncoder.setVertexBuffer(0, vBuffer.handle)
    }
    this.renderEncoder.setPipeline(this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [] }),
      vertexStage: program.vertexStageDescriptor,
      fragmentStage: program.fragmentStageDescriptor,
      primitiveTopology: toPrimitiveTopology(valueOfPrimitiveType(primitiveType)),
      colorStates: [{
        ...this.$blendState.gpuState,
        format: 'bgra8unorm' as GPUTextureFormat,
      }],
      depthStencilState: {
        ...this.$depthState.gpuState,
        format: 'depth24plus-stencil8',
      },
      rasterizationState: {
        ...this.$cullState.gpuState,
      },
      vertexState: {
        vertexBuffers: [{
          arrayStride: 4,
          attributes: [{
            // position
            shaderLocation: 0,
            offset: 0,
            format: 'float' as GPUVertexFormat,
          }],
        }],
      },
    }))
    this.renderEncoder.draw(count, 1, offset, 0)
    return this
  }

  /**
   * If the display size of the canvas is controlled with CSS this will resize the
   * canvas to match the CSS dimensions in order to avoid stretched and blurry image.
   *
   * @param ratio - The pixel ratio for retina displays
   */
  public resize(pixelRatio: number = window.devicePixelRatio || 1): this {
    const displayWidth = Math.floor(this.canvas.clientWidth * pixelRatio) || this.canvas.width
    const displayHeight = Math.floor(this.canvas.clientHeight * pixelRatio) || this.canvas.height
    const needsResize = this.canvas.width !== displayWidth || this.canvas.height !== displayHeight
    const needsCreate = this.swapChain == null

    if (!needsCreate || !needsResize) {
      return
    }

    this.canvas.width = displayWidth
    this.canvas.height = displayHeight
    this.set('swapChain', this.context.configureSwapChain({
      device: this.device,
      format: this.mainTextureFormat,
      usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    }))

    if (needsCreate) {
      this.set('mainTexture', this.createTexture2D({
        width: displayWidth,
        height: displayHeight,
        generateMipmap: false,
        pixelFormat: 'RGBA',
        pixelType: 'ubyte',
      }))
      this.set('mainDepth', this.createDepthBuffer({
        width: displayWidth,
        height: displayHeight,
        depthFormat: 'Depth24Stencil8',
      }))
      this.frameBuffer = new FrameBufferGPU(this, {
        textures: [this.mainTexture],
        depthBuffer: this.mainDepth,
      })
    } else if (needsResize) {
      this.mainTexture.setup({
        width: displayWidth,
        height: displayHeight,
      })
      this.mainDepth.init({
        width: displayWidth,
        height: displayHeight,
      })
      this.setRenderTarget(null)
    }

    const viewport = this.$viewportState
    viewport.x = 0
    viewport.y = 0
    viewport.width = displayWidth
    viewport.height = displayHeight
    viewport.commit()
    return this
  }

  public reset(): this {
    // TODO:
    return this
  }

  /**
   * Sets or un sets multiple render targets
   */
  public setRenderTargets(...targets: Texture[]): this
  public setRenderTargets(): this {
    let opts = this.frameBufferOptions
    opts.textures.length = arguments.length
    let firstTexture: Texture = null
    for (let i = 0; i < arguments.length; i++) {
      let argument = arguments[i]
      opts.textures[i] = argument
      if (argument instanceof Texture) {
        firstTexture = firstTexture || argument
      }
    }

    if (!firstTexture) {
      // no render targets set
      // use main texture and depth
      firstTexture = this.mainTexture
      opts.textures[0] = firstTexture
      opts.textures.length = 1
      opts.depthBuffer = this.mainDepth
    } else {
      // render targets are set
      // find a proper depth buffer
      opts.depthBuffer = this.getSharedDepthBuffer(firstTexture)
    }
    this.frameBuffer.init(opts)
    this.viewportState = {
      x: 0,
      y: 0,
      width: firstTexture.width,
      height: firstTexture.height,
    }
    return this
  }

  /**
   * Sets multiple vertex buffers
   *
   * @remarks
   * Restricts the `vertexBuffer` property to only this set of buffers.
   */
  public set vertexBuffers(buffer: Buffer[]) {
    this.$vertexBuffers = buffer as BufferGPU[]
    this.vertexBuffer = null
  }

  /**
   * Gets the currently active vertex buffer
   */
  public get vertexBuffer(): Buffer {
    return this.$vertexBuffer as BufferGPU
  }
  /**
   * Sets and activates a buffer as the currently active vertex buffer
   */
  public set vertexBuffer(buffer: Buffer) {
    this.$vertexBuffer = buffer as BufferGPU
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
    this.$indexBuffer = buffer as BufferGPU
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
    this.$program = program as ShaderProgramGPU
  }

  /**
   * Gets the current width of the drawing buffer
   */
  public get drawingBufferWidth() {
    return this.mainDepth.width
  }
  /**
   * Gets the current height of the drawing buffer
   */
  public get drawingBufferHeight() {
    return this.mainDepth.height
  }
  /**
   * Gets the aspect ratio of the drawing buffer
   */
  public get drawingBufferAspectRatio(): number {
    return this.mainDepth.width / this.mainDepth.height
  }

  /**
   * Creates a new Buffer of type IndexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public createIndexBuffer(options: BufferOptions): BufferGPU {
    options.type = 'IndexBuffer'
    options.dataType = options.dataType || 'ushort'
    return new BufferGPU(this, options)
  }

  /**
   * Creates a new Buffer of type VertexBuffer. Overrides the type option
   * before it calls the Buffer constructor with given options.
   */
  public createVertexBuffer(options: BufferOptions): BufferGPU {
    options.type = 'VertexBuffer'
    return new BufferGPU(this, options)
  }

  /**
   * Create a new Shader resource
   */
  public createShader(options: ShaderOptions): ShaderGPU {
    return new ShaderGPU(this, options)
  }

  /**
   * Creates a new ShaderProgram. Calls the ShaderProgram constructor with given options.
   */
  public createProgram(options: ShaderProgramOptions): ShaderProgramGPU {
    options.vertexShader = this.convertShaderOption(options.vertexShader)
    options.fragmentShader = this.convertShaderOption(options.fragmentShader)
    return new ShaderProgramGPU(this, options)
  }

  /**
   * Creates a new Texture. Calls the Texture constructor with given options.
   */
  public createTexture(options: TextureOptions): TextureGPU {
    return new TextureGPU(this, options)
  }

  /**
   * Creates a new Texture that can be used as a render target. Ensures that
   * the depthFormat option is set and calls the Texture constructor.
   */
  public createRenderTarget(options: TextureOptions): TextureGPU {
    options.depthFormat = options.depthFormat || 'None'
    return new TextureGPU(this, options)
  }

  /**
   * Creates a new Texture of type Texture2D. Overrides the type option
   * before it calls the Texture constructor with given options.
   */
  public createTexture2D(options: TextureOptions = {}): TextureGPU {
    options.type = 'Texture2D'
    return new TextureGPU(this, options)
  }

  /**
   * Creates a new Texture of type TextureCube. Overrides the type option
   * before it calls the Texture constructor with given options.
   */
  public createTextureCube(options: TextureOptions = {}): TextureGPU {
    options.type = 'TextureCube'
    return new TextureGPU(this, options)
  }
  /**
   * Creates a new sampler state object
   */
  public createSamplerState(options?: { texture?: Texture }): SamplerStateGPU {
    return new SamplerStateGPU(this)
  }

  public createDepthBuffer(options: DepthBufferOptions): DepthBufferGPU {
    return new DepthBufferGPU(this, options)
  }
}
