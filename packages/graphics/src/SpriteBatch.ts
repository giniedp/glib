// tslint:disable max-classes-per-file

import { IRect, IVec2 } from '@gglib/math'
import { Buffer } from './Buffer'
import { Color } from './Color'
import { Device } from './Device'
import { BufferUsage, PrimitiveType } from './enums'
import { ShaderProgram } from './ShaderProgram'
import { BlendState, BlendStateParams } from './states/BlendState'
import { CullState, CullStateParams } from './states/CullState'
import { DepthState, DepthStateParams } from './states/DepthState'
import { ScissorState, ScissorStateParams } from './states/ScissorState'
import { StencilState, StencilStateParams } from './states/StencilState'
import { ViewportState, ViewportStateParams } from './states/ViewportState'
import { Texture } from './Texture'
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

  varying vec2 texCoord;
  varying vec4 texColor;

  void main(void) {
    texColor = vColor;
    texCoord = vTexture;
    vec2 pos = vPosition.xy * vec2(2, -2) + vec2(-1, 1);
    gl_Position = vec4(pos.xy, vPosition.z, 1);
  }`

const fShader = `
  precision highp float;
  precision highp int;

  // @binding texture
  // @register 0
  // @filter LinearWrap
  uniform sampler2D textureSampler;

  varying vec2 texCoord;
  varying vec4 texColor;

  void main(void) {
    gl_FragColor = texture2D(textureSampler, texCoord) * texColor;
  }`

let spritePool: Sprite[] = []

/**
 * SpriteBatch constructor options
 *
 * @public
 */
export interface SpriteBatchOptions {
  batchSize?: number
}

/**
 *
 * @public
 */
export interface SpriteBatchBeginOptions {
  sortMode?: any
  blendState?: BlendStateParams
  cullState?: CullStateParams
  depthState?: DepthStateParams
  stencilState?: StencilStateParams
  scissorState?: ScissorStateParams
  viewportState?: ViewportStateParams
}

/**
 * Describes a single sprite
 *
 * @public
 */
export interface Sprite {
  /**
   * The texture being used with the sprite
   */
  texture?: Texture
  /**
   * The tint color of the sprite
   */
  color?: number|Color

  /**
   * X coordinate of the source rectangle of the texture
   */
  srcX?: number
  /**
   * Y coordinate of the source rectangle of the texture
   */
  srcY?: number
  /**
   * Width of the source rectangle of the texture
   */
  srcWidth?: number
  /**
   * Height of the source rectangle of the texture
   */
  srcHeight?: number

  /**
   * X destination on screen
   */
  dstX?: number
  /**
   * Y destination on screen
   */
  dstY?: number
  /**
   * Resulting width on screen
   */
  dstWidth?: number
  /**
   * Resulting height on screen
   */
  dstHeight?: number

  /**
   * Rotation of the sprate
   */
  rotation?: number
  /**
   * The rotation origin
   */
  originX?: number
  /**
   * The rotation origin
   */
  originY?: number

  /**
   * The depth at which the sprite is rendered
   */
  depth?: number
  /**
   * Whether the texture should be flipped on X axis
   */
  flipX?: boolean
  /**
   * Whether the texture should be flipped on Y axis
   */
  flipY?: boolean
}

/**
 * @public
 */
export class SpriteBuilder {
  private sprite: Sprite

  public setup(sprite: Sprite) {
    this.sprite = sprite
    sprite.color = 0xFFFFFFFF

    sprite.srcX = 0
    sprite.srcY = 0
    sprite.srcWidth = 0
    sprite.srcHeight = 0

    sprite.dstX = 0
    sprite.dstY = 0
    sprite.dstWidth = 0
    sprite.dstHeight = 0

    sprite.originX = 0
    sprite.originY = 0
    sprite.rotation = 0
    sprite.depth = 0
    sprite.flipX = false
    sprite.flipY = false
  }

  public color(color: number|Color): SpriteBuilder {
    this.sprite.color = color
    return this
  }

  public alpha(alpha: number): SpriteBuilder {
    let color = this.sprite.color as number
    if (color == null) {
      color = 0xFFFFFFFF
    }
    this.sprite.color = (color & 0x00FFFFFF) | (((alpha * 255) & 0xFF) << 24) // tslint:disable-line
    return this
  }

  public source(x: number, y: number, width?: number, height?: number): SpriteBuilder {
    let s = this.sprite
    s.srcX = x
    s.srcY = y
    s.srcWidth = width
    s.srcHeight = height
    return this
  }

  public sourceVec(vec: IVec2) {
    let s = this.sprite
    s.srcX = vec.x
    s.srcY = vec.y
    return this
  }

  public sourceRect(rect: IRect) {
    return this.source(rect.x, rect.y, rect.width, rect.height)
  }

  public destination(x: number, y: number, width?: number, height?: number): SpriteBuilder {
    let s = this.sprite
    s.dstX = x
    s.dstY = y
    s.dstWidth = width
    s.dstHeight = height
    return this
  }

  public destinationVec(vec: IVec2) {
    let s = this.sprite
    s.dstX = vec.x
    s.dstY = vec.y
    return this
  }

  public destinationRect(rect: IRect) {
    return this.destination(rect.x, rect.y, rect.width, rect.height)
  }

  public origin(x: number, y: number): SpriteBuilder {
    let s = this.sprite
    s.originX = x
    s.originY = y
    return this
  }

  public rotation(rotation: number): SpriteBuilder {
    this.sprite.rotation = rotation
    return this
  }

  public depth(depth: number): SpriteBuilder {
    this.sprite.depth = depth
    return this
  }

  public flip(x: boolean, y: boolean): SpriteBuilder {
    let s = this.sprite
    s.flipX = x
    s.flipY = y
    return this
  }
}

/**
 * @public
 */
export class SpriteBatch {
  private device: Device
  private gl: any
  private hasBegun: boolean
  private spriteQueue: Sprite[]

  private arrayBuffer: ArrayBuffer
  private positionTextureView: Float32Array
  private colorBufferView: Uint32Array
  private vertexBuffer: Buffer
  private indexBuffer: Buffer
  private program: ShaderProgram

  private blendState: BlendStateParams
  private cullState: CullStateParams
  private depthState: DepthStateParams
  private stencilState: StencilStateParams
  private scissorState: ScissorStateParams
  private viewportState: ViewportStateParams
  private sortMode: any
  private batchSize: number
  private batchPosition: number
  private builder: SpriteBuilder = new SpriteBuilder()

  constructor(device: Device, options: SpriteBatchOptions = {}) {
    this.device = device
    this.gl = device.context
    this.hasBegun = false
    this.spriteQueue = []
    this.batchSize = options.batchSize || 512
    this.batchPosition = 0

    let vertexLayout = VertexLayout.create('PositionTextureColor')
    let sizeInBytes = VertexLayout.countBytes(vertexLayout)

    this.arrayBuffer = new ArrayBuffer(this.batchSize * 4 * sizeInBytes)
    this.positionTextureView = new Float32Array(this.arrayBuffer)
    this.colorBufferView = new Uint32Array(this.arrayBuffer)
    this.vertexBuffer = device.createVertexBuffer({
      layout: vertexLayout,
      data: this.positionTextureView,
      usage: BufferUsage.Dynamic,
    })
    this.program = device.createProgram({
      vertexShader: vShader,
      fragmentShader: fShader,
    })
    let data = new Uint16Array(this.batchSize * 6)
    let index = 0
    for (let i = 0; i < data.length; i += 6, index += 4) { // tslint:disable-line
      data[i] = index
      data[i + 1] = index + 1
      data[i + 2] = index + 3

      data[i + 3] = index
      data[i + 4] = index + 3
      data[i + 5] = index + 2
    }

    this.indexBuffer = device.createIndexBuffer({
      data: data,
    })
  }

  public begin(options?: SpriteBatchBeginOptions) {
    if (this.hasBegun) {
      throw new Error('end() must be called before a new batch can be started with begin()')
    }
    this.sortMode = void 0
    this.blendState = void 0
    this.cullState = void 0
    this.depthState = void 0
    this.stencilState = void 0
    this.scissorState = void 0
    this.viewportState = void 0
    if (options) {
      this.sortMode = options.sortMode
      this.blendState = options.blendState
      this.cullState = options.cullState
      this.depthState = options.depthState
      this.stencilState = options.stencilState
      this.scissorState = options.scissorState
      this.viewportState = options.viewportState
    }
    this.hasBegun = true
  }

  /**
   * @param texture - The texture to draw
   */
  public draw(texture: Texture): SpriteBuilder {

    if (!this.hasBegun) {
      throw new Error('begin() must be called before draw()')
    }
    if (!texture) {
      throw new Error('no texture given')
    }

    let sprite = spritePool.pop() || {}
    sprite.texture = texture
    let builder = this.builder
    builder.setup(sprite)
    this.spriteQueue.push(sprite)
    return builder
  }

  public end() {
    if (!this.hasBegun) {
      throw new Error('begin() must be called before end()')
    }

    this.commitRenderState()
    this.drawBatch()

    for (let sprite of this.spriteQueue) {
      spritePool.push(sprite)
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

  private buildSprites() {
    let queue = this.spriteQueue
    for (const sprite of queue) {
      let tW = sprite.texture.width
      let tH = sprite.texture.height
      let sX = sprite.srcX || 0
      let sY = sprite.srcY || 0
      let sW = sprite.srcWidth || (tW - sX)
      let sH = sprite.srcHeight || (tH - sY)

      sprite.srcX = sX
      sprite.srcY = sY
      sprite.srcWidth = sW
      sprite.srcHeight = sH

      sprite.dstX = sprite.dstX || 0
      sprite.dstY = sprite.dstY || 0
      sprite.dstWidth = sprite.dstWidth || sW
      sprite.dstHeight = sprite.dstHeight || sH

      sprite.rotation = sprite.rotation || 0
      sprite.originX = sprite.originX || 0
      sprite.originY = sprite.originY || 0

      sprite.depth = sprite.depth || 0
      sprite.flipX = !!sprite.flipX
      sprite.flipY = !!sprite.flipY

      let color = sprite.color as any
      if (color instanceof Color) {
        sprite.color = color.rgba
      } else if (typeof color === 'number') {
        sprite.color = color
      } else {
        sprite.color = 0xFFFFFFFF
      }
    }
  }

  private drawBatch() {
    let start = 0
    let texture = null
    let queue = this.spriteQueue
    this.buildSprites()
    this.device.indexBuffer = this.indexBuffer
    this.device.vertexBuffer = this.vertexBuffer
    this.device.program = this.program

    for (let i = 0; i < queue.length; i++) {
      if (texture !== queue[i].texture) {
        if (i > start) {
          this.device.program.setUniform('texture', texture)
          this.drawSlice(start, i - start)
        }
        texture = queue[i].texture
        start = i
      }
    }
    if (queue.length > 0 && texture) {
      this.device.program.setUniform('texture', texture)
      this.drawSlice(start, queue.length - start)
    }
  }

  private drawSlice(start: number, length: number) {
    if (length === 0) {
      return
    }

    let queue = this.spriteQueue
    let posTexView = this.positionTextureView
    let colorView = this.colorBufferView

    let texture = queue[start].texture
    let texelX = 1.0 / texture.width
    let texelY = 1.0 / texture.height
    let texelViewX = 1.0 / this.device.viewportState.width
    let texelViewY = 1.0 / this.device.viewportState.height

    let end = start + length
    while (start < end) {
      let slice = end - start
      slice = slice > this.batchSize ? this.batchSize : slice

      let vIndex = 0
      for (let i = 0; i < slice; i ++) {
        let sprite = queue[start + i]
        let cosA = 1
        let sinA = 0
        if (sprite.rotation !== 0) {
          cosA = Math.cos(sprite.rotation)
          sinA = Math.sin(sprite.rotation)
        }
        let cX = sprite.dstX + sprite.originX * sprite.dstWidth
        let cY = sprite.dstY + sprite.originY * sprite.dstHeight
        let p1X = sprite.dstX - cX
        let p1Y = sprite.dstY - cY
        let p2X = (sprite.dstX + sprite.dstWidth) - cX
        let p2Y = (sprite.dstY + sprite.dstHeight) - cY
        let flipX = sprite.flipX ? sprite.srcWidth : 0
        let flipY = sprite.flipY ? sprite.srcHeight : 0

        // VERTEX TOP LEFT

        // position
        posTexView[vIndex++] = (cX + cosA * p1X + sinA * p1Y) * texelViewX
        posTexView[vIndex++] = (cY - sinA * p1X + cosA * p1Y) * texelViewY
        posTexView[vIndex++] = sprite.depth
        // texture
        posTexView[vIndex++] = (sprite.srcX + flipX) * texelX
        posTexView[vIndex++] = (sprite.srcY + flipY) * texelY
        // color
        colorView[vIndex++] = sprite.color as number

        // VERTEX TOP RIGHT

        // position
        posTexView[vIndex++] = (cX + cosA * p2X + sinA * p1Y) * texelViewX
        posTexView[vIndex++] = (cY - sinA * p2X + cosA * p1Y) * texelViewY
        posTexView[vIndex++] = sprite.depth
        // texture
        posTexView[vIndex++] = (sprite.srcX + sprite.srcWidth - flipX) * texelX
        posTexView[vIndex++] = (sprite.srcY + flipY) * texelY
        // color
        colorView[vIndex++] = sprite.color as number

        // VERTEX BOTTOM LEFT

        // position
        posTexView[vIndex++] = (cX + cosA * p1X + sinA * p2Y) * texelViewX
        posTexView[vIndex++] = (cY - sinA * p1X + cosA * p2Y) * texelViewY
        posTexView[vIndex++] = sprite.depth
        // texture
        posTexView[vIndex++] = (sprite.srcX + flipX) * texelX
        posTexView[vIndex++] = (sprite.srcY + sprite.srcHeight - flipY) * texelY
        // color
        colorView[vIndex++] = sprite.color as number

        // VERTEX BOTTOM RIGHT

        // position
        posTexView[vIndex++] = (cX + cosA * p2X + sinA * p2Y) * texelViewX
        posTexView[vIndex++] = (cY - sinA * p2X + cosA * p2Y) * texelViewY
        posTexView[vIndex++] = sprite.depth
        // texture
        posTexView[vIndex++] = (sprite.srcX + sprite.srcWidth - flipX) * texelX
        posTexView[vIndex++] = (sprite.srcY + sprite.srcHeight - flipY) * texelY
        // color
        colorView[vIndex++] = sprite.color as number
      }

      start += slice

      let dat: any = this.positionTextureView
      this.vertexBuffer.setSubData(dat, 0)
      this.device.drawIndexedPrimitives(PrimitiveType.TriangleList, 0, slice * 6)
    }
  }
}
