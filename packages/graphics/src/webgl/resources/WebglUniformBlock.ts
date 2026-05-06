import { dataTypeToArrayType, type TypedArray } from '../../enums'
import { glslComponentCount, type GlslValueType } from '../glsl'
import type { WebglDevice } from '../WebglDevice'
import type { WebglBuffer } from './WebglBuffer'
import { WebglShaderModule } from './WebglShaderModule'

export class WebglUniformBlock {
  public readonly device: WebglDevice
  public readonly program: WebglShaderModule
  public readonly buffer: WebglBuffer
  public readonly index: number
  public readonly size: number
  public readonly array: ArrayBuffer
  public readonly changed: boolean = false
  public readonly name: string

  public constructor(program: WebglShaderModule, name: string, index: number, size: number) {
    this.program = program
    this.device = program.device
    this.name = name
    this.index = index
    this.size = size
    this.array = new ArrayBuffer(size)
    this.buffer = this.device.createUniformBuffer({
      name: `${program.name} block:${index} {name}`,
      size: size,
      data: this.array,
    })

    this.device.onContextRestored.add(this.handleContextRestored)
    this.restore()
  }

  private handleContextRestored = () => {
    this.restore()
  }

  private restore() {
    this.device.context.uniformBlockBinding(this.program.glHandle, this.index, this.index)
    this.markAsChanged()
  }

  public markAsChanged() {
    ;(this as Mutable<this>).changed = true
  }

  public commit() {
    if (this.changed) {
      this.buffer.setData(this.array)
      ;(this as Mutable<this>).changed = false
    }
  }

  public getView(type: GlslValueType, offsetInBytes: number, arraySize: number): TypedArray {
    const elementCount = glslComponentCount(type, arraySize)
    const arrayType = dataTypeToArrayType(type.componentType)
    return new arrayType(this.array, offsetInBytes, elementCount)
  }

  public clone(): WebglUniformBlock {
    const block = new WebglUniformBlock(this.program, this.name, this.index, this.size)
    new Uint8Array(block.array).set(new Uint8Array(this.array))
    return block
  }

  public dispose(): void {
    this.buffer.dispose()
    this.device.onContextRestored.remove(this.handleContextRestored)
  }
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
