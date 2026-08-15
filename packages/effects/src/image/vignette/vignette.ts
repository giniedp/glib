import {
  Device,
  Program,
  Renderable,
  RenderEncoder,
  ShaderModuleOptions,
  Texture,
  typedInputAccessor,
  TypedInputAccessor,
} from '@gglib/graphics'
import { Vec2, Vec3 } from '@gglib/math'
import { VIGNETTE_GLSL_FRAGMENT, VIGNETTE_GLSL_VERTEX } from './vignette.glsl'
import { VIGNETTE_WGSL } from './vignette.wgsl'

export function vignetteShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Vignette Shader',
    wgsl: { source: VIGNETTE_WGSL },
    glsl: {
      vertex: VIGNETTE_GLSL_VERTEX,
      fragment: VIGNETTE_GLSL_FRAGMENT,
    },
  }
}

export type VignetteShaderParams = {
  'params.center': Vec2
  'params.radius': Vec2
  'params.inner': number
  'params.strength': number
  'params.power': number
  'params.aspect': number
  'params.color': Vec3
  texture: Texture
}

export function vignetteShaderParams(): VignetteShaderParams {
  return {
    'params.center': Vec2.create(0.5, 0.5),
    'params.radius': Vec2.create(0.5, 0.5),
    'params.inner': 0.5,
    'params.strength': 0.5,
    'params.power': 1,
    'params.aspect': 1,
    'params.color': Vec3.create(0, 0, 0),

    texture: null,
  }
}

export class VignetteShader implements Renderable {
  public textureInput: Texture
  public textureOuput: Texture
  public get isReady(): boolean {
    return this.program.isCompiled
  }

  public centerX: number = 0.5
  public centerY: number = 0.5
  public radiusX: number = 0.5
  public radiusY: number = 0.5
  public inner: number = 0.5
  public strength: number = 0.5
  public power: number = 1
  public aspect: number = 1
  public color: Vec3 = Vec3.create(0, 0, 0)
  public texture: Texture

  private program: Program
  private params: TypedInputAccessor<VignetteShaderParams>
  public constructor(device: Device) {
    this.params = typedInputAccessor(vignetteShaderParams())
    this.program = device.createShaderModule(vignetteShaderOptions()).program.clone()
  }

  public render(pass: RenderEncoder): void {
    const params = this.params

    params.set('texture', this.textureInput)
    params.get('params.center').init(this.centerX, this.centerY)
    params.get('params.radius').init(this.radiusX, this.radiusY)
    params.set('params.inner', this.inner)
    params.set('params.strength', this.strength)
    params.set('params.power', this.power)
    params.set('params.aspect', this.aspect)
    params.set('params.color', this.color)

    this.program.applyInputs(params)
    this.program.commit()
    pass.setRenderTarget(0, this.textureOuput)
    pass.setViewportState(0, 0, this.textureOuput.width, this.textureOuput.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
  }
}
