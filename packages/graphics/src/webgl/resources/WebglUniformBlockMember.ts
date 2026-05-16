import type { TypedArray } from '../../enums'
import type { Buffer, ProgramInputType, Texture } from '../../resources'
import type { SamplerState } from '../../states'
import { type GlslValueType } from '../glsl'
import { WebglBuffer } from './WebglBuffer'
import type { WebglReflectUniform } from './WebglReflection'
import type { WebglUniform } from './WebglUniform'
import type { WebglUniformBlock } from './WebglUniformBlock'

export class WebglUniformBlockMember implements WebglUniform {
  public readonly name: string
  public readonly alias: string
  public readonly type: ProgramInputType

  private block: WebglUniformBlock
  private blockOffset: number

  private position: number
  private startPosition: number

  private component: number
  private componentCount: number
  private vectorStride: number
  private elementStride: number

  private data: TypedArray

  public constructor(block: WebglUniformBlock, info: WebglReflectUniform<GlslValueType>) {
    this.name = info.name
    this.alias = info.alias
    this.type = info.type.container

    this.block = block
    this.blockOffset = info.blockOffset
    this.data = block.getView(info.type, this.blockOffset, info.arraySize)

    this.elementStride = info.arrayStride / this.data.BYTES_PER_ELEMENT
    switch (info.type.container) {
      case 'scalar':
      case 'vec2':
      case 'vec3':
      case 'vec4':
        this.componentCount = info.type.componentCount
        this.vectorStride = this.elementStride
        break
      case 'mat2x2':
      case 'mat3x2':
      case 'mat4x2':
        this.componentCount = 2
        this.vectorStride = info.matrixStride / this.data.BYTES_PER_ELEMENT
        break
      case 'mat3x3':
      case 'mat2x3':
      case 'mat4x3':
        this.componentCount = 3
        this.vectorStride = info.matrixStride / this.data.BYTES_PER_ELEMENT
        break
      case 'mat4x4':
      case 'mat2x4':
      case 'mat3x4':
        this.componentCount = 4
        this.vectorStride = info.matrixStride / this.data.BYTES_PER_ELEMENT
        break
    }

    this.position = 0
    this.startPosition = 0
    this.component = 0
  }

  /**
   * Sets the index from where next write will occur.
   * For non-array types, this should always be set to 0.
   */
  public beginWrite(index: number) {
    this.position = index * this.elementStride
    this.startPosition = this.position
    this.component = 0
  }

  public write(value: number) {
    if (this.data[this.position] !== value) {
      this.data[this.position] = value
    }
    this.component++
    this.position++
    if (this.component >= this.componentCount) {
      this.position = this.position - this.componentCount + this.vectorStride
      this.component = 0
    }
  }

  public endWrite(): void {
    const start = this.startPosition
    const end = this.position // position advanced by writes
    const byteOffset = this.blockOffset + start * this.data.BYTES_PER_ELEMENT
    const byteLength = (end - start) * this.data.BYTES_PER_ELEMENT
    this.block.markAsChanged(byteOffset, byteLength)
  }

  public setTexture(_value: Texture): void {
    throw new Error('Cannot set texture on a uniform block parameter.')
  }

  public setSampler(_value: SamplerState): void {
    throw new Error('Cannot set sampler on a uniform block parameter.')
  }

  public setBuffer(value: Buffer): void {
    if (this.blockOffset !== 0) {
      throw new Error(
        `setBuffer must be called on the block root ('${this.block.name}'), not on a member field ('${this.name}'). ` +
          `Use the unindexed name to get the block binding.`,
      )
    }
    if (!(value instanceof WebglBuffer)) {
      throw new Error('Invalid buffer type for WebglUniformBlockMember')
    }
    this.block.setBuffer(value)
  }
}
