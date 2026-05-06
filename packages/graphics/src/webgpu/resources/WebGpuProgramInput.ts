import type { IVec2, IVec3, IVec4 } from '@gglib/math'
import { dataTypeToArrayType, dataTypeToSize, type TypedArray } from '../../enums'
import { ProgramInput, Texture, type MatrixLike, type ProgramInputType, type ProgramInputValue } from '../../resources'
import { SamplerState } from '../../states'
import type { WebGpuDevice } from '../WebGpuDevice'
import type { WgslResourceInfo } from '../wgsl'
import { WebGpuShaderResource } from './WebGpuShaderResource'
import type { WebGpuTexture } from './WebGpuTexture'

function invalidSetter(): void {
  throw new Error('Cannot set value on texture or sampler parameter.')
}

export type WebGpuParameterValue = ProgramInputValue | GPUTexture | GPUTextureView | GPUExternalTexture

export class WebGpuProgramInput extends ProgramInput {
  public name: string
  public type: ProgramInputType
  public device: WebGpuDevice

  private array: TypedArray
  private resource: WebGpuShaderResource
  public constructor(resource: WebGpuShaderResource, info: WgslResourceInfo) {
    super()
    this.resource = resource
    this.device = resource.device
    this.name = info.alias || info.name
    this.type = info.container

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
      this.array = new ArrayType(resource.arrayBuffer, info.offset, size / dataTypeToSize(info.elementType))
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
          // throw new Error(`Unsupported parameter type for '${this.name}'`)
        }
    }
  }

  public set(_value: WebGpuParameterValue): void {
    //
  }

  public setScalar(value: number) {
    if (this.array[0] !== value) {
      this.array[0] = value
      this.resource.markAsChanged()
    }
  }

  public setValue2(x: number, y: number) {
    if (this.array[0] !== x || this.array[1] !== y) {
      this.array[0] = x
      this.array[1] = y

      this.resource.markAsChanged()
    }
  }

  public setValue3(x: number, y: number, z: number) {
    if (this.array[0] !== x || this.array[1] !== y || this.array[2] !== z) {
      this.array[0] = x
      this.array[1] = y
      this.array[2] = z
      this.resource.markAsChanged()
    }
  }

  public setValue4(x: number, y: number, z: number, w: number) {
    if (this.array[0] !== x || this.array[1] !== y || this.array[2] !== z || this.array[3] !== w) {
      this.array[0] = x
      this.array[1] = y
      this.array[2] = z
      this.array[3] = w
      this.resource.markAsChanged()
    }
  }

  public setArray(value: ArrayLike<number>, offset?: number) {
    this.array.set(value, offset)
    this.resource.markAsChanged()
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
    let changed = false
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (this.array[index] !== value[index]) {
          this.array[index] = value[index]
          changed = true
        }
        index++
      }
    }
    if (changed) {
      this.resource.markAsChanged()
    }
  }

  public setMat3x3(matrix: MatrixLike): void {
    const value = 'elements' in matrix ? matrix.elements : matrix
    let si = 0
    let di = 0
    let changed = false
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.array[di] !== value[si]) {
          this.array[di] = value[si]
          changed = true
        }
        si++
        di++
      }

      if (this.array[di] !== 0) {
        this.array[di] = 0
        changed = true
      }
      di++ // pad to 4
    }
    if (changed) {
      this.resource.markAsChanged()
    }
  }

  public setMat4x4(matrix: MatrixLike): void {
    const value = 'elements' in matrix ? matrix.elements : matrix
    let index = 0
    let changed = false
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.array[index] !== value[index]) {
          this.array[index] = value[index]
          changed = true
        }
        index++
      }
    }
    if (changed) {
      this.resource.markAsChanged()
    }
  }

  public setTexture(value: Texture | GPUTexture | GPUTextureView | GPUExternalTexture): void {
    if (this.type !== 'texture') {
      throw new Error(`Cannot set texture on non-texture parameter '${this.name}'`)
    }
    value ||= this.device.defaultTexture
    if (value instanceof Texture) {
      this.resource.setResource((value as WebGpuTexture).gpuObject)
    } else {
      this.resource.setResource(value)
    }
  }

  public setSampler(value: SamplerState): void {
    if (this.type !== 'sampler') {
      throw new Error(`Cannot set sampler on non-sampler parameter '${this.name}'`)
    }

    value ||= SamplerState.Default
    this.resource.setResource(this.device.getSampler(value).resource)
  }
}
