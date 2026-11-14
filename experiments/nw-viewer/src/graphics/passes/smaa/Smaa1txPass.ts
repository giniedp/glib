import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import {
  BlendState,
  CommonInputs,
  DepthState,
  SamplerState,
  TextureUsage,
  type Device,
  type Program,
  type Texture,
} from '@gglib/graphics'
import type { Mat4 } from '@gglib/math'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'

/**
 * SMAA_1TX_PS (postaa.cfx): temporal resolve after the SMAA neighborhood blending. The history is reprojected with
 * the camera only (static geometry, no object motion vectors), clamped to the color range of the current 2x2
 * neighbourhood and blended by the high frequency content: 1/2 of the current frame in flat areas, 1/6 at edges.
 */
export const SMAA_1TX_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct Smaa1txParams {
  inverseViewProjection : mat4x4f,
  previousViewProjection: mat4x4f,
  camera                : vec4f, // xyz = position, w = far
  values                : vec4f, // x = 1 while the history is valid
};
@group(0) @binding(0) var<uniform> params: Smaa1txParams;
@group(0) @binding(1) var source: texture_2d<f32>;
@group(0) @binding(2) var history: texture_2d<f32>;
@group(0) @binding(3) var linearDepth: texture_2d<f32>;
@group(0) @binding(4) var linearSampler: sampler;

// frames to keep in history: higher = less aliasing but blurrier (SMAA_TEMPORAL_LOW_FREQ / HI_FREQ)
const TEMPORAL_LOW_FREQ: f32 = 2.0;
const TEMPORAL_HI_FREQ: f32 = 6.0;
// max(1 + r_AntialiasingNonTAASharpening, 1) with the default 0: the current pixel is not blurred
const SHARPENING: f32 = 1.0;

// texture coordinate of the pixel in the previous frame (TAAGetReprojectedMotionVector, camera motion only)
fn reproject(uv: vec2f, viewDepth: f32) -> vec2f {
  // reversed-z: 0 is the far plane
  let ndc = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  let farH = params.inverseViewProjection * ndc;
  let farPos = farH.xyz / farH.w;
  let world = params.camera.xyz + (farPos - params.camera.xyz) * (viewDepth / params.camera.w);
  let prev = params.previousViewProjection * vec4f(world, 1.0);
  let prevNdc = prev.xy / prev.w;
  return vec2f(prevNdc.x * 0.5 + 0.5, 0.5 - prevNdc.y * 0.5);
}

@fragment
fn fs(in: FragmentInput) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(source));
  let texel = 1.0 / size;
  let tc = in.uv;

  // current pixel and the bilinear averages of its 2x2 neighbourhoods
  var cM = textureLoad(source, vec2i(in.position.xy), 0);
  let cTL = textureSampleLevel(source, linearSampler, tc + texel * vec2f(-0.5, -0.5), 0.0);
  let cTR = textureSampleLevel(source, linearSampler, tc + texel * vec2f( 0.5, -0.5), 0.0);
  let cBL = textureSampleLevel(source, linearSampler, tc + texel * vec2f(-0.5,  0.5), 0.0);
  let cBR = textureSampleLevel(source, linearSampler, tc + texel * vec2f( 0.5,  0.5), 0.0);

  let cBlur = (cTL + cTR + cBL + cBR) * 0.25;
  cM = mix(cBlur, cM, SHARPENING);

  let cMin = min(min(min(min(cTL, cTR), cBL), cBR), cM);
  let cMax = max(max(max(max(cTL, cTR), cBL), cBR), cM);

  var viewDepth = textureLoad(linearDepth, vec2i(in.position.xy), 0).r;
  // pixels without geometry lie on the far plane
  if (viewDepth <= 0.0) {
    viewDepth = params.camera.w;
  }
  let prevUV = reproject(tc, viewDepth);
  if (params.values.x < 0.5 || any(prevUV < vec2f(0.0)) || any(prevUV > vec2f(1.0))) {
    return cM;
  }

  let cAcc = textureSampleLevel(history, linearSampler, prevUV, 0.0);
  // limit the history to the color range of the current frame
  let cAccClamped = clamp(cAcc, cMin, cMax);
  let cHiFreq = abs(cBlur - cM);
  return mix(cAccClamped, cM, saturate(1.0 / mix(vec4f(TEMPORAL_LOW_FREQ), vec4f(TEMPORAL_HI_FREQ), cHiFreq)));
}
`

const COPY_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

@group(0) @binding(0) var source: texture_2d<f32>;

@fragment
fn fs(in: FragmentInput) -> @location(0) vec4f {
  return textureLoad(source, vec2i(in.position.xy), 0);
}
`

