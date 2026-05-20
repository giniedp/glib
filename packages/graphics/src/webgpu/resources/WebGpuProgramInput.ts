import type { IVec2, IVec3, IVec4 } from '@gglib/math'
import { dataTypeToArrayType, dataTypeToSize, type TypedArray } from '../../enums'
import {
  Buffer,
  ProgramInput,
  Texture,
  type MatrixLike,
  type InputTypeName,
  type InputValueType,
} from '../../resources'
import { SamplerState } from '../../states'
import type { WebGpuDevice } from '../WebGpuDevice'
import type { WgslResourceInfo } from '../wgsl'
import { WebGpuBuffer } from './WebGpuBuffer'
import { WebGpuShaderResource } from './WebGpuShaderResource'
import type { WebGpuTexture } from './WebGpuTexture'

function invalidSetter(): void {
  throw new Error('Cannot set value on texture or sampler parameter.')
}

export type WebGpuParameterValue = InputValueType | GPUTexture | GPUTextureView | GPUExternalTexture

export class WebGpuProgramInput extends ProgramInput {
  public readonly name: string
  public readonly type: InputTypeName
  public readonly device: WebGpuDevice

  public readonly group: number
  public readonly binding: number

  private array: TypedArray
  private resource: WebGpuShaderResource

  public constructor(name: string, resource: WebGpuShaderResource, info: WgslResourceInfo) {
    super()
    this.resource = resource
    this.device = resource.device
    this.name = name
    this.type = info.container
    this.binding = resource.info.binding
    this.group = resource.info.group

    const isArray = info.container === 'array'
    const container = isArray ? info.elementContainer : info.container
    const size = isArray ? info.elementStride : info.size

    if (info.texture || info.sampler) {
      this.setScalar = invalidSetter
      this.setValue2 = invalidSetter
      this.setValue3 = invalidSetter
      this.setValue4 = invalidSetter
      this.setArray = invalidSetter
      this.setVec2 = invalidSetter
      this.setVec3 = invalidSetter
      this.setVec4 = invalidSetter
      this.setMat2x2 = invalidSetter
      this.setMat3x3 = invalidSetter
      this.setMat4x4 = invalidSetter
    } else {
      const ArrayType = dataTypeToArrayType(info.elementType)
      this.array = new ArrayType(resource.managedData, info.offset, size / dataTypeToSize(info.elementType))
    }

    switch (container) {
      case 'scalar':
        this.set = this.setScalar
        break
      case 'vec2':
        this.set = this.setVec2
        break
      case 'vec3':
        this.set = this.setVec3
        break
      case 'vec4':
        this.set = this.setVec4
        break
      case 'mat2x2':
        this.set = this.setMat2x2
        break
      case 'mat3x3':
        this.set = this.setMat3x3
        break
      case 'mat4x4':
        this.set = this.setMat4x4
        break
      case 'texture':
        this.set = this.setTexture
        break
      case 'sampler':
        this.set = this.setSampler
        break
      default:
        this.set = () => {
          console.warn(`Unsupported parameter type '${this.type}' for '${this.name}'`)
        }
    }
  }

  public set(_value: WebGpuParameterValue): void {
    //
  }

  public setScalar(value: number) {
    this.array[0] = value
    this.resource.markAsChanged(this.array.byteOffset, 4)
  }

  public setValue2(x: number, y: number) {
    this.array[0] = x
    this.array[1] = y
    this.resource.markAsChanged(this.array.byteOffset, 8)
  }

  public setValue3(x: number, y: number, z: number) {
    this.array[0] = x
    this.array[1] = y
    this.array[2] = z
    this.resource.markAsChanged(this.array.byteOffset, 12)
  }

  public setValue4(x: number, y: number, z: number, w: number) {
    this.array[0] = x
    this.array[1] = y
    this.array[2] = z
    this.array[3] = w
    this.resource.markAsChanged(this.array.byteOffset, 16)
  }

  public setArray(value: ArrayLike<number>, offset?: number) {
    this.array.set(value, offset)
    const byteOffset = this.array.byteOffset + (offset ?? 0) * this.array.BYTES_PER_ELEMENT
    const byteLength = value.length * this.array.BYTES_PER_ELEMENT
    this.resource.markAsChanged(byteOffset, byteLength)
  }

  public setVec2(value: IVec2 | ArrayLike<number>) {
    if ('x' in value) {
      this.setValue2(value.x, value.y)
    } else {
      this.setValue2(value[0], value[1])
    }
  }

  public setVec3(value: IVec3 | ArrayLike<number>) {
    if ('x' in value) {
      this.setValue3(value.x, value.y, value.z)
    } else {
      this.setValue3(value[0], value[1], value[2])
    }
  }

  public setVec4(value: IVec4 | ArrayLike<number>) {
    if ('x' in value) {
      this.setValue4(value.x, value.y, value.z, value.w)
    } else {
      this.setValue4(value[0], value[1], value[2], value[3])
    }
  }

  public setMat2x2(matrix: MatrixLike): void {
    const value = 'elements' in matrix ? matrix.elements : matrix
    let index = 0
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        this.array[index] = value[index]
        index++
      }
    }
    this.resource.markAsChanged(this.array.byteOffset, 4 * 4)
  }

  public setMat3x3(matrix: MatrixLike): void {
    const value = 'elements' in matrix ? matrix.elements : matrix
    let si = 0
    let di = 0
    let changed = false
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.array[di] = value[si]
        si++
        di++
      }

      if (this.array[di] !== 0) {
        this.array[di] = 0
        changed = true
      }
      di++ // pad to 4
    }
    this.resource.markAsChanged(this.array.byteOffset, 4 * 12)
  }

  public setMat4x4(matrix: MatrixLike): void {
    const value = 'elements' in matrix ? matrix.elements : matrix
    let index = 0
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.array[index] = value[index]
        index++
      }
    }
    this.resource.markAsChanged(this.array.byteOffset, 4 * 16)
  }

  public setTexture(value: Texture | GPUTexture | GPUTextureView | GPUExternalTexture): void {
    value ||= this.device.defaultTexture
    if (value instanceof Texture) {
      this.resource.setTexture((value as WebGpuTexture).gpuObject)
    } else {
      this.resource.setTexture(value)
    }
  }

  public setSampler(value: SamplerState): void {
    value ||= SamplerState.Default
    this.resource.setSampler(this.device.getSampler(value).resource)
  }

  public setBuffer(value: Buffer | GPUBuffer | GPUBufferBinding): void {
    if (value instanceof Buffer) {
      this.resource.setBuffer((value as WebGpuBuffer).resource)
    } else {
      this.resource.setBuffer(value)
    }
  }

  public get rawValue(): unknown {
    return this.array
  }
}
