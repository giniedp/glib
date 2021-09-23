import { ShaderType } from '../../enums'
import { ShaderProgram, ShaderProgramOptions } from '../../resources'

import { DeviceGPU } from '../DeviceGPU'
import { ShaderGPU } from './ShaderGPU'

export class ShaderProgramGPU extends ShaderProgram {

  public readonly device: DeviceGPU
  public readonly vertexShader: ShaderGPU
  public readonly fragmentShader: ShaderGPU

  public get vertexStageDescriptor() {
    return this.vertexShader ? this.vertexShader.descriptor : null
  }

  public get fragmentStageDescriptor() {
    return this.fragmentShader ? this.fragmentShader.descriptor : null
  }

  constructor(device: DeviceGPU, options: ShaderProgramOptions = {}) {
    super()
    this.device = device
    this.vertexShader = this.getShader(ShaderType.VertexShader, options.vertexShader) as ShaderGPU
    this.fragmentShader = this.getShader(ShaderType.FragmentShader, options.fragmentShader) as ShaderGPU
    this.create()
  }

  public create(): this {
    return this
  }

  public destroy(): this {
    return this
  }
}
