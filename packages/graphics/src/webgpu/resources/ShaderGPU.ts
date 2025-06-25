import { Log } from '@gglib/utils'
import { Shader, ShaderOptions } from '../../resources'
import { DeviceGPU } from '../DeviceGPU'

export class ShaderGPU extends Shader {
  public readonly device: DeviceGPU

  public readonly descriptor: GPUProgrammableStageDescriptor = {
    module: null,
    entryPoint: 'main',
  }

  /**
   *
   */
  constructor(device: DeviceGPU, options: ShaderOptions) {
    super()
    this.device = device
    this.source = options.source
    this.type = options.type
    if (!this.type) {
      Log.warn('[Shader] unknown "type" option', options.type, this)
    }
    if (this.source) {
      this.compile()
    }
  }

  public compile() {
    const source = this.source.trim()
    // const code = this.device.glslang.compileGLSL(source, this.type === ShaderType.VertexShader ? 'vertex' : 'fragment', true)
    this.descriptor.module = this.device.device.createShaderModule({
      code: source,
    })
    this.compiled = !!this.descriptor.module
    return this
  }

  public dispose() {
    this.descriptor.module = null
    this.compiled = false
    return this
  }
}
