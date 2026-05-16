import type { Buffer, ProgramInputType, Texture } from '../../resources'
import { SamplerState } from '../../states'
import type { WebglDevice } from '../WebglDevice'
import type { WebglReflectUniform } from './WebglReflection'
import type { WebglShaderModule } from './WebglShaderModule'
import type { WebglTexture } from './WebglTexture'
import type { WebglUniform } from './WebglUniform'

export class WebglUniformSamplerBinding implements WebglUniform {
  public readonly device: WebglDevice
  public readonly name: string
  public readonly alias: string
  public readonly type: ProgramInputType
  public readonly sampler: SamplerState
  public readonly texture: WebglTexture
  public readonly unit: number

  public constructor(program: WebglShaderModule, info: WebglReflectUniform) {
    this.device = program.device
    this.sampler = SamplerState.Default
    this.texture = this.device.defaultTexture
    this.unit = info.textureIndex
    this.name = info.name
    this.alias = info.alias
    this.type = info.type.container
  }

  public setBuffer(_value: Buffer): void {
    throw new Error('Can not set buffer on sampler parameter.')
  }

  public beginWrite(_index: number) {
    throw new Error('Cannot seek on sampler parameter.')
  }

  public write(_value: number): void {
    throw new Error('Cannot write numeric value to sampler parameter.')
  }

  public endWrite(): void {
    throw new Error('Cannot write numeric value to sampler parameter.')
  }

  public setTexture(value: Texture): void {
    value ||= this.device.defaultTexture
    ;(this as Mutable<this>).texture = value as WebglTexture
  }

  public setSampler(value: SamplerState): void {
    value ||= SamplerState.Default
    ;(this as Mutable<this>).sampler = value
  }
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
