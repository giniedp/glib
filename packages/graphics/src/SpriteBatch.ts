import { Mat4, type IRect } from '@gglib/math'
import { PooledList } from '@gglib/utils'
import { Device } from './Device'
import type { RenderEncoder } from './RenderEncoder'
import { bufferField, bufferLayout, bufferRecorder, BufferRecorder, ShaderModule, vertexLayout } from './resources'
import { Buffer } from './resources/Buffer'
import { Texture } from './resources/Texture'
import { VertexBuffer } from './resources/VertexBuffer'
import { SpriteBuilder } from './Sprite'
import { spriteBatchShader } from './SpriteBatch.shader'
import { CullState } from './states'
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

  public readonly shader: ShaderModule
  private matrix: Mat4

  private pool = new PooledList<SpriteBuilder>(() => new SpriteBuilder())
  private sprites: SpriteBuilder[] = []

  private vertexBuffer: VertexBuffer
  private indexBuffer: Buffer
  private writer: BufferRecorder
  private layout = bufferLayout([
    bufferField('aTransform0', 'vec4f'),
    bufferField('aTransform1', 'vec4f'),
    bufferField('aTransform2', 'vec4f'),
    bufferField('aTransform3', 'vec4f'),
    bufferField('aTexcoord', 'vec4f'),
    bufferField('aColor', 'vec4f'),
  ])

  // private batch: SpriteBuffer

  public get isReady() {
    return this.shader.isCompiled
  }

  public get size() {
    return this.sprites.length
  }

  public linearToSrgb: boolean = false
  public tonemap: boolean = false
  public exposure = 1.0

  public constructor(device: Device, options: SpriteBatchOptions = {}) {
    this.device = device

    const capacity = options.batchSize || 512
    this.writer = bufferRecorder({
      capacity,
      recordByteSize: this.layout.byteSize,
    })
    this.indexBuffer = device.createIndexBuffer({
      data: new Uint16Array([0, 1, 2, 3]),
    })
    this.vertexBuffer = this.device.createVertexBuffer([
      {
        name: 'SpriteBatch Positions',
        layout: vertexLayout({
          position: 'float32x3',
        }),
        // prettier-ignore
        data: new Float32Array([
          -0.5, -0.5, 0,
           0.5, -0.5, 0,
          -0.5,  0.5, 0,
           0.5,  0.5, 0
        ]),
      },
      {
        layout: this.layout.vertex,
        instanced: true,
        stride: this.layout.byteSize,
        size: this.layout.byteSize * capacity,
      },
    ])

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
    if (spriteCount <= 0 || !this.shader.isCompiled) {
      return
    }

    this.shader.program.get('textureMap').setTexture(texture)
    this.shader.program.get('uniforms.viewProjection').setMat4x4(this.matrix.elements)
    this.shader.program.get('uniforms.toSrgb').setScalar(this.linearToSrgb ? 1 : 0)
    this.shader.program.get('uniforms.tonemap').setScalar(this.tonemap ? 1 : 0)
    this.shader.program.get('uniforms.exposure').setScalar(this.exposure)
    this.shader.program.commit()

    const spriteEnd = spriteOffset + spriteCount
    const batch = this.writer
    while (spriteOffset < spriteEnd) {
      const instanceOffset = batch.recordIndex
      const instanceCount = Math.min(batch.remainingRecordCount, spriteEnd - spriteOffset)
      const target = this.vertexBuffer.buffers[1]

      for (let i = 0; i < instanceCount; i++) {
        const sprite = sprites[spriteOffset++]
        batch.writeMat4(sprite.transform)
        batch.writeVec4f(sprite.uv)
        batch.writeVec4f(sprite.color)
        if (batch.recordIndex < batch.capacity - 1) {
          batch.next()
        } else {
          batch.seek(0)
        }
      }

      if (this.device.isWebGL2) {
        target.setSubData(0, batch.buffer, instanceOffset * batch.strideInBytes, instanceCount * batch.strideInBytes)
      } else {
        batch.upload(target)
      }

      pass.setCullState(CullState.None)
      pass.setProgram(this.shader.program)
      pass.setIndexBuffer(this.indexBuffer)
      pass.setVertexBuffer(this.vertexBuffer)
      pass.setPrimitiveType('triangle-strip')

      if (this.device.isWebGL2) {
        pass.draw(4, instanceCount, 0, 0)
      } else {
        pass.draw(4, instanceCount, 0, instanceOffset)
      }
      pass.submit()
    }
  }

  public dispose() {
    this.shader.dispose()
    this.sprites.length = 0
  }
}
