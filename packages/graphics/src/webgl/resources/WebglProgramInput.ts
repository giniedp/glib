import type { IVec2, IVec3, IVec4 } from '@gglib/math'
import { ProgramInput, Texture, type MatrixLike, type ProgramInputType, type ProgramInputValue } from '../../resources'
import { SamplerState } from '../../states'
import { WebglShaderModule } from './WebglShaderModule'
import type { WebglUniform } from './WebglUniform'

export class WebglProgramInput extends ProgramInput {
  public readonly name: string
  public readonly type: ProgramInputType

  private uniform: WebglUniform
  private index: number
  public constructor(uniform: WebglUniform, name: string, arrayIndex: number) {
    super()
    this.name = name
    this.type = uniform.type
    this.uniform = uniform
    this.index = arrayIndex

    switch (this.type) {
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
      case 'sampler':
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

  public set(_value: ProgramInputValue): void {
    throw new Error('Method not implemented.')
  }
  public setScalar(value: number): void {
    this.uniform.setIndex(this.index)
    this.uniform.write(value)
  }
  public setArray(value: ArrayLike<number>, offset: number = 0): void {
    this.uniform.setIndex(this.index + offset)
    for (let i = 0; i < value.length; i++) {
      this.uniform.write(value[i])
    }
  }
  public setVec2(value: IVec2 | ArrayLike<number>): void {
    this.uniform.setIndex(this.index)
    if ('x' in value) {
      this.uniform.write(value.x)
      this.uniform.write(value.y)
    } else {
      this.setArray(value)
    }
  }
  public setVec3(value: IVec3 | ArrayLike<number>): void {
    this.uniform.setIndex(this.index)
    if ('x' in value) {
      this.uniform.write(value.x)
      this.uniform.write(value.y)
      this.uniform.write(value.z)
    } else {
      this.setArray(value)
    }
  }
  public setVec4(value: IVec4 | ArrayLike<number>): void {
    this.uniform.setIndex(this.index)
    if ('x' in value) {
      this.uniform.write(value.x)
      this.uniform.write(value.y)
      this.uniform.write(value.z)
      this.uniform.write(value.w)
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
}

export class WebglPendingInput extends ProgramInput {
  public readonly name: string
  public readonly type: ProgramInputType

  private value: ProgramInputValue
  private offset: number
  private method: keyof ProgramInput
  public constructor(name: string, module: WebglShaderModule) {
    super()
    this.name = name
    this.type = null // not used atm
  }

  public set(value: ProgramInputValue): void {
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

  public apply(target: WebglProgramInput): void {
    target[this.method as any](this.value, this.offset)
  }
}
