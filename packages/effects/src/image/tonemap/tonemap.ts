import {
  Device,
  DeviceOutput,
  Disposable,
  FALSE,
  inputSlot,
  Program,
  Renderable,
  RenderEncoder,
  ShaderModuleOptions,
  Texture,
  TRUE,
  typedProgramInputs,
} from '@gglib/graphics'
import { brand, Brand } from '@gglib/utils'
import { FULLSCREEN_GLSL_VS } from '../common.glsl'
import { TONEMAP_GLSL_FS } from './tonemap.glsl'
import { TONEMAP_WGSL } from './tonemap.wgsl'

export function tonemapShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Tonemap Shader',
    wgsl: { source: TONEMAP_WGSL },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: TONEMAP_GLSL_FS },
  }
}

export type TonemapOperator = Brand<number, 'Tonemap'>
export const TonemapOperator = {
  PASSTHROUGH: brand<TonemapOperator>(0),
  REINHARD: brand<TonemapOperator>(1),
  REINHARD_EXTENDED: brand<TonemapOperator>(2),
  REINHARD_JODIE: brand<TonemapOperator>(3),
  UNCHARTED2: brand<TonemapOperator>(4),
  ACES_NARKOWICZ: brand<TonemapOperator>(5),
  ACES_HILL: brand<TonemapOperator>(6),
  PBR_NEUTRAL: brand<TonemapOperator>(7),
  UCHIMURA: brand<TonemapOperator>(8),
}

export class TonemapEffect implements Renderable, Disposable {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    Texture1: inputSlot('', 'texture1', 'texture'),
    Texture2: inputSlot('', 'texture2', 'texture'),
    Operator: inputSlot('params', 'operatorId', 'scalar'),
    AutoExposure: inputSlot('params', 'autoExposure', 'scalar'),
    AdaptSpeed: inputSlot('params', 'adaptSpeed', 'scalar'),
    Exposure: inputSlot('params', 'exposure', 'scalar'),
    WhitePoint: inputSlot('params', 'whitePoint', 'scalar'),
    Srgb: inputSlot('params', 'srgb', 'scalar'),
  })

  public readonly compiled: Promise<TonemapEffect>
  public get isCompiled(): boolean {
    return this.program.isCompiled
  }
  public get isValid(): boolean {
    return this.program.isValid
  }

  /**
   * The input texture
   */
  public textureIn: Texture

  /**
   * The output render target
   */
  public textureOut: Texture | DeviceOutput

  /**
   * The texture holding luminace value from auto exposure pass
   */
  public textureLuminance: Texture | null

  /**
   * The tonemapping operator
   */
  public operator: TonemapOperator = TonemapOperator.PBR_NEUTRAL

  /**
   *
   */
  public exposure = 1.0

  /**
   * White point parameter. Only used by:
   * - REINHARD_EXTENDED
   * - UNCHARTED2
   * - UCHIMURA
   */
  public whitePoint = 1.0

  /**
   * Converts to srgb after tonemapping
   */
  public srgb = false

  public constructor(device: Device) {
    this.program = device.createShaderModule(tonemapShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn, 'input texture must be set')
    console.assert(!!this.textureOut, 'output texture must be set')

    const inputs = this.params
    inputs.Operator = this.operator
    inputs.Exposure = this.exposure
    inputs.WhitePoint = this.whitePoint
    inputs.AutoExposure = !!this.textureLuminance ? TRUE : FALSE
    inputs.Srgb = this.srgb ? TRUE : FALSE

    const program = this.program
    const target = this.textureOut

    inputs.Texture1 = this.textureIn
    inputs.Texture2 = this.textureLuminance ?? pass.device.defaultTexture
    program.applyBlocks(inputs.blocks)
    program.commit()
    pass.setProgram(program)
    pass.setRenderTarget(0, target)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
  }

  public dispose() {
    this.program.dispose()
  }
}
