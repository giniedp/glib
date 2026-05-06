import { eventSource } from '@gglib/utils'
import { dataTypeToWebGL } from '../../enums'
import type { VertexAttribute } from '../../VertexLayout'
import type { WebglResource } from '../types'
import type { WebglDevice } from '../WebglDevice'
import type { WebglBuffer } from './WebglBuffer'
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
    throw new Error(
      [
        'VertexBuffer is not compatible with Program',
        `Required attributes: ${program.reflection.inputs.map((it) => it.alias || it.name)}`,
        `Available attributes: ${vertexBuffer.map((it) => Object.keys(it.vertexLayout)).flat()}`,
        `Missing attribute: ${attribute.alias || attribute.name}`,
      ].join('\n'),
    )
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
  if (indexBuffer) {
    gl.bindBuffer(indexBuffer.glType, indexBuffer.glHandle)
  }
  gl.bindVertexArray(null)
  return vao
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}
