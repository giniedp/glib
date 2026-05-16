import { Mat4, type IRect } from '@gglib/math'
import { PooledList } from '@gglib/utils'
import { Device } from './Device'
import type { RenderEncoder } from './RenderEncoder'
import { RingBuffer, ShaderModule } from './resources'
import { Buffer } from './resources/Buffer'
import { Texture } from './resources/Texture'
import { VertexBuffer } from './resources/VertexBuffer'
import { SpriteBuilder } from './Sprite'
import { spriteBatchShader } from './SpriteBatch.shader'
import { Renderable } from './types'

export enum SpriteMode {
  Deferred = 0,
  BackToFront = 1,
  FrontToBack = 2,
  Texture = 3,
  // Immediate = 4,
}

function compareBackToFront(a: SpriteBuilder, b: SpriteBuilder): number {
  return b.transform.elements[14] - a.transform.elements[14]
}

function compareFrontToBack(a: SpriteBuilder, b: SpriteBuilder): number {
  return a.transform.elements[14] - b.transform.elements[14]
}

function compareTexture(a: SpriteBuilder, b: SpriteBuilder): number {
  if (a.texture === b.texture) {
    return 0
  }
  return a.texture.uid < b.texture.uid ? -1 : 1
}

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
  program?: ShaderModule
}

/**
 * @public
 */
export class SpriteBatch implements Renderable {
  private device: Device
  private mode: SpriteMode

  private vertexBuffer: VertexBuffer
  private indexBuffer: Buffer
  private shader: ShaderModule
  private matrix: Mat4

  private pool = new PooledList<SpriteBuilder>(() => new SpriteBuilder())
  private sprites: SpriteBuilder[] = []

  private batch: SpriteBuffer

  public get size() {
    return this.sprites.length
  }

  public linearToSrgb: boolean = false

  public constructor(device: Device, options: SpriteBatchOptions = {}) {
    this.device = device
    this.batch = new SpriteBuffer({
      capacity: options.batchSize || 512,
    })

    this.vertexBuffer = this.batch.createVertexBuffer(device)
    this.indexBuffer = device.createIndexBuffer({
      data: new Uint16Array([0, 1, 2, 3]),
    })

    this.matrix = Mat4.createIdentity()
    this.shader = options.program || device.createShaderModule(spriteBatchShader())
  }

  /**
   * Prepares the batch for a new set of sprites.
   * Call {@link SpriteBatch.next} to add sprites to the batch and {@link SpriteBatch.render} to draw them.
   *
   * @param mode
   * @param matrix
   */
  public begin(mode?: SpriteMode, matrix?: Mat4) {
    this.mode = mode ?? SpriteMode.Deferred
    if (matrix) {
      this.matrix.initFrom(matrix)
    } else {
      this.matrix.initOrthographicOffCenter(
        0,
        this.device.output.width,
        this.device.output.height,
        0,
        0,
        1,
        this.device.ndcMinZ,
      )
    }
    this.pool.clear()
  }

  public end() {
    // TODO: sort
    // this.sprites.sort()
  }

  /**
   * Starts a new sprite with the given texture and returns it for configuration.
   *
   * @param texture - The texture to draw
   */
  public next(
    texture: Texture,
    source?: IRect,
    dst?: IRect,
    depth?: number,
    angle?: number,
    pivotX?: number,
    pivotY?: number,
  ): SpriteBuilder {
    if (!texture) {
      throw new Error('no texture given')
    }

    const sprite = this.pool.next()
    sprite.reset(texture)
    if (source) {
      sprite.source(source.x, source.y, source.width, source.height)
    }
    if (dst) {
      sprite.destination(dst.x, dst.y, dst.width, dst.height, depth, angle, pivotX, pivotY)
    }
    return sprite
  }

  public draw() {
    this.render(this.device.renderPass)
  }

  public render(pass: RenderEncoder) {
    this.sprites.length = 0
    this.pool.toArray(this.sprites)
    const queue = this.sprites

    switch (this.mode) {
      case SpriteMode.BackToFront:
        queue.sort(compareBackToFront)
        break
      case SpriteMode.FrontToBack:
        queue.sort(compareFrontToBack)
        break
      case SpriteMode.Texture:
        queue.sort(compareTexture)
        break
    }

    let start = 0
    let count = 0
    let texture = queue[0]?.texture
    for (let i = 0; i < queue.length; i++) {
      if (texture !== queue[i].texture) {
        this.drawSlice(pass, queue, start, count, texture)
        texture = queue[i].texture
        start = i
        count = 0
      }
      count++
    }
    if (count > 0 && texture) {
      this.drawSlice(pass, queue, start, count, texture)
    }
  }

