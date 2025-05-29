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
  TextureImage,
  TextureImageOptions,
  TextureOptions,
} from '../resources'
import {
  BlendState,
  CullState,
  DepthState,
  OffsetState,
  SamplerState,
  SamplerStateParams,
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
// import initGlslang, { Glslang } from '@webgpu/glslang/dist/web-devel-onefile/glslang'
import { Capabilities } from '../Capabilities'
import { VertexBuffer, VertexBufferOptions } from '../resources/VertexBuffer'
import { VertexBufferGPU } from './resources/VertexBufferGPU'
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
      Log.error('[Device]', `${name} is not supported`)
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

  public capabilities = new Capabilities() // TODO: add webgpu capabilities

  private readonly initPromise: Promise<void>

  /**
   * The web gpu api
   */
  public readonly device: GPUDevice
  public readonly adapter: GPUAdapter
  public readonly swapChain: GPUSwapChain
  // public readonly glslang: Glslang

  public readonly msaaSampleCount = 4

  protected _indexBuffer: BufferGPU
  protected _vertexBuffer: VertexBufferGPU
  protected _program: ShaderProgramGPU
  protected _cullState: CullStateGPU
  protected _blendState: BlendStateGPU
  protected _depthState: DepthStateGPU
  protected _offsetState: OffsetStateGPU
  protected _stencilState: StencilStateGPU
  protected _scissorState: ScissorStateGPU
  protected _viewportState: ViewportStateGPU

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

    this._cullState = new CullStateGPU().commit(CullState.Default)
    this._blendState = new BlendStateGPU().commit(BlendState.Default)
    this._depthState = new DepthStateGPU().commit(DepthState.Default)
    this._offsetState = new OffsetStateGPU().commit(OffsetState.Default)
    this._stencilState = new StencilStateGPU().commit(StencilState.Default)
    this._scissorState = new ScissorStateGPU().commit(ScissorState.Default)
    this._viewportState = new ViewportStateGPU()
    this.$vertexAttribArrayState = new VertexAttribArrayState(this)

    this.textureUnits.length = Number(24) // TODO:
    for (let i = 0; i < this.textureUnits.length; i++) {
      this.textureUnits[i] = new TextureUnitStateGPU(this, i)
    }

    this.initPromise = (async () => {
      if (!navigator.gpu) {
        throw new Error('WebGPU is not supported')
      }
      // this.set('glslang', await initGlslang())
      this.set(
        'adapter',
        await navigator.gpu.requestAdapter({
          powerPreference: 'low-power',
        }),
      )
      this.set(
        'device',
        await this.adapter.requestDevice({
          //
        }),
      )
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
    const iBuffer = this._indexBuffer
    if (!iBuffer) {
      throw new Error(`device.indexBuffer must be set before calling drawIndexedPrimitives()`)
    }

    const vBuffer = this._vertexBuffer
    if (!vBuffer) {
      throw new Error(`device.vertexBuffer or device.vertexBuffers must be set before calling drawIndexedPrimitives()`)
    }

    const program = this._program
    if (!program) {
      throw new Error(`device.program must be set before calling drawIndexedPrimitives()`)
    }

    elementOffset = (elementOffset || 0) * iBuffer.stride
    elementCount = elementCount || iBuffer.elementCount

    // TODO:
    this.renderEncoder.setIndexBuffer(iBuffer.resource)
    const vBuffers = vBuffer.buffers as BufferGPU[]
    for (let i = 0; i < vBuffers.length; i++) {
      this.renderEncoder.setVertexBuffer(i, vBuffers[i].resource)
    }
    this.renderEncoder.setPipeline(
      this.device.createRenderPipeline({
        layout: this.device.createPipelineLayout({ bindGroupLayouts: [] }),
        vertexStage: program.vertexShader.descriptor,
        fragmentStage: program.fragmentShader.descriptor,
        primitiveTopology: 'triangle-list',
        colorStates: [
          {
            format: 'bgra8unorm' as GPUTextureFormat,
          },
        ],
      }),
    )
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
    const iBuffer = this._indexBuffer
    if (!iBuffer) {
      throw new Error(`device.indexBuffer must be set before calling drawInstancedPrimitives()`)
    }

    const vBuffer = this._vertexBuffer
    if (!vBuffer) {
      throw new Error(
        `device.vertexBuffer or device.vertexBuffers must be set before calling drawInstancedPrimitives()`,
      )
    }

    const program = this._program
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
    const vBuffer = this._vertexBuffer
    if (!vBuffer) {
      throw new Error(`device.vertexBuffer or device.vertexBuffers must be set before calling drawPrimitives()`)
    }

    const program = this._program
    if (!program) {
      throw new Error(`device.program must be set before calling drawPrimitives()`)
    }

    count = count || vBuffer.buffers[0].elementCount
    offset = offset || 0
    // TODO:
    // this.renderEncoder.setIndexBuffer(iBuffer.handle)
    const vBuffers = vBuffer.buffers as BufferGPU[]
    for (let i = 0; i < vBuffers.length; i++) {
      this.renderEncoder.setVertexBuffer(i, vBuffers[i].resource)
    }
    this.renderEncoder.setPipeline(
      this.device.createRenderPipeline({
        layout: this.device.createPipelineLayout({ bindGroupLayouts: [] }),
        vertexStage: program.vertexStageDescriptor,
        fragmentStage: program.fragmentStageDescriptor,
        primitiveTopology: toPrimitiveTopology(valueOfPrimitiveType(primitiveType)),
        colorStates: [
          {
            ...this._blendState.gpuState,
            format: 'bgra8unorm' as GPUTextureFormat,
          },
        ],
        depthStencilState: {
          ...this._depthState.gpuState,
          format: 'depth24plus-stencil8',
        },
        rasterizationState: {
          ...this._cullState.gpuState,
        },
        vertexState: {
          vertexBuffers: [
            {
              arrayStride: 4,
              attributes: [
                {
                  // position
                  shaderLocation: 0,
                  offset: 0,
                  format: 'float' as GPUVertexFormat,
                },
              ],
            },
          ],
        },
      }),
    )
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
    this.set(
      'swapChain',
      this.context.configureSwapChain({
        device: this.device,
        format: this.mainTextureFormat,
        usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      }),
    )

    if (needsCreate) {
      this.set(
        'mainTexture',
        this.createTextureImage({
          type: 'Texture2D',
          width: displayWidth,
          height: displayHeight,
          generateMipmap: false,
          pixelFormat: 'RGBA',
          pixelType: 'byte',
        }),
      )
      this.set(
        'mainDepth',
        this.createDepthBuffer({
          width: displayWidth,
          height: displayHeight,
          depthFormat: 'Depth24Stencil8',
        }),
      )
      this.frameBuffer = new FrameBufferGPU(this, {
        textures: [this.mainTexture],
        depthBuffer: this.mainDepth,
      })
    } else if (needsResize) {
      this.mainTexture.setup({
        width: displayWidth,
        height: displayHeight,
        type: 'Texture2D',
      })
      this.mainDepth.reset({
        width: displayWidth,
        height: displayHeight,
      })
      this.setRenderTarget(null)
    }

    const viewport = this._viewportState
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
  public setRenderTargets(...targets: TextureImage[]): this
  public setRenderTargets(): this {
    let opts = this.frameBufferOptions
    opts.textures.length = arguments.length
    let firstTexture: TextureImage = null
    for (let i = 0; i < arguments.length; i++) {
      let argument = arguments[i]
      opts.textures[i] = argument
      if (argument instanceof TextureImage) {
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
    this.frameBuffer.reset(opts)
    this.viewportState = {
      x: 0,
      y: 0,
      width: firstTexture.width,
      height: firstTexture.height,
    }
    return this
  }

  /**
   * Gets the currently active vertex buffer
   */
  public get vertexBuffer(): VertexBuffer {
    return this._vertexBuffer as VertexBufferGPU
  }
  /**
   * Sets and activates a buffer as the currently active vertex buffer
   */
  public set vertexBuffer(buffer: VertexBuffer) {
    this._vertexBuffer = buffer as VertexBufferGPU
  }

  /**
   * Gets the currently active index buffer
   */
  public get indexBuffer(): Buffer {
    return this._indexBuffer
  }
  /**
   * Sets and activates a buffer as the currently active index buffer
   */
  public set indexBuffer(buffer: Buffer) {
    this._indexBuffer = buffer as BufferGPU
  }

  /**
   * Gets the currently active shader program
   */
  public get program(): ShaderProgram {
    return this._program
  }
  /**
   * Sets and activates a program as the currently active program
   */
  public set program(program: ShaderProgram) {
    this._program = program as ShaderProgramGPU
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
  public createVertexBuffer(options: VertexBufferOptions): VertexBufferGPU {
    return new VertexBufferGPU(this, options)
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
    return new ShaderProgramGPU(this, options)
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
    options.depthFormat ||= 'None'
    options.sampler ||= SamplerState.LinearClamp
    return new Texture(this, options)
  }

  /**
   * Creates a new Texture. Calls the Texture constructor with given options.
   */
  public createTextureImage(options: TextureImageOptions): TextureGPU {
    return new TextureGPU(this, options)
  }

  /**
   * Creates a new sampler state object
   */
  public createSamplerState(options?: SamplerStateParams): SamplerStateGPU {
    options = SamplerState.fillDefaults(options)
    return new SamplerStateGPU(this, options)
  }

  public createDepthBuffer(options: DepthBufferOptions): DepthBufferGPU {
    return new DepthBufferGPU(this, options)
  }
}
