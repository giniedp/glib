import { eventSource } from '@gglib/utils'
import { dataTypeToWebGL, vertexTypeFormat } from '../../enums'
import type { VertexAttribute } from '../../resources'
import type { WebglResource } from '../types'
import type { WebglDevice } from '../WebglDevice'
import type { WebglBuffer } from './WebglBuffer'
import { WebglReflectInput } from './WebglReflection'
import type { WebglShaderModule } from './WebglShaderModule'
import type { WebglVertexBuffer } from './WebglVertexBuffer'

export class WebglVertexArray implements WebglResource<WebGLVertexArrayObject> {
  public readonly device: WebglDevice
  public readonly program: WebglShaderModule
  public readonly vertexBuffer: WebglVertexBuffer
  public readonly indexBuffer: WebglBuffer
  public readonly glHandle: WebGLVertexArrayObject
  public readonly onDisposed = eventSource<this>()

  private disposed = false
  private instanced: InstancedAttribute[] = []
  private baseInstance = 0
  private unsubscribe: Array<() => void> = []
  public constructor(
    device: WebglDevice,
    program: WebglShaderModule,
    vertexBuffer: WebglVertexBuffer,
    indexbuffer: WebglBuffer,
  ) {
    this.device = device
    this.program = program
    this.vertexBuffer = vertexBuffer
    this.indexBuffer = indexbuffer

    const dispose = () => this.dispose()
    this.unsubscribe.push(program.onDisposed.once(dispose), vertexBuffer.onDisposed.once(dispose))
    // a buffer is recreated with a new handle when its size changes, the vertex array must be rebuilt then
    for (const buffer of vertexBuffer.buffers) {
      this.unsubscribe.push(buffer.onDisposed.once(dispose))
    }
    if (indexbuffer) {
      this.unsubscribe.push(indexbuffer.onDisposed.once(dispose))
    }

    this.device.onContextRestored.add(this.handleContextRestored)
    this.restore()
  }

  private handleContextRestored = () => {
    this.restore()
  }

  private restore() {
    const self = this as Mutable<this>
    self.glHandle = createVao(this.device.context, this.program, this.vertexBuffer.buffers, this.indexBuffer, this.instanced)
    this.baseInstance = 0
  }

  /**
   * Whether the vertex array has per instance attributes
   */
  public get hasInstancedAttributes(): boolean {
    return this.instanced.length > 0
  }

  /**
   * Offsets the per instance attributes so that the next draw starts at the given instance, which WebGL has no native
   * support for. The vertex array must be bound.
   */
  public setBaseInstance(value: number) {
    if (this.baseInstance === value || !this.instanced.length) {
      return
    }
    this.baseInstance = value
    const gl = this.device.context
    for (const { buffer, location, size, type, normalized, byteOffset } of this.instanced) {
      gl.bindBuffer(buffer.glType, buffer.glHandle)
      gl.vertexAttribPointer(location, size, type, normalized, buffer.stride, byteOffset + value * buffer.stride)
    }
  }

  public dispose() {
    if (this.disposed) {
      return
    }
    this.disposed = true
    for (const unsubscribe of this.unsubscribe) {
      unsubscribe()
    }
    this.unsubscribe.length = 0
    this.device.onContextRestored.remove(this.handleContextRestored)
    this.device.context.deleteVertexArray(this.glHandle)
    const self = this as Mutable<this>
    self.glHandle = null
    this.onDisposed.emit(self)
    this.onDisposed.clear()
    self.program = null
    self.vertexBuffer = null
    self.indexBuffer = null
  }
}

function createVao(
  gl: WebGL2RenderingContext,
  program: WebglShaderModule,
  vertexBuffer: WebglBuffer[],
  indexBuffer: WebglBuffer | null,
  instanced: InstancedAttribute[],
) {
  instanced.length = 0
  const toBind: Array<{
    buffer: WebglBuffer
    layout: VertexAttribute
    location: number
  }> = []
  const missing: Array<WebglReflectInput> = []

  if (!program) {
    throw new Error('Program is required to create a VertexArray')
  }
  if (!program.reflection?.inputs) {
    throw new Error('Program reflection is required to create a VertexArray')
  }
  if (!vertexBuffer) {
    throw new Error('VertexBuffer is required to create a VertexArray')
  }
  outer: for (const attribute of program.reflection.inputs) {
    for (const buffer of vertexBuffer) {
      const layout = buffer.findLayout(attribute.alias || attribute.name)
      if (!layout) {
        continue
      }
      toBind.push({
        buffer,
        layout,
        location: attribute.location,
      })
      continue outer
    }
    missing.push(attribute)
  }

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  for (const { buffer, layout, location } of toBind) {
    const { elementCount, elementType, normalized } = vertexTypeFormat(layout.type)

    gl.bindBuffer(buffer.glType, buffer.glHandle)
    gl.vertexAttribPointer(
      location,
      elementCount,
      dataTypeToWebGL(elementType),
      !!normalized,
      buffer.stride,
      layout.byteOffset,
    )
    gl.vertexAttribDivisor(location, buffer.instanced ? 1 : 0)
    gl.enableVertexAttribArray(location)
    if (buffer.instanced) {
      instanced.push({
        buffer,
        location,
        size: elementCount,
        type: dataTypeToWebGL(elementType),
        normalized: !!normalized,
        byteOffset: layout.byteOffset,
      })
    }
  }

  for (const { location, name, alias, type } of missing) {
    let value = [0, 0, 0, 0]
    if ((alias || name).match(/color/i)) {
      value = [1, 1, 1, 1]
    }
    gl.disableVertexAttribArray(location)
    switch (type.componentType) {
      case 'float16':
      case 'float32':
        gl.vertexAttrib4fv(location, value)
        break
      case 'int8':
      case 'int16':
      case 'int32':
        gl.vertexAttribI4iv(location, value)
        break
      case 'uint8':
      case 'uint16':
      case 'uint32':
        gl.vertexAttribI4uiv(location, value)
        break
    }
  }

  if (indexBuffer) {
    gl.bindBuffer(indexBuffer.glType, indexBuffer.glHandle)
  }
  gl.bindVertexArray(null)
  return vao
}

interface InstancedAttribute {
  buffer: WebglBuffer
  location: number
  size: number
  type: GLenum
  normalized: boolean
  byteOffset: number
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}
