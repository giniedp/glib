import { dataTypeToArrayType, type TypedArray } from '../../enums'
import { glslComponentCount, type GlslValueType } from '../glsl'
import type { WebglDevice } from '../WebglDevice'
import type { WebglBuffer } from './WebglBuffer'
import { WebglShaderModule } from './WebglShaderModule'

export class WebglUniformBlock {
  public readonly device: WebglDevice
  public readonly program: WebglShaderModule
  public readonly index: number
  public readonly size: number
  public readonly array: ArrayBuffer
  public readonly name: string
  public readonly boundBuffer: WebglBuffer
  public readonly isManaged: boolean = true
  public get isDirty(): boolean {
    return this.dirtyMin < this.dirtyMax
  }

  private managedBuffer: WebglBuffer
  private dirtyMin: number = Infinity
  private dirtyMax: number = -Infinity

  public constructor(program: WebglShaderModule, name: string, index: number, size: number) {
    this.program = program
    this.device = program.device
    this.name = name
    this.index = index
    this.size = size
    this.array = new ArrayBuffer(size)
    this.managedBuffer = this.device.createUniformBuffer({
      name: `${program.name} block:${index} ${name}`,
      size: size,
      data: this.array,
    })
    this.boundBuffer = this.managedBuffer

    this.device.onContextRestored.add(this.handleContextRestored)
    this.restore()
  }

  private handleContextRestored = () => {
    this.restore()
  }

  private restore() {
    this.device.context.uniformBlockBinding(this.program.glHandle, this.index, this.index)
    this.invalidate()
  }

  public markAsChanged(byteOffset: number, byteLength: number): void {
    this.dirtyMin = Math.min(this.dirtyMin, byteOffset)
    this.dirtyMax = Math.max(this.dirtyMax, byteOffset + byteLength)
  }

  public invalidate() {
    this.markAsChanged(0, this.array.byteLength)
  }

  public setBuffer(value: WebglBuffer): void {
    const self = this as Mutable<this>
    self.boundBuffer = value
    self.isManaged = this.boundBuffer === this.managedBuffer
  }

  public commit() {
    if (!this.isDirty || !this.isManaged || !this.managedBuffer) {
      return
    }
    this.managedBuffer.setSubData(0, this.array, this.dirtyMin, this.dirtyMax - this.dirtyMin)
    this.resetDirty()
  }

  private resetDirty(): void {
    this.dirtyMin = Infinity
    this.dirtyMax = -Infinity
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
    this.managedBuffer.dispose()
    this.device.onContextRestored.remove(this.handleContextRestored)
  }
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
