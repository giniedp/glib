import { IVec3, Mat4 } from '@gglib/math'
import { Device } from './Device'
import { PrimitiveType } from './enums'
import { Program, VertexBuffer } from './resources'
import { BlendState, CullState, DepthState, ScissorState, StencilState, ViewportState } from './states'
import { countBytes, createVertexLayout } from './VertexLayout'

const vertexShader = /* glsl */ `
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

const fragmentShader = /* glsl */ `
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
  program?: Program
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
  blendState?: BlendState
  /**
   * The cull state
   */
  cullState?: CullState
  /**
   * The depth state
   */
  depthState?: DepthState
  /**
   * The stencil state
   */
  stencilState?: StencilState
  /**
   * The scissor state
   */
  scissorState?: ScissorState
  /**
   * The viewport state
   */
  viewportState?: ViewportState
  /**
   * The viewProjection matrix to use for rendering
   */
  viewProjection?: Mat4
  /**
   * A custom shader that should be used for rendering the sprites
   */
  program?: Program
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
  private vertexBuffer: VertexBuffer
  private mainProgram: Program
  private mainMatrix: Mat4
  private program: Program
  private matrix: Mat4

  private blendState: BlendState
  private cullState: CullState
  private depthState: DepthState
  private stencilState: StencilState
  private scissorState: ScissorState
  private viewportState: ViewportState

  private batchSize: number
  private primitiveType: PrimitiveType
  private verticesPerPrimitive: number
  private vertexIndex: number
  private vertexCount: number

  constructor(device: Device, options: PrimitiveBatchOptions = {}) {
    this.device = device
    this.hasBegun = false
    this.batchSize = options?.batchSize ?? 512
    this.primitiveType = options?.primitiveType ?? 'TriangleList'

    const vertexLayout = createVertexLayout(['position', 'color'])
    const sizeInBytes = countBytes(vertexLayout)

    this.arrayBuffer = new ArrayBuffer(this.batchSize * sizeInBytes)
    this.vertexPositionView = new Float32Array(this.arrayBuffer)
    this.vertexColorView = new Int32Array(this.arrayBuffer)
    this.vertexBuffer = device.createVertexBuffer([
      {
        vertexLayout: vertexLayout,
        data: this.arrayBuffer,
      },
    ])
    this.mainProgram =
      options.program ||
      device.acquireShaderModule({
        glsl: {
          vertex: vertexShader,
          fragment: fragmentShader,
        },
      }).program
    this.mainMatrix = Mat4.createIdentity()
  }
  public begin(options?: PrimitiveBatchBeginOptions) {
    if (this.hasBegun) {
      throw new Error('end() must be called before a new batch can be started with begin()')
    }

    if (options) {
      this.blendState = options.blendState ?? null
      this.cullState = options.cullState ?? null
      this.depthState = options.depthState ?? null
      this.stencilState = options.stencilState ?? null
      this.scissorState = options.scissorState ?? null
      this.viewportState = options.viewportState ?? null
      this.program = options.program ?? this.mainProgram
      this.matrix = options.viewProjection ?? this.mainMatrix
      this.primitiveType = options.primitiveType ?? this.primitiveType
    }
    switch (this.primitiveType) {
      case 'PointList':
        this.verticesPerPrimitive = 1
        break
      case 'LineList':
        this.verticesPerPrimitive = 2
        break
      case 'LineStrip':
        this.verticesPerPrimitive = 1
        break
      case 'TriangleList':
        this.verticesPerPrimitive = 3
        break
      case 'TriangleStrip':
        this.verticesPerPrimitive = 1
        break
      default:
        throw new Error(`PrimitiveType '${this.primitiveType}' is not supported`)
    }

    const viewWidth = this.viewportState?.width || this.device.output.width
    const viewHeight = this.viewportState?.height || this.device.output.height
    this.mainMatrix.initOrthographicOffCenter(0, viewWidth, viewHeight, 0, 0, 1, this.device.ndcMinZ)

    this.vertexIndex = 0
    this.vertexCount = 0
    this.hasBegun = true
  }

  public addVertex(position: IVec3, color: number) {
    if (!this.hasBegun) {
      throw new Error('begin() must be called before addVertex()')
    }
    if (
      this.vertexCount + this.verticesPerPrimitive >= this.batchSize &&
      this.vertexIndex % this.verticesPerPrimitive === 0
    ) {
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

      // TODO:
      // if (this.blendState) {
      //   device.blendState = this.blendState
      // }
      // if (this.cullState) {
      //   device.cullState = this.cullState
      // }
      // if (this.depthState) {
      //   device.depthState = this.depthState
      // }
      // if (this.stencilState) {
      //   device.stencilState = this.stencilState
      // }
      // if (this.scissorState) {
      //   device.scissorState = this.scissorState
      // }
      // if (this.viewportState) {
      //   device.viewportState = this.viewportState
      // }

      // device.indexBuffer = null
      // device.vertexBuffer = this.vertexBuffer
      // device.program = this.program

      // device.program.setUniform('ViewProjection', this.matrix)
      // device.drawPrimitives(this.primitiveType, 0, this.vertexCount)
      // this.vertexIndex = 0
      // this.vertexCount = 0
    }
  }
}
