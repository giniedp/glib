import { Mat4 } from '@gglib/math'
import { getOption } from '@gglib/utils'
import { Device } from './Device'
import { BufferUsage, PrimitiveType } from './enums'
import { Buffer } from './resources/Buffer'
import { ShaderProgram } from './resources/ShaderProgram'
import { Texture } from './resources/Texture'
import { Sprite } from './Sprite'
import { BlendStateParams } from './states/BlendState'
import { CullStateParams } from './states/CullState'
import { DepthStateParams } from './states/DepthState'
import { ScissorStateParams } from './states/ScissorState'
import { StencilStateParams } from './states/StencilState'
import { ViewportStateParams } from './states/ViewportState'
import { VertexLayout } from './VertexLayout'

const vShader = `
  precision highp float;
  precision highp int;

  // @binding position
  attribute vec3 vPosition;
  // @binding texture
  attribute vec2 vTexture;
  // @binding color
  // @default [1,0,0,1]
  attribute vec4 vColor;

  // @binding ViewProjection
  uniform mat4 uViewProjection;

  varying vec2 texCoord;
  varying vec4 texColor;

  void main(void) {
    texColor = vColor;
    texCoord = vTexture;
    gl_Position = uViewProjection * vec4(vPosition, 1);
  }`

const fShader = `
  precision highp float;
  precision highp int;

  // @binding Texture
  // @register 0
  // @filter LinearWrap
  uniform sampler2D uSampler;

  varying vec2 texCoord;
  varying vec4 texColor;

  void main(void) {
    gl_FragColor = texture2D(uSampler, texCoord) * texColor;
  }`

/**
 * Constructor options for {@link SpriteBatch}
 *
 * @public
 */
export interface SpriteBatchOptions {
  /**
   * The maximum number of sprites this batch should handle in one draw call
   */
  batchSize?: number
  /**
   * A custom shader that should be used for rendering the sprites
   */
  program?: ShaderProgram
}

/**
 * Options for {@link SpriteBatch.begin}
 *
 * @public
 */
export interface SpriteBatchBeginOptions {
  sortMode?: any
  /**
   * The blend state
   */
  blendState?: BlendStateParams
  /**
   * The cull state
   */
  cullState?: CullStateParams
  /**
   * The depth state
   */
  depthState?: DepthStateParams
  /**
   * The stencil state
   */
  stencilState?: StencilStateParams
  /**
   * The scissor state
   */
  scissorState?: ScissorStateParams
  /**
   * The viewport state
   */
  viewportState?: ViewportStateParams
  /**
   * The viewProjection matrix to use for rendering
   */
  viewProjection?: Mat4,
  /**
   * A custom shader that should be used for rendering the sprites
   */
  program?: ShaderProgram
}

/**
 * @public
 */
export class SpriteBatch {
  private device: Device
  private hasBegun: boolean
  private spriteQueue: Sprite[]

  private arrayBuffer: ArrayBuffer
  private vertexPositionView: Float32Array
  private vertexTextureView: Float32Array
  private vertexColorView: Int32Array
  private vertexBuffer: Buffer
  private indexBuffer: Buffer
  private mainProgram: ShaderProgram
  private mainMatrix: Mat4
  private program: ShaderProgram
  private matrix: Mat4

  private blendState: BlendStateParams
  private cullState: CullStateParams
  private depthState: DepthStateParams
  private stencilState: StencilStateParams
  private scissorState: ScissorStateParams
  private viewportState: ViewportStateParams
  private sortMode: any
  private batchSize: number
  private spritePool: Sprite[] = []

  constructor(device: Device, options: SpriteBatchOptions = {}) {
    this.device = device
    this.hasBegun = false
    this.spriteQueue = []
    this.batchSize = options.batchSize || 512

    const vertexLayout = VertexLayout.create('PositionTextureColor')
    const sizeInBytes = VertexLayout.countBytes(vertexLayout)

    this.arrayBuffer = new ArrayBuffer(this.batchSize * 4 * sizeInBytes)
    this.vertexPositionView = new Float32Array(this.arrayBuffer)
    this.vertexTextureView = new Float32Array(this.arrayBuffer)
    this.vertexColorView = new Int32Array(this.arrayBuffer)
    this.vertexBuffer = device.createVertexBuffer({
      layout: vertexLayout,
      data: this.arrayBuffer,
      usage: BufferUsage.Dynamic,
    })
    this.mainProgram = options.program || device.createProgram({
      vertexShader: vShader,
      fragmentShader: fShader,
    })
    this.mainMatrix = Mat4.createIdentity()
    const indexData = new Uint16Array(this.batchSize * 6)
    let index = 0
    for (let i = 0; i < indexData.length; i += 6, index += 4) {
      indexData[i] = index
      indexData[i + 1] = index + 1
      indexData[i + 2] = index + 2

      indexData[i + 3] = index + 1
      indexData[i + 4] = index + 3
      indexData[i + 5] = index + 2
    }

    this.indexBuffer = device.createIndexBuffer({
      data: indexData,
    })
  }

