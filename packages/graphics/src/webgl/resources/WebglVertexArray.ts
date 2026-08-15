import { eventSource } from '@gglib/utils'
import { dataTypeToWebGL } from '../../enums'
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

    program.onDisposed.once(() => this.dispose())
    vertexBuffer.onDisposed.once(() => this.dispose())
    if (indexbuffer) {
      indexbuffer.onDisposed.once(() => this.dispose())
    }

    this.device.onContextRestored.add(this.handleContextRestored)
    this.restore()
  }

  private handleContextRestored = () => {
    this.restore()
  }

  private restore() {
    const self = this as Mutable<this>
    self.glHandle = createVao(this.device.context, this.program, this.vertexBuffer.buffers, this.indexBuffer)
  }

  public dispose() {
    if (this.disposed) {
      return
    }
    this.disposed = true
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
) {
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
    gl.bindBuffer(buffer.glType, buffer.glHandle)
    gl.vertexAttribPointer(
      location,
      layout.elementCount,
      dataTypeToWebGL(layout.elementType),
      layout.normalized,
      buffer.stride,
      layout.byteOffset,
    )
    gl.vertexAttribDivisor(location, buffer.instanced ? 1 : 0)
    gl.enableVertexAttribArray(location)
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

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}
