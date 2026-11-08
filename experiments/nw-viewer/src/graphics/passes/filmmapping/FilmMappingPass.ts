import { TextureUsage, type Device, type Program, type Texture } from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../../material/common'
import type { LuminancePass } from '../exposure/LuminancePass'
import { FILM_MAPPING_WGSL } from './FilmMappingPass.wgsl'

/**
 * Tone mapping of the game: exposure, saturation, color balance and the film curve from the time of day.
 *
 * @remarks
 * Hands over to the `fallback` pass unless {@link InputSlots.FilmMapping.Enabled} is set,
 * see the `tonemapper` config value.
 *
 * Exposure comes from the adapted luminance of the {@link LuminancePass} (EV mode of the game), or the constant
 * {@link InputSlots.FilmMapping.Exposure} with the `exposure: fixed` config.
 */
export class FilmMappingPass implements RenderPass {
  public name = 'Film Mapping'
  public enabled = true

  /**
   * Tone mapping used instead of the film mapping, when the time of day disables it (config `tonemapper`)
   */
  public readonly fallback: RenderPass

  private program: Program
  private isActive = false
  private source: FrameResource
  private target: FrameResource
  private eyeAdaptation = new Float32Array(4)
  private fallback1x1: Texture

  private luminance: LuminancePass | null

  /**
   * @param luminance - source of the adapted luminance, fixed exposure while it is missing or disabled
   */
  public constructor(device: Device, fallback: RenderPass, luminance: LuminancePass | null) {
    this.fallback = fallback
    this.luminance = luminance
    device.ready.then(() => {
      this.program = device
        .createShaderModule({ name: 'NW Film Mapping', wgsl: { source: FILM_MAPPING_WGSL } })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    const inputs = ctx.renderInputs
    this.isActive =
      this.enabled && !!this.program?.isCompiled && !!inputs.get(InputSlots.FilmMapping.Enabled)
    if (!this.isActive) {
      this.fallback.setup(frame, ctx)
      return
    }
    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    this.target = frame.write(RenderChannel.Color)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const inputs = ctx.renderInputs
    const program = this.program
    const target = this.target.texture
    program.set('params.colorBalance', inputs.get(InputSlots.FilmMapping.ColorBalance))
    program.set('params.filmCurve', inputs.get(InputSlots.FilmMapping.FilmCurve))
    program.set('params.exposure', inputs.get(InputSlots.FilmMapping.Exposure))
    const lumMap = this.luminance?.adaptedLuminance
    const eye = inputs.get(InputSlots.FilmMapping.EyeAdaptation)
    // fixed exposure until the luminance pass has produced a value
    this.eyeAdaptation[0] = eye?.x ?? 0
    this.eyeAdaptation[1] = eye?.y ?? 0
    this.eyeAdaptation[2] = eye?.z ?? 0
    this.eyeAdaptation[3] = lumMap && eye?.w ? 1 : 0
    program.set('params.eyeAdaptation', this.eyeAdaptation)
    program.mustSet('lumMap', lumMap ?? this.fallbackLumMap(ctx))
    program.mustSet('sourceMap', this.source.texture)
    program.commit()

    const pass = ctx.device.renderPass
    pass.flush()
    pass.setRenderTarget(0, target)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
    pass.flush()
  }

  private fallbackLumMap(ctx: RenderContext): Texture {
    this.fallback1x1 ||= ctx.device.createRenderTarget({
      type: '2d',
      format: 'rgba16float',
      width: 1,
      height: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    })
    return this.fallback1x1
  }

  public cleanup(ctx: RenderContext): void {
    if (!this.isActive) {
      this.fallback.cleanup(ctx)
    }
  }
}
