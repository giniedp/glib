import { ShaderType } from '../../enums'
import { ShaderProgram, ShaderProgramOptions } from '../../resources'

import { DeviceGPU } from '../DeviceGPU'
import { ShaderGPU } from './ShaderGPU'

export class ShaderProgramGPU extends ShaderProgram {

  public readonly device: DeviceGPU
  public readonly vertexShader: ShaderGPU
  public readonly fragmentShader: ShaderGPU
  public readonly isReady = true
  public readonly whenReady: Promise<boolean> = Promise.resolve(true) // TODO
  public get vertexStageDescriptor() {
    return this.vertexShader ? this.vertexShader.descriptor : null
  }

  public get fragmentStageDescriptor() {
    return this.fragmentShader ? this.fragmentShader.descriptor : null
  }

  constructor(device: DeviceGPU, options: ShaderProgramOptions = {}) {
    super()
    this.device = device
    this.vertexShader = this.convertShaderSource(ShaderType.VertexShader, options.vertexShader) as ShaderGPU
    this.fragmentShader = this.convertShaderSource(ShaderType.FragmentShader, options.fragmentShader) as ShaderGPU
    this.create()
  }

  public create(): this {
    return this
  }

  public dispose(): this {
    return this
  }
}
