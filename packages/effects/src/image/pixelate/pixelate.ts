import {
  Device,
  Disposable,
  inputSlot,
  type Ownable,
  Program,
  Renderable,
  RenderEncoder,
  ResourceOwnership,
  ShaderModuleOptions,
  Texture,
  typedProgramInputs,
} from '@gglib/graphics'
import { PIXELATE_GLSL_FRAGMENT, PIXELATE_GLSL_VERTEX } from './pixelate.glsl'
import { PIXELATE_WGSL } from './pixelate.wgsl'

export function pixelateShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Pixelate Shader',
    wgsl: { source: PIXELATE_WGSL },
    glsl: {
      vertex: PIXELATE_GLSL_VERTEX,
      fragment: PIXELATE_GLSL_FRAGMENT,
    },
  }
}

export const PixelateShaderSchema = {
  TexelX: inputSlot('params', 'texelx', 'scalar'),
  TexelY: inputSlot('params', 'texely', 'scalar'),
  Size: inputSlot('params', 'size', 'scalar'),
  Aspect: inputSlot('params', 'aspect', 'scalar'),
  Corner: inputSlot('params', 'corner', 'scalar'),
  Dither: inputSlot('params', 'dither', 'scalar'),
  Gap: inputSlot('params', 'gap', 'scalar'),
  Texture: inputSlot('', 'texture', 'texture'),
}

export class PixelateShader implements Renderable, Disposable, Ownable {
  /**
   * The ownership state of this effect
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  public readonly program: Program
  public readonly inputs = typedProgramInputs(PixelateShaderSchema)
  public get isReady(): boolean {
    return this.program.isCompiled
  }

  public readonly combiled: Promise<PixelateShader>
  public get isCombiled() {
    return this.program.isCompiled
  }
  public get isValid() {
    return this.program.isValid
  }

  public texture: Texture
  public size = 10
  public aspect = 1
  public corner = 0
  public dither = 0
  public gap = 0

  public constructor(device: Device) {
    const shader = this.ownership.adopt(device.acquireShaderModule(pixelateShaderOptions()))
    this.program = this.ownership.adopt(shader.program.clone())
    this.combiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    if (!this.texture) {
      return
    }
    const inputs = this.inputs
    inputs.Texture = this.texture
    inputs.TexelX = 1 / this.texture.width
    inputs.TexelY = 1 / this.texture.height
    inputs.Size = this.size
    inputs.Aspect = this.aspect
    inputs.Gap = this.gap
    inputs.Corner = this.corner
    inputs.Dither = this.dither

    this.program.applyBlocks(inputs.blocks)
    this.program.commit()
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
  }

  /**
   * Immediately finalizes this effect and its program
   */
  public dispose() {
    this.ownership.finalize()
  }
}
