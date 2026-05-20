import type { IVec2, IVec3, IVec4 } from '@gglib/math'
import {
  Buffer,
  ProgramInput,
  Texture,
  type MatrixLike,
  type InputTypeName,
  type InputValueType,
} from '../../resources'
import { SamplerState } from '../../states'
import { WebglShaderModule } from './WebglShaderModule'
import type { WebglUniform } from './WebglUniform'

export class WebglProgramInput extends ProgramInput {
  public readonly name: string
  public readonly type: InputTypeName

  private uniform: WebglUniform
  private index: number
  private size: number
  public constructor(uniform: WebglUniform, name: string, arrayIndex: number) {
    super()
    this.name = name
    this.type = uniform.type
    this.uniform = uniform
    this.index = arrayIndex

    switch (this.type) {
      case 'scalar':
        this.set = this.setScalar
        this.size = 1
        break
      case 'vec2':
        this.set = this.setVec2
        this.size = 2
        break
      case 'vec3':
        this.set = this.setVec3
        this.size = 3
        break
      case 'vec4':
        this.set = this.setVec4
        this.size = 4
        break
      case 'mat2x2':
        this.set = this.setMat2x2
        this.size = 4
        break
      case 'mat3x3':
        this.set = this.setMat3x3
        this.size = 9
        break
      case 'mat4x4':
        this.set = this.setMat4x4
        this.size = 16
        break
      case 'sampler':
        this.size = 1
        this.set = (value) => {
          if (value == null) {
            this.setTexture(null)
          } else if (value instanceof Texture) {
            this.setTexture(value)
          } else if (value instanceof SamplerState) {
            this.setSampler(value)
          } else {
            throw new Error(`Invalid value for sampler parameter '${this.name}'`)
          }
        }
        break
      default:
        this.set = () => {
          throw new Error(`Unsupported parameter type for '${this.name}'`)
        }
    }
  }

  public set(_value: InputValueType): void {
    throw new Error('Method not implemented.')
  }
  public setScalar(value: number): void {
    this.uniform.beginWrite(this.index)
    this.uniform.write(value)
    this.uniform.endWrite()
  }

  public setArray(value: ArrayLike<number>, offset: number = 0): void {
    this.uniform.beginWrite(this.index + offset)
    for (let i = 0; i < value.length; i++) {
      this.uniform.write(value[i])
    }
    this.uniform.endWrite()
  }

  public setVec2(value: IVec2 | ArrayLike<number>): void {
    if ('x' in value) {
      this.uniform.beginWrite(this.index)
      this.uniform.write(value.x)
      this.uniform.write(value.y)
      this.uniform.endWrite()
    } else {
      this.setArray(value)
    }
  }

  public setVec3(value: IVec3 | ArrayLike<number>): void {
    if ('x' in value) {
      this.uniform.beginWrite(this.index)
      this.uniform.write(value.x)
      this.uniform.write(value.y)
      this.uniform.write(value.z)
      this.uniform.endWrite()
    } else {
      this.setArray(value)
    }
  }

  public setVec4(value: IVec4 | ArrayLike<number>): void {
    if ('x' in value) {
      this.uniform.beginWrite(this.index)
      this.uniform.write(value.x)
      this.uniform.write(value.y)
      this.uniform.write(value.z)
      this.uniform.write(value.w)
      this.uniform.endWrite()
    } else {
      this.setArray(value)
    }
  }

  public setMat2x2(value: MatrixLike): void {
    if ('elements' in value) {
      this.setArray(value.elements)
    } else {
      this.setArray(value)
    }
  }
  public setMat3x3(value: MatrixLike): void {
    if ('elements' in value) {
      this.setArray(value.elements)
    } else {
      this.setArray(value)
    }
  }
  public setMat4x4(value: MatrixLike): void {
    if ('elements' in value) {
      this.setArray(value.elements)
    } else {
      this.setArray(value)
    }
  }

  public setTexture(value: Texture): void {
    this.uniform.setTexture(value)
  }

  public setSampler(value: SamplerState): void {
    this.uniform.setSampler(value)
  }

  public setBuffer(value: Buffer): void {
    this.uniform.setBuffer(value)
  }

  public get rawValue(): unknown {
    return this.uniform.readValue(this.index, this.size)
  }
}

export class WebglPendingInput extends ProgramInput {
  public readonly name: string
  public readonly type: InputTypeName

  private value: InputValueType
  private offset: number
  private method: keyof ProgramInput
  public constructor(name: string, module: WebglShaderModule) {
    super()
    this.name = name
    this.type = null // not used atm
  }

  public set(value: InputValueType): void {
    this.value = value
    this.method = 'set'
  }
  public setScalar(value: number): void {
    this.value = value
    this.method = 'setScalar'
  }
  public setArray(value: ArrayLike<number>, offset: number = 0): void {
    this.value = value
    this.offset = offset
    this.method = 'setArray'
  }
  public setVec2(value: IVec2 | ArrayLike<number>): void {
    this.value = value
    this.method = 'setVec2'
  }
  public setVec3(value: IVec3 | ArrayLike<number>): void {
    this.value = value
    this.method = 'setVec3'
  }
  public setVec4(value: IVec4 | ArrayLike<number>): void {
    this.value = value
    this.method = 'setVec4'
  }
  public setMat2x2(value: MatrixLike): void {
    this.value = value
    this.method = 'setMat2x2'
  }
  public setMat3x3(value: MatrixLike): void {
    this.value = value
    this.method = 'setMat3x3'
  }
  public setMat4x4(value: MatrixLike): void {
    this.value = value
    this.method = 'setMat4x4'
  }
  public setTexture(value: Texture): void {
    this.value = value
    this.method = 'setTexture'
  }
  public setSampler(value: SamplerState): void {
    this.value = value
    this.method = 'setSampler'
  }
  public setBuffer(value: Buffer): void {
    throw new Error('Method not implemented.')
  }

  public markAsChanged(): void {
    // noop
  }

  public apply(target: WebglProgramInput): void {
    target[this.method as any](this.value, this.offset)
  }

  public get rawValue(): unknown {
    return this.value
  }
}
