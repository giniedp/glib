import { VertexBuffer, VertexBufferOptions } from '../../resources/VertexBuffer'
import type { DeviceGL } from '../DeviceGL'
import { isWebGL2 } from '../utils'
import { BufferGL } from './BufferGL'
import { ShaderProgramGL } from './ShaderProgramGL'

export class VertexBufferGL extends VertexBuffer {
  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  private vaoCache: Map<WebGLBuffer, Map<string, WebGLVertexArrayObject>> = new Map()

  public constructor(device: DeviceGL, options: VertexBufferOptions) {
    super()
    this.device = device
    this.buffers = []
    if (!Array.isArray(options)) {
      options = [options]
    }
    for (const bufferOpts of options) {
      this.buffers.push(
        new BufferGL(device, {
          ...bufferOpts,
          type: 'VertexBuffer',
        }),
      )
    }
  }

  public bind(iBuffer: BufferGL | null, program: ShaderProgramGL) {
    const gl = this.device.context
    if (!isWebGL2(gl)) {
      iBuffer?.bind()
      program.bindAttribPointerAndLocation(this.buffers)
      return
    }

    // TODO: maybe move this into geometry or a VAOCache
    // this should be fine though as long as a geometry creates and disposes both
    // the vertex buffer and index buffer at the same time.
    let perBuffer = this.vaoCache.get(iBuffer || null)
    if (!perBuffer) {
      perBuffer = new Map()
      this.vaoCache.set(iBuffer || null, perBuffer)
    }

    let vao = perBuffer.get(program.attributeLayout)
    if (vao) {
      gl.bindVertexArray(vao)
      return
    }

    vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    iBuffer?.bind()
    program.bindAttribPointerAndLocation(this.buffers)
    perBuffer.set(program.attributeLayout, vao)
  }

  public unbind() {
    if (isWebGL2(this.device.context)) {
      this.device.context.bindVertexArray(null)
    }
  }

  public dispose(): this {
    for (const buffer of this.buffers) {
      buffer.dispose()
    }
    this.buffers = []
    this.vaoCache.forEach((perBuffer) => {
      perBuffer.forEach((vao) => {
        ;(this.device.context as WebGL2RenderingContext).deleteVertexArray(vao)
      })
    })
    return this
  }
}
