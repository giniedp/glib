import { ShaderType } from '../../enums'
import { ShaderProgram, ShaderProgramOptions } from '../../resources'
import { ShaderInspector, ShaderObjectInfo } from '../../ShaderInspector'
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
    const inspection = ShaderInspector.inspectProgram(this.vertexShader.source, this.fragmentShader.source)
    this.assignInputs(inspection.inputs)
    this.assignUniforms(inspection.uniforms)
    return this
  }

  public destroy(): this {
    return this
  }

  private assignInputs(inputs: { [key: string]: ShaderObjectInfo }): this {
    this.bind()
    // TODO:
    // this.inputs.clear()
    // this.inputLocations.length = 0
    // Object.keys(inputs).forEach((key) => {
    //   const input = inputs[key]
    //   const location = this.device.context.getAttribLocation(this.handle, input.name || key)
    //   if (location >= 0) {
    //     this.inputs.set(key, {
    //       ...input,
    //       location: location,
    //     })
    //     this.inputLocations.push(location)
    //   }
    // })
    return this
  }

  /**
   *
   */
  private assignUniforms(uniforms: { [key: string]: ShaderObjectInfo }): this {
    this.bind()
    // TODO:
    // const u = this.uniforms as Map<string, ShaderUniform>
    // u.clear()
    // Object.keys(uniforms).forEach((key) => {
    //   const options = uniforms[key]
    //   if (!options.name && !options.binding) {
    //     return
    //   }
    //   const uniform = new ShaderUniform(this, options)
    //   if (uniform.location != null) {
    //     u.set(key, uniform)
    //     Log.debug(`ShaderProgram ${this.uid.substr(0, 8)}... binds uniform '${uniform.meta.name}' to '${uniform.name}'`)
    //   }
    // })
    return this
  }
}
