import { dataTypeToArrayType, type TypedArray } from '../../enums'
import { type Texture, type ProgramInputType } from '../../resources'
import { SamplerState } from '../../states'
import { glslComponentCount, glslUploadFunction, type GlslTypeSampler, type GlslValueType } from '../glsl'
import type { WebglDevice } from '../WebglDevice'
import type { WebglReflectUniform } from './WebglReflection'
import type { WebglShaderModule } from './WebglShaderModule'
import type { WebglUniform } from './WebglUniform'

export class WebglUniformLocation implements WebglUniform {
  public readonly device: WebglDevice
  public readonly program: WebglShaderModule
  public readonly name: string
  public readonly alias: string
  public readonly type: ProgramInputType

  private data: TypedArray
  private location: WebGLUniformLocation
  private upload: (location: WebGLUniformLocation, value: number[]) => void
  private changed: boolean = false

  private position: number = 0
  private componentCount: number = 0
  public constructor(program: WebglShaderModule, info: WebglReflectUniform) {
    this.device = program.device
    this.program = program
    this.name = info.name
    this.alias = info.alias
    this.type = info.type.container

    this.position = 0
    if (info.type.container === 'sampler') {
      this.componentCount = 1
    } else {
      this.componentCount = info.type.componentCount
    }

    this.data = getTypedArray(info.type, info.arraySize)
    this.upload = glslUploadFunction(info.type, this.device.context)
    this.location = this.device.context.getUniformLocation(program.glHandle, info.name)

    if (info.textureIndex >= 0) {
      this.write(info.textureIndex)
    }
  }

  public commit(): void {
    if (!this.program.isReady) {
      console.warn(`Cannot commit uniform '${this.name}' because program is not ready`)
      return
    }
    if (!this.changed) {
      return
    }
    this.changed = false
    this.device.activateProgram(this.program.glHandle)
    this.upload(this.location, this.data as any)
  }

  public setIndex(index: number) {
    this.position = index * this.componentCount
  }

  public write(value: number) {
    if (this.data[this.position] !== value) {
      this.data[this.position] = value
      this.changed = true
    }
    this.position++
  }

  public setTexture(_value: Texture): void {
    throw new Error(`Cannot set texture on non-sampler parameter '${this.name}'`)
  }

  public setSampler(_value: SamplerState): void {
    throw new Error(`Cannot set texture on non-sampler parameter '${this.name}'`)
  }
}

function getTypedArray(type: GlslValueType | GlslTypeSampler, arraySize: number): TypedArray {
  if (type.container === 'sampler') {
    return new Int32Array(1)
  }
  const elementCount = glslComponentCount(type, arraySize)
  const ArrayType = dataTypeToArrayType(type.componentType)
  return new ArrayType(elementCount)
}
