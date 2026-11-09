import {
  SamplerState,
  TextureUsage,
  type Device,
  type GpuTimer,
  type Program,
  type Texture,
  type WebGpuDevice,
} from '@gglib/graphics'
import { vec4 } from '@gglib/math'
import { FrameGraph, type FrameResource, type RenderChannel, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../../material/common'
import {
  FROXEL_DEBUG_WGSL,
  FROXEL_DEPTH,
  FROXEL_INJECT_WGSL,
  FROXEL_MAX_DEPTH_WGSL,
  FROXEL_RAYMARCH_WGSL,
  FROXEL_TILE_SIZE,
  FROXEL_WORKGROUP_2D,
  FROXEL_WORKGROUP_3D,
  FroxelDebugModes,
  type FroxelDebugMode,
} from './FroxelFog.wgsl'

export interface FroxelFogPassOptions {
  /**
   * Linear view depth (full resolution), the far plane for the sky
   */
  linearDepth: RenderChannel
  /**
   * HDR color, only written by the debug views
   */
  color: RenderChannel
}

const STORAGE_USAGE = TextureUsage.RenderTarget | TextureUsage.TextureBinding | TextureUsage.StorageBinding
const VOLUME_USAGE = TextureUsage.TextureBinding | TextureUsage.StorageBinding
/**
 * Size of the random texture of the density noise (vfNoiseTex)
 */
const NOISE_SIZE = 64

/**
 * Froxel volumetric fog (plan phase 8, tmp/render-pipeline/froxel-fog.md): a view frustum aligned volume of
 * screen / {@link tileSize} × {@link slices} slices up to the time of day ray-marching range (config `froxelTileSize`
 * and `froxelSlices`, the game uses 10 and 32).
 *
 * Per frame: max depth per froxel column → injection of density and in-scattering (global height fog, fog volumes,
 * sun, global probe) → front-to-back integration. The FogPass samples {@link integratedVolume}. The volume textures
 * are owned by the pass and persist across frames (the temporal reprojection of 8.6 reads the previous frame).
 */
export class FroxelFogPass implements RenderPass {
  public name: string = 'Froxel Fog'
  public enabled = true
  public gpuTimer?: GpuTimer
  /**
   * Debug view over the color, see {@link FroxelDebugModes}, of the slice {@link debugSlice}
   */
  public debug: FroxelDebugMode = 'off'
  public debugSlice = 0
  /**
   * Screen pixels per froxel in x and y (r_VolumetricFogTexScale)
   */
  public tileSize = FROXEL_TILE_SIZE
  /**
   * Depth slices of the volume (r_VolumetricFogTexDepth)
   */
  public slices = FROXEL_DEPTH

  private options: FroxelFogPassOptions
  private maxDepthProgram: Program
  private injectProgram: Program
  private raymarchProgram: Program
  private debugProgram: Program
  private depthInput: FrameResource
  private colorOutput: FrameResource | null = null
  private rendered = false
  private currentTile = FROXEL_TILE_SIZE
  private currentSlices = FROXEL_DEPTH

  private maxDepth: Texture | null = null
  private injected: Texture | null = null
  private integrated: Texture | null = null
  private noise: Texture | null = null
  private emptyVolume: Texture | null = null
  private publishEnabled = vec4(0)
  private publishDepth = vec4(0)
  private params = new Float32Array(12)
  private paramSize = this.params.subarray(0, 4)
  private paramDepth = this.params.subarray(4, 8)
  private paramDebug = this.params.subarray(8, 12)

  public constructor(device: Device, options: FroxelFogPassOptions) {
    this.options = options
    device.ready.then(() => {
      this.maxDepthProgram = createProgram(device, 'Froxel Max Depth', FROXEL_MAX_DEPTH_WGSL)
      this.injectProgram = createProgram(device, 'Froxel Inject', FROXEL_INJECT_WGSL)
      this.raymarchProgram = createProgram(device, 'Froxel Raymarch', FROXEL_RAYMARCH_WGSL)
      this.debugProgram = createProgram(device, 'Froxel Debug', FROXEL_DEBUG_WGSL)
    })
  }

  private get isReady() {
    return (
      !!this.maxDepthProgram?.isCompiled &&
      !!this.injectProgram?.isCompiled &&
      !!this.raymarchProgram?.isCompiled &&
      !!this.debugProgram?.isCompiled
    )
  }

  /**
   * The integrated volume of this frame (rgb = in-scattering, a = transmittance up to each slice), null while the
   * pass is disabled or not ready
   */
  public get integratedVolume(): Texture | null {
    return this.enabled && this.rendered ? this.integrated : null
  }

  /**
   * Tile size and slices of the integrated volume (the settings of its last render)
   */
  public get volumeTileSize(): number {
    return this.currentTile
  }

  public get volumeSlices(): number {
    return this.currentSlices
  }

  /**
   * x = near, y = range - near, z = 1 / (slices - 1), w = 1 / (range - near) of the integrated volume
   */
  public get depthParams(): Float32Array {
    return this.paramDepth
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.rendered = false
    if (!this.enabled || !this.isReady) {
      this.publish(ctx, null)
      return
    }
    frame.addPass(this)
    // the volume is owned by the pass, not a graph resource: without the debug output nothing would depend on it
    frame.keepAlive()
    this.depthInput = frame.read(this.options.linearDepth)
    this.colorOutput = this.debug !== 'off' ? frame.write(this.options.color, { usage: STORAGE_USAGE }) : null
  }

  public render(ctx: RenderContext): void {
    if (!this.isReady) {
      return
    }
    const device = ctx.device as WebGpuDevice
    this.currentTile = Math.max(2, Math.round(this.tileSize) || FROXEL_TILE_SIZE)
    this.currentSlices = Math.max(4, Math.round(this.slices) || FROXEL_DEPTH)
    const width = Math.ceil(ctx.viewWidth / this.currentTile)
    const height = Math.ceil(ctx.viewHeight / this.currentTile)
    this.ensureTargets(device, width, height, this.currentSlices)
    this.updateParams(ctx, width, height)
    // the froxel programs declare the global froxel volume as well, it must not be the volume they write
    this.publish(ctx, null)

    const pass = device.computePass
    if (this.gpuTimer) {
      pass.beginTimer(this.gpuTimer)
    }
    const inputs = ctx.renderInputs
    const blocks = inputs.blocks
    const groups3d = [
      Math.ceil(width / FROXEL_WORKGROUP_3D),
      Math.ceil(height / FROXEL_WORKGROUP_3D),
      Math.ceil(this.currentSlices / FROXEL_WORKGROUP_3D),
    ] as const
    const groups2d = [Math.ceil(width / FROXEL_WORKGROUP_2D), Math.ceil(height / FROXEL_WORKGROUP_2D)] as const

    // max depth per froxel column (StoreDownscaledMaxDepth)
    let program = this.maxDepthProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('linearDepth', this.depthInput.texture)
    program.mustSet('outMaxDepth', this.maxDepth)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups2d[0], groups2d[1])

    // density and in-scattering (InjectFogDensity + InjectVolumetricInscattering), the fog volumes and the
    // in-scattering constants come with the global block
    program = this.injectProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('maxDepthMap', this.maxDepth)
    program.mustSet('outVolume', this.injected)
    program.mustSet('noiseMap', this.noise)
    program.mustSet('noiseSampler', SamplerState.LinearWrap)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups3d[0], groups3d[1], groups3d[2])

    // front-to-back integration (RaymarchVolumetricFog)
    program = this.raymarchProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('injected', this.injected)
    program.mustSet('outVolume', this.integrated)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups2d[0], groups2d[1])

    if (this.colorOutput) {
      const color = this.colorOutput.texture
      program = this.debugProgram
      program.applyBlocks(blocks)
      this.setParams(program)
      program.mustSet('maxDepthMap', this.maxDepth)
      program.mustSet('injected', this.injected)
      program.mustSet('integrated', this.integrated)
      program.mustSet('outColor', color)
      program.commit()
      pass.setProgram(program)
      pass.dispatch(Math.ceil(color.width / FROXEL_WORKGROUP_2D), Math.ceil(color.height / FROXEL_WORKGROUP_2D))
    }
    if (this.gpuTimer) {
      pass.endTimer(this.gpuTimer)
    }
    pass.flush()
    this.rendered = true
    // transparent materials sample the volume in getSceneFog
    this.publish(ctx, this.integrated)
  }

  /**
   * Binds the integrated volume for the materials (global froxel inputs), or the empty volume and disables it
   */
  private publish(ctx: RenderContext, volume: Texture | null) {
    const inputs = ctx.renderInputs
    this.emptyVolume ??= createVolume(ctx.device, 'Froxel Empty', 1, 1, 1)
    this.publishEnabled.x = volume ? 1 : 0
    this.publishEnabled.y = this.currentSlices
    this.publishEnabled.z = this.currentTile
    this.publishDepth.x = this.paramDepth[0]
    this.publishDepth.y = this.paramDepth[1]
    this.publishDepth.z = this.paramDepth[2]
    this.publishDepth.w = this.paramDepth[3]
    inputs.set(InputSlots.Global.FroxelVolume, volume ?? this.emptyVolume)
    inputs.set(InputSlots.Global.FroxelDepth, this.publishDepth)
    inputs.set(InputSlots.Global.FroxelEnabled, this.publishEnabled)
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  public dispose() {
    this.disposeTargets()
    this.noise?.dispose()
    this.noise = null
    this.emptyVolume?.dispose()
    this.emptyVolume = null
  }

  private disposeTargets() {
    this.maxDepth?.dispose()
    this.injected?.dispose()
    this.integrated?.dispose()
    this.maxDepth = null
    this.injected = null
    this.integrated = null
  }

  private setParams(program: Program) {
    program.mustSet('froxel.size', this.paramSize)
    program.mustSet('froxel.depth', this.paramDepth)
    program.mustSet('froxel.debug', this.paramDebug)
  }

  private ensureTargets(device: Device, width: number, height: number, depth: number) {
    this.noise ??= createNoiseTexture(device)
    const v = this.integrated
    if (v?.width === width && v.height === height && v.depth === depth) {
      return
    }
    this.disposeTargets()
    this.maxDepth = device.createTexture({
      name: 'Froxel Max Depth',
      type: '2d',
      format: 'r32float',
      width,
      height,
      // storage views need a single mip
      mipLevelCount: 1,
      generateMipmap: false,
      usage: VOLUME_USAGE,
    })
    this.injected = createVolume(device, 'Froxel Injected', width, height, depth)
    this.integrated = createVolume(device, 'Froxel Integrated', width, height, depth)
  }

  /**
   * Bytes of the volume textures (max depth r32float, injected and integrated rgba16float)
   */
  public get memoryBytes(): number {
    const v = this.integrated
    if (!v) {
      return 0
    }
    return v.width * v.height * 4 + 2 * v.width * v.height * v.depth * 8
  }

  private updateParams(ctx: RenderContext, width: number, height: number) {
    const camera = ctx.view.camera
    // the ray-marching range of the time of day (sGetVolumetricFogDistanceParams.w), in VolFog2Zenith.z
    const zenith = ctx.renderInputs.get(InputSlots.Global.VolFog2Zenith) as any
    const range = Math.max(zenith?.z ?? zenith?.[2] ?? 64, camera.near + 0.0001)
    const near = camera.near
    const p = this.params
    p[0] = width
    p[1] = height
    p[2] = this.currentSlices
    p[3] = this.currentTile
    p[4] = near
    p[5] = range - near
    p[6] = 1 / (this.currentSlices - 1)
    p[7] = 1 / (range - near)
    p[8] = FroxelDebugModes.indexOf(this.debug)
    p[9] = Math.min(Math.max(Math.round(this.debugSlice), 0), this.currentSlices - 1)
  }
}

