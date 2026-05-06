import type { WebglDevice } from '../WebglDevice'
import type { WebglBuffer } from './WebglBuffer'
import type { WebglShaderModule } from './WebglShaderModule'
import { WebglVertexArray } from './WebglVertexArray'
import type { WebglVertexBuffer } from './WebglVertexBuffer'

export class WeblVertexArrayCache {
  public readonly device: WebglDevice
  private cache = new Map<WebglShaderModule, Map<WebglVertexBuffer, Map<WebglBuffer | null, WebglVertexArray>>>()

  public constructor(device: WebglDevice) {
    this.device = device
  }

  public get(program: WebglShaderModule, vertexBuffer: WebglVertexBuffer, indexbuffer: WebglBuffer) {
    let perProgram = this.cache.get(program)
    if (!perProgram) {
      perProgram = new Map()
      this.cache.set(program, perProgram)
    }
    let perVertexBuffer = perProgram.get(vertexBuffer)
    if (!perVertexBuffer) {
      perVertexBuffer = new Map()
      perProgram.set(vertexBuffer, perVertexBuffer)
    }
    let vao = perVertexBuffer.get(indexbuffer)
    if (!vao) {
      vao = new WebglVertexArray(this.device, program, vertexBuffer, indexbuffer)
      vao.onDisposed.once((vao) => this.remove(vao.program, vao.vertexBuffer, vao.indexBuffer))
      perVertexBuffer.set(indexbuffer, vao)
    }
    return vao
  }

  private remove(program: WebglShaderModule, vertexBuffer: WebglVertexBuffer, indexbuffer: WebglBuffer) {
    const perProgram = this.cache.get(program)
    if (!perProgram) {
      return
    }
    const perVertexBuffer = perProgram.get(vertexBuffer)
    if (!perVertexBuffer) {
      return
    }
    perVertexBuffer.delete(indexbuffer)
  }
}
