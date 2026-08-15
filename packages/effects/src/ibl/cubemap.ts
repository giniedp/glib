import {
  Device,
  inputSlot,
  Program,
  RenderEncoder,
  ShaderModuleOptions,
  Texture,
  typedProgramInputs,
} from '@gglib/graphics'
import { FULLSCREEN_GLSL_VS } from '../image/common.glsl'
import { CUBEMAP_GLSL } from './cubemap.glsl'
import { CUBEMAP_WGSL } from './cubemap.wgsl'

export function panoramaToCubemapShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Panorama To Cubemap',
    wgsl: { source: CUBEMAP_WGSL },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: CUBEMAP_GLSL },
  }
}

export class PanoramaToCubemapEffect {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    texture: inputSlot('', 'colorMap', 'texture'),
    currentFace: inputSlot('params', 'currentFace', 'scalar'),
  })

  public compiled: Promise<this>
  public get isCompiled() {
    return this.program.isCompiled
  }
  public get isValid() {
    return this.program.isValid
  }

  public textureIn: Texture
  public textureOut: Texture

  public constructor(device: Device) {
    this.program = device.createShaderModule(panoramaToCubemapShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn, 'input texture must be set')
    console.assert(!!this.textureOut, 'output texture must be set')
    console.assert(this.textureOut.type === 'TextureCube', 'output texture must be a cubemap')

    const isWebGPU = pass.device.isWebGPU
    const params = this.params
    params.texture = this.textureIn

    if (isWebGPU) {
      this.program.applyBlocks(params.blocks)
      this.program.commit()
    }
    pass.setProgram(this.program)

    for (let i = 0; i < 6; i++) {
      pass.setRenderTarget(0, this.textureOut, 0, i)
      pass.setViewportState(0, 0, this.textureOut.width, this.textureOut.height)

      if (!isWebGPU) {
        params.currentFace = i
        this.program.applyBlocks(params.blocks)
        this.program.commit()
        pass.draw(3)
      } else {
        pass.draw(3, 1, 0, i)
      }
    }

    pass.submit()
    pass.setRenderTarget(0, null)
  }
}
