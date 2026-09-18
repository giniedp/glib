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
import { RESOLVE_MSAA_WGSL_FS } from './resolve-msaa.wgsl'

export function resolveMsaaShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Resolce MSAA Shader',
    wgsl: { source: RESOLVE_MSAA_WGSL_FS },
    // glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: RESOLVE_MSAA_GLSL },
  }
}

export type ResolveMsaaOperator = Brand<number, 'Resolve MSAA'>
export const ResolveMsaaOperator = {
  PASSTHROUGH: brand<ResolveMsaaOperator>(0),
  KARIS: brand<ResolveMsaaOperator>(1),
  MIN: brand<ResolveMsaaOperator>(2),
  MAX: brand<ResolveMsaaOperator>(3),
}

export class ResolveMsaaEffect {
  public program: Program
  public readonly params = typedProgramInputs({
    texture: inputSlot('params', 'colorMap', 'texture'),
    operatorId: inputSlot('params', 'operatorId', 'scalar'),
  })

  public readonly compiled: Promise<this>
  public get isCompiled() {
    return !!this.program?.isCompiled
  }
  public get isValid() {
    return !!this.program?.isValid
  }

  public textureIn: Texture
  public textureOut: Texture | DeviceOutput
  public operatorId = ResolveMsaaOperator.PASSTHROUGH

  public constructor(
    device: Device,
    options?: {
      operator: ResolveMsaaOperator
    },
  ) {
    device.ready.then(() => {
      this.program = device.createShaderModule(resolveMsaaShaderOptions()).program.clone()
    })
    this.compiled = device.ready.then(() => this.program.compiled).then(() => this)
    this.operatorId = options?.operator ?? ResolveMsaaOperator.PASSTHROUGH
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn, 'input texture must be set')
    console.assert(!!this.textureOut, 'output texture must be set')

    this.params.texture = this.textureIn
    this.params.operatorId = this.operatorId
    this.program.applyBlocks(this.params.blocks)
    this.program.commit()
    pass.setRenderTarget(0, this.textureOut)
    pass.setViewportState(0, 0, this.textureOut.width, this.textureOut.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
  }

  public resolve(pass: RenderEncoder, input: Texture, output: Texture) {
    this.textureIn = input
    this.textureOut = output
    this.render(pass)
  }
}
