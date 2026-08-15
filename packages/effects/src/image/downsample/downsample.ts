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
import { DOWNSAMPLE_GLSL_FS } from './downsample.glsl'
import { DOWNSAMPLE_WGSL_FS } from './downsample.wgsl'

export function downsampleShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Downsample',
    wgsl: { source: DOWNSAMPLE_WGSL_FS },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: DOWNSAMPLE_GLSL_FS },
  }
}

export type DownsampleOperator = Brand<number, 'DownsampleOperator'>
export const DownsampleOperator = {
  BILINEAR_2X2: brand<DownsampleOperator>(0),
  BILINEAR_4X4: brand<DownsampleOperator>(1),
  KAWASE: brand<DownsampleOperator>(2),
  JIMENEZ_13TAP: brand<DownsampleOperator>(3),
  JIMENEZ_13TAP_KARIS: brand<DownsampleOperator>(4),
}

export class DownsampleEffect {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    texture: inputSlot('', 'colorMap', 'texture'),
    operatorId: inputSlot('params', 'operatorId', 'scalar'),
  })

  public compiled: Promise<this>
  public get isCompiled() {
    return this.program.isCompiled
  }
  public get isValid() {
    return this.program.isValid
  }

  public textureIn: Texture
  public textureOut: Texture | DeviceOutput
  public operator: DownsampleOperator = DownsampleOperator.BILINEAR_2X2

  public constructor(device: Device) {
    this.program = device.createShaderModule(downsampleShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn, 'input texture must be set')
    console.assert(!!this.textureOut, 'output texture must be set')

    const params = this.params
    params.operatorId = this.operator
    params.texture = this.textureIn
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
