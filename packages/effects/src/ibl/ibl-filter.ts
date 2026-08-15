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
  TRUE,
  typedProgramInputs,
} from '@gglib/graphics'
import { brand, Brand } from '@gglib/utils'
import { FULLSCREEN_GLSL_VS } from '../image/common.glsl'
import { IBL_SAMPLE_GLSL } from './ibl-filter.glsl'
import { IBL_SAMPLE_WGSL } from './ibl-filter.wgsl'

export function iblFilterShaderOptions(): ShaderModuleOptions {
  return {
    name: 'IBL Filter',
    wgsl: { source: IBL_SAMPLE_WGSL },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: IBL_SAMPLE_GLSL },
  }
}

export type IblDistributionFunction = Brand<number, 'IblDistributionFunction'>
export const IblDistributionFunction = {
  LAMBERT: brand<IblDistributionFunction>(0),
  GGX: brand<IblDistributionFunction>(1),
  CHARLIE: brand<IblDistributionFunction>(2),
}

export class IblFilterEffect {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    cubemap: inputSlot('', 'cubemap', 'texture'),

    currentFace: inputSlot('params', 'currentFace', 'scalar'),
    roughness: inputSlot('params', 'roughness', 'scalar'),
    samples: inputSlot('params', 'samples', 'scalar'),
    width: inputSlot('params', 'width', 'scalar'),
    lodBias: inputSlot('params', 'lodBias', 'scalar'),
    distribution: inputSlot('params', 'distribution', 'scalar'),
    isGeneratingLUT: inputSlot('params', 'isGeneratingLUT', 'scalar'),
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
  public lodBias: number = 0
  public distribution: IblDistributionFunction = IblDistributionFunction.GGX
  public cubemapIn: Texture
  public cubemapOut: Texture

  constructor(device: Device) {
    this.program = device.createShaderModule(iblFilterShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
    this.params.cubemap = device.defaultTextureCube
  }

  public render(pass: RenderEncoder) {
    const input = this.cubemapIn
    const output = this.cubemapOut
    console.assert(!!input, 'cubemapIn must be set')
    console.assert(input.type === 'TextureCube', 'cubemapIn must be a cubemap')
    console.assert(!!output, 'cubemapOut must be set')
    console.assert(output.type === 'TextureCube', 'cubemapOut must be a cubemap')
    console.assert(this.isValid && this.isCompiled, 'must be compiled and valid')

    const device = pass.device
    const params = this.params
    params.cubemap = input
    params.lodBias = this.lodBias
    params.samples = this.samples
    params.distribution = this.distribution
    params.isGeneratingLUT = FALSE

    const type = surfaceFormatDataType(output.format)
    const isFloat = type === 'float16' || type === 'float32'
    params.floatTexture = isFloat ? TRUE : FALSE
    params.intensity = this.intensity
    params.width = output.width

    for (let mipLevel = 0; mipLevel < output.mipLevelCount; mipLevel++) {
      const mipWidth = output.width >> mipLevel
      params.roughness = mipLevel / (output.mipLevelCount - 1)
      params.width = mipWidth

      if (device.isWebGPU) {
        this.program.applyBlocks(params.blocks)
        this.program.commit()
      }

      pass.setProgram(this.program)
      for (let i = 0; i < 6; ++i) {
        pass.setRenderTarget(0, output, mipLevel, i)
        pass.setViewportState(0, 0, mipWidth, mipWidth)
        pass.setClearColor(0, Color.Black)
        pass.clear()
      }
      for (let i = 0; i < 6; ++i) {
        pass.setRenderTarget(0, output, mipLevel, i)
        pass.setViewportState(0, 0, mipWidth, mipWidth)
        if (device.isWebGL2) {
          params.currentFace = i
          this.program.applyBlocks(params.blocks)
          this.program.commit()
          pass.draw(3)
        } else {
          pass.draw(
            3, // vertext count
            1, // instance count
            0, // vertext offset
            i, // instance offset -> current face
          )
        }
      }
      pass.submit() // noop for webgl2, but batches the commands for webgpu
      pass.setRenderTarget(0, null)
    }
  }

  public dispose() {
    this.program.dispose()
  }
}