  public begin(options?: SpriteBatchBeginOptions) {
    if (this.hasBegun) {
      throw new Error('end() must be called before a new batch can be started with begin()')
    }

    this.sortMode = getOption(options, 'sortMode', undefined)
    this.blendState = getOption(options, 'blendState', undefined)
    this.cullState = getOption(options, 'cullState', undefined)
    this.depthState = getOption(options, 'depthState', undefined)
    this.stencilState = getOption(options, 'stencilState', undefined)
    this.scissorState = getOption(options, 'scissorState', undefined)
    this.viewportState = getOption(options, 'viewportState', undefined)
    this.program = getOption(options, 'program', this.mainProgram)
    this.matrix = getOption(options, 'viewProjection', this.mainMatrix)

    const viewWidth = (this.viewportState || this.device.viewportState).width
    const viewHeight = (this.viewportState || this.device.viewportState).height
    this.mainMatrix.initOrthographicOffCenter(0, viewWidth, viewHeight, 0, 0, 1)

    this.hasBegun = true
  }

  /**
   * @param texture - The texture to draw
   */
  public draw(texture: Texture): Sprite {

    if (!this.hasBegun) {
      throw new Error('begin() must be called before draw()')
    }
    if (!texture) {
      throw new Error('no texture given')
    }

    const sprite = this.spritePool.pop() || new Sprite()
    sprite.reset(texture)
    this.spriteQueue.push(sprite)
    return sprite
  }

  public end() {
    if (!this.hasBegun) {
      throw new Error('begin() must be called before end()')
    }

    this.commitRenderState()
    this.drawBatch()

    for (let sprite of this.spriteQueue) {
      this.spritePool.push(sprite)
    }
    this.spriteQueue.length = 0
    this.hasBegun = false
  }

  private commitRenderState() {
    let device = this.device

    if (this.blendState) {
      device.blendState = this.blendState
    }
    if (this.cullState) {
      device.cullState = this.cullState
    }
    if (this.depthState) {
      device.depthState = this.depthState
    }
    if (this.stencilState) {
      device.stencilState = this.stencilState
    }
    if (this.scissorState) {
      device.scissorState = this.scissorState
    }
    if (this.viewportState) {
      device.viewportState = this.viewportState
    }
  }

  private drawBatch() {
    let start = 0
    let texture = null
    let queue = this.spriteQueue

    this.device.indexBuffer = this.indexBuffer
    this.device.vertexBuffer = this.vertexBuffer
    this.device.program = this.program

    for (let i = 0; i < queue.length; i++) {
      if (texture !== queue[i].texture) {
        if (i > start) {
          this.device.program.setUniform('Texture', texture)
          this.device.program.setUniform('ViewProjection', this.matrix)
          this.drawSlice(start, i - start)
        }
        texture = queue[i].texture
        start = i
      }
    }
    if (queue.length > 0 && texture) {
      this.device.program.setUniform('Texture', texture)
      this.device.program.setUniform('ViewProjection', this.matrix)
      this.drawSlice(start, queue.length - start)
    }
  }

  private drawSlice(start: number, length: number) {
    if (length === 0) {
      return
    }

    const queue = this.spriteQueue
    const end = start + length
    while (start < end) {
      let count = end - start
      count = count > this.batchSize ? this.batchSize : count

      let offset = 0
      for (let i = 0; i < count; i ++) {
        const sprite = queue[start + i]
        // position
        this.vertexPositionView[offset++] = sprite.vertex1.x
        this.vertexPositionView[offset++] = sprite.vertex1.y
        this.vertexPositionView[offset++] = sprite.vertex1.z
        // texture
        this.vertexTextureView[offset++] = sprite.uv1.x
        this.vertexTextureView[offset++] = sprite.uv1.y
        // color
        this.vertexColorView[offset++] = sprite.color

        // position
        this.vertexPositionView[offset++] = sprite.vertex2.x
        this.vertexPositionView[offset++] = sprite.vertex2.y
        this.vertexPositionView[offset++] = sprite.vertex2.z
        // texture
        this.vertexTextureView[offset++] = sprite.uv2.x
        this.vertexTextureView[offset++] = sprite.uv1.y
        // color
        this.vertexColorView[offset++] = sprite.color

        // position
        this.vertexPositionView[offset++] = sprite.vertex3.x
        this.vertexPositionView[offset++] = sprite.vertex3.y
        this.vertexPositionView[offset++] = sprite.vertex3.z
        // texture
        this.vertexTextureView[offset++] = sprite.uv1.x
        this.vertexTextureView[offset++] = sprite.uv2.y
        // color
        this.vertexColorView[offset++] = sprite.color

        // position
        this.vertexPositionView[offset++] = sprite.vertex4.x
        this.vertexPositionView[offset++] = sprite.vertex4.y
        this.vertexPositionView[offset++] = sprite.vertex4.z
        // texture
        this.vertexTextureView[offset++] = sprite.uv2.x
        this.vertexTextureView[offset++] = sprite.uv2.y
        // color
        this.vertexColorView[offset++] = sprite.color
      }
      start += count
      this.vertexBuffer.setSubData(0, this.arrayBuffer)
      this.device.drawIndexedPrimitives(PrimitiveType.TriangleList, 0, count * 6)
    }
  }
}
