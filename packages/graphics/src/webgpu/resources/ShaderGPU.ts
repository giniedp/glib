import { Log } from '@gglib/utils'
import { nameOfShaderType, ShaderType, valueOfShaderType } from '../../enums'
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
    this.type = valueOfShaderType(options.type)
    this.typeName = nameOfShaderType(this.type)
    if (!this.typeName) {
      Log.w('[Shader] unknown "type" option', options.type, this)
    }
    if (this.source) {
      this.compile()
    }
  }

  public compile() {
    this.descriptor.module = this.device.device.createShaderModule({
      code: this.device.glslang.compileGLSL(this.source.trim(), this.type === ShaderType.VertexShader ? 'vertex' : 'fragment', true),
    })
    this.compiled = !!this.descriptor.module
    return this
  }

  public destroy() {
    this.descriptor.module = null
    this.compiled = false
    return this
  }
}
