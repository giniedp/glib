import { BufferUsage } from '../../enums'
import type { Buffer, InputTypeName, Texture, TextureView } from '../../resources'
import { SamplerState } from '../../states'
import type { GlslStorageLayout, GlslStorageMember } from '../glsl'
import type { WebglDevice } from '../WebglDevice'
import { WebglBuffer } from './WebglBuffer'
import type { WebglReflectUniform } from './WebglReflection'
import type { WebglShaderModule } from './WebglShaderModule'
import type { WebglTexture } from './WebglTexture'
import type { WebglUniform } from './WebglUniform'

/**
 * A storage buffer binding, emulated by a float texture
 *
 * @remarks
 * Declared in GLSL as a sampler with a `@storage` annotation that names the element type:
 *
 * ```glsl
 * struct ObjectBlock { mat4 modelMatrix; };
 * // @storage ObjectBlock
 * uniform highp sampler2D object;
 * ```
 *
 * Like a storage binding on WebGPU, it holds a managed buffer of one element, its members are written through
 * inputs like `object.modelMatrix`. {@link setBuffer} binds an external storage buffer instead.
 * The bound buffer is mirrored into a float texture, see {@link WebglBuffer.syncStorageTexture}.
 */
export class WebglStorageBinding implements WebglUniform {
  public readonly device: WebglDevice
  public readonly name: string
  public readonly alias: string
  public readonly type: InputTypeName = 'sampler'
  public readonly unit: number
  public readonly layout: GlslStorageLayout

  /**
   * The texture of the bound buffer, updated by {@link sync}
   */
  public texture: WebglTexture | TextureView
  /**
   * Float textures are sampled without filtering
   */
  public readonly sampler: SamplerState = SamplerState.PointClamp

  /**
   * CPU data of the managed buffer, written by the members
   */
  public readonly managedData: Float32Array<ArrayBuffer>
  private managedBuffer: WebglBuffer
  private boundBuffer: WebglBuffer
  private dirtyStart = Infinity
  private dirtyEnd = -Infinity

  public constructor(program: WebglShaderModule, info: WebglReflectUniform) {
    this.device = program.device
    this.name = info.name
    this.alias = info.alias
    this.unit = info.textureIndex
    this.layout = info.storage
    this.texture = this.device.defaultTexture
    this.managedData = new Float32Array(this.layout.stride / 4)
    this.managedBuffer = this.device.createBuffer({
      name: `${info.name} Storage`,
      usage: BufferUsage.STORAGE,
      size: this.managedData.byteLength,
    })
    this.boundBuffer = this.managedBuffer
  }

  /**
   * Whether the managed buffer is bound
   */
  public get isManaged(): boolean {
    return this.boundBuffer === this.managedBuffer
  }

  /**
   * Creates the inputs for the members of the element, e.g. `object.modelMatrix`
   */
  public createMembers(): WebglStorageMember[] {
    // a plain element type (e.g. mat4) has no named members, it is only bound as a whole
    return this.layout.members.filter((it) => it.name).map((member) => new WebglStorageMember(this, member))
  }

  public markAsChanged(byteOffset: number, byteLength: number) {
    this.dirtyStart = Math.min(this.dirtyStart, byteOffset)
    this.dirtyEnd = Math.max(this.dirtyEnd, byteOffset + byteLength)
  }

  /**
   * Uploads the managed data and updates the {@link texture} of the bound buffer
   */
  public sync() {
    if (this.isManaged && this.dirtyEnd > this.dirtyStart) {
      const start = this.dirtyStart / 4
      this.managedBuffer.setSubData(this.dirtyStart, this.managedData, start, this.dirtyEnd / 4 - start)
      this.dirtyStart = Infinity
      this.dirtyEnd = -Infinity
    }
    this.texture = this.boundBuffer.syncStorageTexture()
  }

  public setBuffer(value: Buffer): void {
    if (!value) {
      this.boundBuffer = this.managedBuffer
      return
    }
    if (!(value instanceof WebglBuffer) || !value.isStorageBuffer) {
      throw new Error(`'${this.name}' requires a buffer with storage usage`)
    }
    this.boundBuffer = value
  }

  public beginWrite(index: number): void {
    throw new Error(`Cannot write to storage binding '${this.name}', write to its members instead.`)
  }

  public write(value: number): void {
    throw new Error(`Cannot write to storage binding '${this.name}', write to its members instead.`)
  }

  public endWrite(): void {
    //
  }

  public setTexture(_value: Texture | TextureView): void {
    throw new Error(`Cannot set a texture on storage binding '${this.name}', use setBuffer.`)
  }

  public setSampler(_value: SamplerState): void {
    // the float texture is always read without filtering
  }

  public readValue(): unknown {
    return this.boundBuffer
  }

  public dispose() {
    this.managedBuffer.dispose()
  }
}

/**
 * A member of the managed element of a {@link WebglStorageBinding}
 */
export class WebglStorageMember implements WebglUniform {
  public readonly name: string
  public readonly alias: string
  public readonly type: InputTypeName

  private binding: WebglStorageBinding
  private data: Float32Array<ArrayBuffer>
  private offset: number
  private componentCount: number
  private vectorStride: number
  private elementStride: number

  private position = 0
  private component = 0
  private writeStart = 0
  private writeEnd = 0

  public constructor(binding: WebglStorageBinding, member: GlslStorageMember) {
    this.binding = binding
    this.name = `${binding.name}.${member.name}`
    this.alias = `${binding.alias}.${member.name}`
    this.type = member.type.container
    this.data = binding.managedData
    this.offset = member.offset / 4
    this.elementStride = member.arrayStride / 4
    if (member.matrixStride) {
      // matCxR is written column by column, each column is a vecR
      this.componentCount = Number(member.type.container.slice(-1))
      this.vectorStride = member.matrixStride / 4
    } else {
      this.componentCount = member.type.componentCount
      this.vectorStride = this.elementStride
    }
  }

  public beginWrite(index: number) {
    this.position = this.offset + index * this.elementStride
    this.writeStart = this.position
    this.writeEnd = this.position
    this.component = 0
  }

  public write(value: number) {
    this.data[this.position] = value
    this.component++
    this.position++
    if (this.component >= this.componentCount) {
      this.writeEnd = Math.max(this.writeEnd, this.position)
      this.position = this.position - this.componentCount + this.vectorStride
      this.component = 0
    }
  }

  public endWrite(): void {
    this.writeEnd = Math.max(this.writeEnd, this.position)
    this.binding.markAsChanged(this.writeStart * 4, (this.writeEnd - this.writeStart) * 4)
  }

  public setTexture(_value: Texture | TextureView): void {
    throw new Error(`Cannot set a texture on storage member '${this.name}'.`)
  }

  public setSampler(_value: SamplerState): void {
    throw new Error(`Cannot set a sampler on storage member '${this.name}'.`)
  }

  public setBuffer(_value: Buffer): void {
    throw new Error(`setBuffer must be called on the storage binding '${this.binding.name}'.`)
  }

  public readValue(index: number, size: number): unknown {
    const start = this.offset + index
    return this.data.slice(start, start + size)
  }
}