function createProgram(device: Device, name: string, source: string): Program {
  return device.createShaderModule({ name, wgsl: { source } }).program.clone()
}

function createVolume(device: Device, name: string, width: number, height: number, depth: number): Texture {
  return device.createTexture({
    name,
    type: '3d',
    format: 'rgba16float',
    width,
    height,
    depth,
    mipLevelCount: 1,
    generateMipmap: false,
    usage: VOLUME_USAGE,
  })
}

/**
 * Random values for the density noise (vfNoiseTex, a 64² random texture in the game), from an integer hash so the
 * pattern is stable across sessions
 */
function createNoiseTexture(device: Device): Texture {
  const data = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4)
  for (let i = 0; i < NOISE_SIZE * NOISE_SIZE; i++) {
    let h = Math.imul(i + 1, 0x9e3779b1)
    h ^= h >>> 15
    h = Math.imul(h, 0x85ebca77)
    h ^= h >>> 13
    data[i * 4] = h & 0xff
    data[i * 4 + 1] = (h >>> 8) & 0xff
    data[i * 4 + 2] = (h >>> 16) & 0xff
    data[i * 4 + 3] = 255
  }
  return device.createTexture({
    name: 'Froxel Noise',
    type: '2d',
    format: 'rgba8unorm',
    width: NOISE_SIZE,
    height: NOISE_SIZE,
    mipLevelCount: 1,
    generateMipmap: false,
    source: data,
  })
}
