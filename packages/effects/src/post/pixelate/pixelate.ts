import {
  Device,
  Disposable,
  Program,
  Renderable,
  RenderEncoder,
  ShaderModuleOptions,
  Texture,
  typedInputAccessor,
  TypedInputAccessor,
} from '@gglib/graphics'
import { Vec2 } from '@gglib/math'
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

export type PixelateShaderParams = {
  'params.texelSize': Vec2
  'params.size': number
  'params.aspect': number
  'params.corner': number
  'params.dither': number
  'params.gap': number
  texture: Texture
}

export function pixelateShaderParams(): PixelateShaderParams {
  return {
    'params.texelSize': Vec2.create(1.0, 1.0),
    'params.size': 1,
    'params.aspect': 1,
    'params.corner': 0,
    'params.dither': 0,
    'params.gap': 0,
    texture: null,
  }
}

export class PixelateShader implements Renderable, Disposable {
  private program: Program
  private params: TypedInputAccessor<PixelateShaderParams>
  public get isReady(): boolean {
    return this.program.isReady
  }

  public texture: Texture
  public size = 10
  public aspect = 0
  public corner = 0
  public dither = 0
  public gap = 0

  public constructor(device: Device) {
    this.params = typedInputAccessor(pixelateShaderParams())
    this.program = device.createShaderModule(pixelateShaderOptions()).program.clone()
  }

  public render(pass: RenderEncoder) {
    if (!this.texture) {
      return
    }
    const params = this.params
    params.set('texture', this.texture)
    params.get('params.texelSize').init(1 / this.texture.width, 1 / this.texture.height)
    params.set('params.size', this.size)
    params.set('params.aspect', this.aspect)
    params.set('params.gap', this.gap)

    params.set('params.corner', this.corner)
    params.set('params.dither', this.dither)
    this.program.applyInputs(params)
    this.program.commit()
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
  }

  public dispose() {
    this.program.dispose()
  }
}
