import {
  Device,
  DeviceOutput,
  inputSlot,
  Program,
  RenderEncoder,
  ShaderModuleOptions,
  Texture,
  typedProgramInputs,
} from '@gglib/graphics'
import { brand, Brand } from '@gglib/utils'
import { FULLSCREEN_GLSL_VS } from '../common.glsl'
import { COMBINE_GLSL_FS } from './combine.glsl'
import { COMBINE_WGSL_FS } from './combine.wgsl'

export function combineShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Combine Shader',
    wgsl: { source: COMBINE_WGSL_FS },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: COMBINE_GLSL_FS },
  }
}

export type CombineOperator = Brand<number, 'CombineOperator'>
export const CombineOperator = {
  ADD: brand<CombineOperator>(0),
  SUBTRACT: brand<CombineOperator>(1),
  MULTIPLY: brand<CombineOperator>(2),
  DIVIDE: brand<CombineOperator>(3),
  AVERAGE: brand<CombineOperator>(4),
  MIN: brand<CombineOperator>(5),
  MAX: brand<CombineOperator>(6),
  ABSOLUTE_DIFFERENCE: brand<CombineOperator>(7),
  SATURATING_ADD: brand<CombineOperator>(8),
  COLOR_DODGE: brand<CombineOperator>(9),
  COLOR_BURN: brand<CombineOperator>(10),
  LINEAR_BURN: brand<CombineOperator>(11),
}

export class CombineEffect {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    texture1: inputSlot('', 'colorMapA', 'texture'),
    texture2: inputSlot('', 'colorMapB', 'texture'),
    weight1: inputSlot('params', 'weightA', 'scalar'),
    weight2: inputSlot('params', 'weightB', 'scalar'),
    blend: inputSlot('params', 'blendFactor', 'scalar'),
    operatorId: inputSlot('params', 'operatorId', 'scalar'),
  })

  public readonly compiled: Promise<this>
  public get isCompiled() {
    return this.program.isCompiled
  }
  public get isValid() {
    return this.program.isValid
  }

  public textureIn1: Texture
  public textureIn2: Texture
  public textureOut: Texture | DeviceOutput
  public weight1: number = 1
  public weight2: number = 1
  public blend: number = 1
  public operator: CombineOperator = CombineOperator.ADD

  public constructor(device: Device) {
    this.program = device.createShaderModule(combineShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn1, 'input texture 1 must be set')
    console.assert(!!this.textureIn2, 'input texture 2 must be set')
    console.assert(!!this.textureOut, 'output texture must be set')

    const params = this.params
    params.operatorId = this.operator
    params.texture1 = this.textureIn1
    params.texture2 = this.textureIn2
    params.weight1 = this.weight1
    params.weight2 = this.weight2
    params.blend = this.blend
    this.program.applyBlocks(params.blocks)
    this.program.commit()

    pass.setRenderTarget(0, this.textureOut)
    pass.setViewportState(0, 0, this.textureOut.width, this.textureOut.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
  }
}