/**
 * The temporal part of the game's SMAA 1TX (r_AntialiasingMode 2), after the {@link SmaaPass}.
 *
 * @remarks
 * Keeps its output in two persistent textures (the history of the next frame) and copies it into the color.
 * Without camera jitter like the game (its jitter is for TAA only). The history restarts when the pass was skipped
 * a frame or the size changed.
 */
export class Smaa1txPass implements RenderPass {
  public name = 'SMAA 1TX'
  public enabled = true

  private device: Device
  private program: Program
  private copyProgram: Program
  private isActive = false
  private color: FrameResource
  private depth: FrameResource
  private history: Texture[] = []
  private current = 0
  private lastFrame = -1
  private frame = 0
  private camera = new Float32Array(4)
  private values = new Float32Array(4)

  public constructor(device: Device) {
    this.device = device
    device.ready.then(() => {
      this.program = device.createShaderModule({ name: 'NW SMAA 1TX', wgsl: { source: SMAA_1TX_WGSL } }).program.clone()
      this.copyProgram = device
        .createShaderModule({ name: 'NW SMAA 1TX Copy', wgsl: { source: COPY_WGSL } })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.frame++
    this.isActive = this.enabled && !!this.program?.isCompiled && !!this.copyProgram?.isCompiled
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    this.color = frame.modifyInPlace(RenderChannel.Color)
    this.depth = frame.read(RenderChannel.LinearDepth)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const color = this.color.texture
    let valid = this.lastFrame === this.frame - 1
    if (this.ensureHistory(color)) {
      valid = false
    }
    this.lastFrame = this.frame
    const previous = this.history[this.current]
    this.current = 1 - this.current
    const output = this.history[this.current]

    const inputs = ctx.renderInputs
    const position = inputs.get(CommonInputs.View.CameraPosition)
    this.camera[0] = position?.x ?? 0
    this.camera[1] = position?.y ?? 0
    this.camera[2] = position?.z ?? 0
    this.camera[3] = ctx.view.camera.far
    const previousViewProjection = inputs.get(CommonInputs.View.PreviousViewProjectionMatrix) as Mat4 | undefined
    this.values[0] = valid && previousViewProjection ? 1 : 0

    const pass = ctx.device.renderPass
    pass.flush()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setRenderBlend(0, BlendState.Opaque)

    // 1. resolve into the history of the next frame
    const program = this.program
    program.mustSet('params.inverseViewProjection', inputs.get(CommonInputs.View.InverseViewProjectionMatrix))
    program.mustSet('params.previousViewProjection', previousViewProjection ?? inputs.get(CommonInputs.View.ViewProjectionMatrix))
    program.mustSet('params.camera', this.camera)
    program.mustSet('params.values', this.values)
    program.mustSet('source', color)
    program.mustSet('history', previous)
    program.mustSet('linearDepth', this.depth.texture)
    program.mustSet('linearSampler', SamplerState.LinearClamp)
    program.commit()
    pass.setRenderTarget(0, output)
    pass.setViewportState(0, 0, output.width, output.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()

    // 2. the resolved image back into the color
    this.copyProgram.mustSet('source', output)
    this.copyProgram.commit()
    pass.setRenderTarget(0, color)
    pass.setViewportState(0, 0, color.width, color.height)
    pass.setProgram(this.copyProgram)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
    pass.flush()
  }

  /**
   * (Re)creates the history textures for the size and format of the color, true when they were recreated
   */
  private ensureHistory(color: Texture): boolean {
    const first = this.history[0]
    if (first && first.width === color.width && first.height === color.height && first.format === color.format) {
      return false
    }
    this.dispose()
    for (let i = 0; i < 2; i++) {
      this.history[i] = this.device.createTexture({
        name: `NW SMAA 1TX History ${i}`,
        type: '2d',
        format: color.format,
        width: color.width,
        height: color.height,
        usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
      })
    }
    return true
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  public dispose() {
    for (const texture of this.history) {
      texture?.dispose()
    }
    this.history.length = 0
  }
}
