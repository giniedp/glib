import {
  Device,
  DeviceOutput,
  inputSlot,
  type Ownable,
  Program,
  RenderEncoder,
  ResourceOwnership,
  SamplerState,
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

export class FxaaEffect implements Ownable {
  /**
   * The ownership state of this effect
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

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
  /**
   * Minimum local contrast for an edge, keeps dark areas untouched (FXAA 3.11 edgeThresholdMin, 0.0833 - 0.0312)
   */
  public thresholdMin: number = 0.0312
  /**
   * Local contrast relative to the brightest neighbor for an edge (FXAA 3.11 edgeThreshold, 0.333 - 0.063)
   */
  public thresholdMax: number = 0.125
  /**
   * Sub-pixel aliasing removal (FXAA 3.11 subpix): 1.0 softest, 0.75 default, 0.5 sharper, 0.25 almost off
   */
  public quality: number = 0.75

  public constructor(device: Device) {
    const shader = this.ownership.adopt(device.acquireShaderModule(fxaaShaderOptions()))
    this.program = this.ownership.adopt(shader.program.clone())
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
    // FXAA relies on bilinear fetches (edge search between two rows, final sub-pixel offset)
    params.sampler = SamplerState.LinearClamp
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