  private drawSlice(
    pass: RenderEncoder,
    sprites: SpriteBuilder[],
    spriteOffset: number,
    spriteCount: number,
    texture: Texture,
  ) {
    if (spriteCount <= 0 || !this.shader.isReady) {
      return
    }

    this.shader.program.get('textureMap').setTexture(texture)
    this.shader.program.get('uniforms.viewProjection').setMat4x4(this.matrix.elements)
    this.shader.program.get('uniforms.toSrgb').setScalar(this.linearToSrgb ? 1 : 0)
    this.shader.program.commit()

    const spriteEnd = spriteOffset + spriteCount
    const batch = this.batch
    while (spriteOffset < spriteEnd) {
      if (batch.instanceOffset >= batch.capacity) {
        batch.reset()
      }

      const instanceCount = batch.remainingContiguous(spriteEnd - spriteOffset)
      const byteOffset = batch.byteOffset
      const byteSize = instanceCount * batch.strideInBytes

      for (let i = 0; i < instanceCount; i++) {
        batch.push(sprites[spriteOffset++])
      }

      this.vertexBuffer.buffers[1].setSubData(0, batch.data.buffer, byteOffset, byteSize)
      pass.setProgram(this.shader.program)
      pass.setIndexBuffer(this.indexBuffer)
      pass.setVertexBuffer(this.vertexBuffer)
      pass.setPrimitiveType('TriangleStrip')
      pass.draw(4, instanceCount, 0, 0)
      pass.submit()
    }
  }

  public dispose() {
    this.shader.dispose()
    this.sprites.length = 0
  }
}

export class SpriteBuffer extends RingBuffer<SpriteBuilder, Float32Array<ArrayBuffer>> {
  public readonly data: Float32Array<ArrayBuffer>
  public readonly capacity: number
  public readonly strideInBytes: number = 96
  public readonly strideElements: number = this.strideInBytes / Float32Array.BYTES_PER_ELEMENT

  public constructor({ capacity }: { capacity: number }) {
    super()
    if (capacity <= 0) {
      throw new Error('capacity must be greater than 0')
    }

    this.capacity = capacity
    this.data = new Float32Array(this.capacity * this.strideElements)
  }

  protected write(value: SpriteBuilder): void {
    let offset = this.instanceOffset * this.strideElements

    value.transform.toArray(this.data, offset)
    offset += 16

    this.data[offset++] = value.uv.x
    this.data[offset++] = value.uv.y
    this.data[offset++] = value.uv.z
    this.data[offset++] = value.uv.w

    this.data[offset++] = value.color.x
    this.data[offset++] = value.color.y
    this.data[offset++] = value.color.z
    this.data[offset++] = value.color.w
  }

  public createVertexBuffer(device: Device): VertexBuffer {
    return device.createVertexBuffer([
      {
        name: 'SpriteBatch Positions',
        vertexLayout: {
          position: {
            elementType: 'float32',
            elementCount: 3,
            byteOffset: 0,
            normalized: false,
            packed: false,
          },
        },
        // prettier-ignore
        data: new Float32Array([
          -0.5, -0.5, 0,
           0.5, -0.5, 0,
          -0.5,  0.5, 0,
           0.5,  0.5, 0
        ]),
      },
      {
        name: 'SpriteBatch Data',
        vertexLayout: {
          aTransform0: {
            elementType: 'float32',
            elementCount: 4,
            byteOffset: 0,
            normalized: false,
            packed: false,
          },
          aTransform1: {
            elementType: 'float32',
            elementCount: 4,
            byteOffset: 16,
            normalized: false,
            packed: false,
          },
          aTransform2: {
            elementType: 'float32',
            elementCount: 4,
            byteOffset: 32,
            normalized: false,
            packed: false,
          },
          aTransform3: {
            elementType: 'float32',
            elementCount: 4,
            byteOffset: 48,
            normalized: false,
            packed: false,
          },
          aTexcoord: {
            elementType: 'float32',
            elementCount: 4,
            byteOffset: 64,
            normalized: false,
            packed: false,
          },
          aColor: {
            elementType: 'float32',
            elementCount: 4,
            byteOffset: 80,
            normalized: false,
            packed: false,
          },
        },
        instanced: true,
        stride: this.strideInBytes,
        size: this.sizeInBytes,
      },
    ])
  }
}
