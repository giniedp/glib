import { IVec3, Mat4 } from '@gglib/math'
import { getOption } from '@gglib/utils'
import { Device } from './Device'
import { BufferUsage, nameOfPrimitiveType, PrimitiveType } from './enums'
import { Buffer, ShaderProgram } from './resources'
import { BlendStateParams, CullStateParams, DepthStateParams, ScissorStateParams, StencilStateParams, ViewportStateParams } from './states'
import { VertexLayout } from './VertexLayout'

const vShader = `
  precision highp float;
  precision highp int;

  // @binding position
  attribute vec3 vPosition;
  // @binding color
  // @default [1,0,0,1]
  attribute vec4 vColor;

  // @binding ViewProjection
  uniform mat4 uViewProjection;

  varying vec4 color;

  void main(void) {
    color = vColor;
    gl_Position = uViewProjection * vec4(vPosition, 1);
  }
`

const fShader = `
  precision highp float;
  precision highp int;

  varying vec4 color;

  void main(void) {
    gl_FragColor = color;
  }
`

/**
 * Constructor options for {@link SpriteBatch}
 *
 * @public
 */
export interface PrimitiveBatchOptions {
  /**
   * The maximum number of vertices this batch should handle in one draw call
   */
  batchSize?: number
  /**
   * A custom shader that should be used for rendering the sprites
   */
  program?: ShaderProgram
  /**
   * The primitive type to draw with this batch
   */
  primitiveType?: PrimitiveType
}

/**
 * Options for {@link SpriteBatch.begin}
 *
 * @public
 */
export interface PrimitiveBatchBeginOptions {
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
  viewProjection?: Mat4
  /**
   * A custom shader that should be used for rendering the sprites
   */
  program?: ShaderProgram
  /**
   * The primitive type to draw with this batch
   */
  primitiveType?: PrimitiveType
}

export class PrimitiveBatch {
  private device: Device
  private hasBegun: boolean

  private arrayBuffer: ArrayBuffer
  private vertexPositionView: Float32Array
  private vertexColorView: Int32Array
  private vertexBuffer: Buffer
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

  private batchSize: number
  private primitiveType: PrimitiveType
  private verticesPerPrimitive: number
  private vertexIndex: number
  private vertexCount: number

  constructor(device: Device, options: PrimitiveBatchOptions = {}) {
    this.device = device
    this.hasBegun = false
    this.batchSize = getOption(options, 'batchSize', 512)
    this.primitiveType = getOption(options, 'primitiveType', PrimitiveType.TriangleList)

    const vertexLayout = VertexLayout.create('PositionColor')
    const sizeInBytes = VertexLayout.countBytes(vertexLayout)

    this.arrayBuffer = new ArrayBuffer(this.batchSize * sizeInBytes)
    this.vertexPositionView = new Float32Array(this.arrayBuffer)
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
  }
  public begin(options?: PrimitiveBatchBeginOptions) {
    if (this.hasBegun) {
      throw new Error('end() must be called before a new batch can be started with begin()')
    }

    if (options) {
      this.blendState = getOption(options, 'blendState', null)
      this.cullState = getOption(options, 'cullState', null)
      this.depthState = getOption(options, 'depthState', null)
      this.stencilState = getOption(options, 'stencilState', null)
      this.scissorState = getOption(options, 'scissorState', null)
      this.viewportState = getOption(options, 'viewportState', null)
      this.program = getOption(options, 'program', this.mainProgram)
      this.matrix = getOption(options, 'viewProjection', this.mainMatrix)
      this.primitiveType = getOption(options, 'primitiveType', this.primitiveType)
    }
    switch (this.primitiveType) {
      case PrimitiveType.PointList:
        this.verticesPerPrimitive = 1
        break
      case PrimitiveType.LineList:
        this.verticesPerPrimitive = 2
        break
      case PrimitiveType.LineStrip:
        this.verticesPerPrimitive = 1
        break
      case PrimitiveType.TriangleList:
        this.verticesPerPrimitive = 3
        break
      case PrimitiveType.TriangleStrip:
        this.verticesPerPrimitive = 1
        break
      default:
        throw new Error(`PrimitiveType '${nameOfPrimitiveType(this.primitiveType)}' is not supported`)
    }

    const viewWidth = (this.viewportState || this.device.viewportState).width
    const viewHeight = (this.viewportState || this.device.viewportState).height
    this.mainMatrix.initOrthographicOffCenter(0, viewWidth, viewHeight, 0, 0, 1)

    this.vertexIndex = 0
    this.vertexCount = 0
    this.hasBegun = true
  }

  public addVertex(position: IVec3, color: number) {
    if (!this.hasBegun) {
      throw new Error('begin() must be called before addVertex()')
    }
    if (this.vertexCount + this.verticesPerPrimitive >= this.batchSize && (this.vertexIndex % this.verticesPerPrimitive) === 0) {
      this.drawBatch()
    }
    this.vertexPositionView[this.vertexIndex++] = position.x
    this.vertexPositionView[this.vertexIndex++] = position.y
    this.vertexPositionView[this.vertexIndex++] = position.z
    this.vertexColorView[this.vertexIndex++] = color
    this.vertexCount++
  }

  public end() {
    if (!this.hasBegun) {
      throw new Error('begin() must be called before end()')
    }
    this.drawBatch()
    this.hasBegun = false
  }

  private drawBatch() {
    if (this.vertexCount) {
      const device = this.device

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

      device.indexBuffer = null
      device.vertexBuffer = this.vertexBuffer
      device.program = this.program

      device.program.setUniform('ViewProjection', this.matrix)
      device.drawPrimitives(this.primitiveType, 0, this.vertexCount)
      this.vertexIndex = 0
      this.vertexCount = 0
    }
  }
}
