import {
  Color,
  Device,
  FALSE,
  inputSlot,
  Program,
  RenderEncoder,
  ShaderModuleOptions,
  surfaceFormatDataType,
  Texture,
  TextureOptions,
  TRUE,
  typedProgramInputs,
} from '@gglib/graphics'
import { FULLSCREEN_GLSL_VS } from '../image/common.glsl'
import { IBL_BRDF_LUT_GLSL } from './ibl-brdf-lut.glsl'
import { IBL_BRDF_LUT_WGSL } from './ibl-brdf-lut.wgsl'
import { IblDistributionFunction } from './ibl-filter'

export function iblBrdfLutShaderOptions(): ShaderModuleOptions {
  return {
    name: 'IBL BRDF LUT Shader',
    wgsl: { source: IBL_BRDF_LUT_WGSL },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: IBL_BRDF_LUT_GLSL },
  }
}

export function createGGXLutTexture(device: Device, options?: TextureOptions) {
  const texture = device.createRenderTarget({
    name: 'BRDF GGX LUT',
    type: 'Texture2D',
    width: 512,
    height: 512,
    format: 'RG16_FLOAT',
    mipLevelCount: 1,
    ...options,
  })
  new IblBRDFLutEffect(device).compiled.then((fx) => {
    fx.textureOut = texture
    fx.samples = 512
    fx.render(device.renderPass)
    device.renderPass.flush()
    fx.dispose()
  })
  return texture
}

export class IblBRDFLutEffect {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    samples: inputSlot('params', 'samples', 'scalar'),
    distribution: inputSlot('params', 'distribution', 'scalar'),
    floatTexture: inputSlot('params', 'floatTexture', 'scalar'),
    intensity: inputSlot('params', 'intensity', 'scalar'),
  })

  public readonly compiled: Promise<this>
  public get isCompiled() {
    return this.program.isCompiled
  }
  public get isValid() {
    return this.program.isValid
  }

  public samples: number = 64
  public intensity: number = 1.0
  public distribution: IblDistributionFunction = IblDistributionFunction.GGX

  public textureOut: Texture

  constructor(device: Device) {
    this.program = device.createShaderModule(iblBrdfLutShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    const output = this.textureOut
    console.assert(!!output, 'textureOut must beset')

    const params = this.params
    params.samples = this.samples
    params.distribution = this.distribution

    const type = surfaceFormatDataType(output.format)
    const isFloat = type === 'float16' || type === 'float32'
    params.floatTexture = isFloat ? TRUE : FALSE
    params.intensity = this.intensity

    this.program.applyBlocks(params.blocks)
    this.program.commit()

    pass.setRenderTarget(0, output)
    pass.setClearColor(0, Color.Black)
    pass.setViewportState(0, 0, output.width, output.height)
    pass.clear()

    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()

    pass.setRenderTarget(0, null)
  }

  public dispose() {
    this.program.dispose()
  }
}
