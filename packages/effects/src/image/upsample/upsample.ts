import {
  Device,
  DeviceOutput,
  inputSlot,
  type Ownable,
  Program,
  RenderEncoder,
  ResourceOwnership,
  ShaderModuleOptions,
  Texture,
  typedProgramInputs,
} from '@gglib/graphics'
import { brand, Brand } from '@gglib/utils'
import { FULLSCREEN_GLSL_VS } from '../common.glsl'
import { UPSAMPLE_GLSL_FS } from './upsample.glsl'
import { UPSAMPLE_WGSL_FS } from './upsample.wgsl'

export function upsampleShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Upsample',
    wgsl: { source: UPSAMPLE_WGSL_FS },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: UPSAMPLE_GLSL_FS },
  }
}

export type UpsampleOperator = Brand<number, 'UpsampleOperator'>
export const UpsampleOperator = {
  PASSTHROUGH: brand<UpsampleOperator>(0),
  TENT_3X3: brand<UpsampleOperator>(1),
  KAWASE: brand<UpsampleOperator>(2),
  BICUBIC: brand<UpsampleOperator>(3),
}

export class UpsampleEffect implements Ownable {
  /**
   * The ownership state of this effect
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  public readonly program: Program
  public readonly params = typedProgramInputs({
    texture: inputSlot('', 'colorMap', 'texture'),
    weight: inputSlot('params', 'weight', 'scalar'),
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
  public weight: number = 1
  public operator: UpsampleOperator = UpsampleOperator.PASSTHROUGH

  public constructor(device: Device) {
    const shader = this.ownership.adopt(device.acquireShaderModule(upsampleShaderOptions()))
    this.program = this.ownership.adopt(shader.program.clone())
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn, 'input texture must be set')
    console.assert(!!this.textureOut, 'output texture must be set')

    const params = this.params
    params.operatorId = this.operator
    params.texture = this.textureIn
    params.weight = this.weight
    this.program.applyBlocks(params.blocks)
    this.program.commit()

    pass.setRenderTarget(0, this.textureOut)
    pass.setViewportState(0, 0, this.textureOut.width, this.textureOut.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
  }

  /**
   * Immediately finalizes this effect and its program
   */
  public dispose() {
    this.ownership.finalize()
  }
}
