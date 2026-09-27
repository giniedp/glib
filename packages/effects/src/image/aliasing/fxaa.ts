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
import { FXAA_WGSL } from './fxaa.wgsl'

export function fxaaShaderOptions(): ShaderModuleOptions {
  return {
    name: 'FXAA Shader',
    wgsl: { source: FXAA_WGSL },
    glsl: null,
  }
}

export class FxaaEffect {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    texture: inputSlot('', 'colorMap', 'texture'),
    sampler: inputSlot('', 'colorMapSampler', 'sampler'),
    thresholdMin: inputSlot('params', 'thresholdMin', 'scalar'),
    thresholdMax: inputSlot('params', 'thresholdMax', 'scalar'),
    quality: inputSlot('params', 'quality', 'scalar'),
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
  public thresholdMin: number = 0.0312
  public thresholdMax: number = 0.125
  public quality: number = 0.75

  public constructor(device: Device) {
    this.program = device.createShaderModule(fxaaShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn, 'input texture must be set')
    console.assert(!!this.textureOut, 'output texture must be set')

    const params = this.params
    params.thresholdMin = this.thresholdMin
    params.thresholdMax = this.thresholdMax
    params.quality = this.quality
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
