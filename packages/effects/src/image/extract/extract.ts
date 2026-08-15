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
import { IVec3, vec3 } from '@gglib/math'
import { brand, Brand } from '@gglib/utils'
import { FULLSCREEN_GLSL_VS } from '../common.glsl'
import { EXTRACT_GLSL_FS } from './extract.glsl'
import { EXTRACT_WGSL_FS } from './extract.wgsl'

export function extractShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Extract Shader',
    wgsl: { source: EXTRACT_WGSL_FS },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: EXTRACT_GLSL_FS },
  }
}

export type ExtractOperator = Brand<number, 'Extract Operator'>
export const ExtractOperator = {
  PASSTHROUGH: brand<ExtractOperator>(0),
  LUMINANCE: brand<ExtractOperator>(1),
  LOG_LUMINANCE: brand<ExtractOperator>(2),
  MAX_BRIGHTNESS: brand<ExtractOperator>(3),
  HIGH_PASS: brand<ExtractOperator>(4),
  BAND_PASS: brand<ExtractOperator>(5),
  COLOR_KEY_RGB: brand<ExtractOperator>(6),
  COLOR_KEY_CHROMA: brand<ExtractOperator>(7),
}

export class ExtractEffect {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    texture: inputSlot('', 'colorMap', 'texture'),
    colorKey: inputSlot('params', 'colorKey', 'vec3'),
    threshold: inputSlot('params', 'threshold', 'scalar'),
    range: inputSlot('params', 'range', 'scalar'),
    knee: inputSlot('params', 'knee', 'scalar'),
    operatorId: inputSlot('params', 'operatorId', 'scalar'),
  })

  public readonly compiled: Promise<this>
  public get isCompiled() {
    return this.program.isCompiled
  }
  public get isValid() {
    return this.program.isValid
  }

  public textureIn: Texture
  public textureOut: Texture | DeviceOutput
  public knee: number = 0
  public range: number = 0
  public threshold: number = 0
  public colorKey: IVec3 = vec3(0)
  public operatorId = ExtractOperator.PASSTHROUGH

  public constructor(device: Device) {
    this.program = device.createShaderModule(extractShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn, 'input texture must be set')
    console.assert(!!this.textureOut, 'output texture must be set')

    this.params.texture = this.textureIn
    this.params.knee = this.knee
    this.params.range = this.range
    this.params.threshold = this.threshold
    this.params.operatorId = this.operatorId
    this.params.colorKey = this.colorKey
    this.program.applyBlocks(this.params.blocks)
    this.program.commit()
    pass.setRenderTarget(0, this.textureOut)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
  }
}
