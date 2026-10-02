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
import { IVec3, vec3 } from '@gglib/math'
import { FULLSCREEN_GLSL_VS } from '../common.glsl'
import { FLAME_GLSL_FS } from './flame.glsl'
import { FLAME_WGSL_FS } from './flame.wgsl'

export function flameShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Flame Shader',
    wgsl: { source: FLAME_WGSL_FS },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: FLAME_GLSL_FS },
  }
}

/**
 * Procedural flames rising from the alpha silhouette of the input texture.
 *
 * Each pixel gathers coverage from the silhouette below it, bent and eroded by
 * upwards scrolling noise. The flame is added on top of the input and written
 * with matching alpha, so it also works on transparent targets. Output is HDR,
 * run it before bloom and tonemapping.
 */
export class FlameEffect {
  public readonly program: Program
  public readonly params = typedProgramInputs({
    texture: inputSlot('', 'colorMap', 'texture'),
    colorCore: inputSlot('params', 'colorCore', 'vec3'),
    colorEdge: inputSlot('params', 'colorEdge', 'vec3'),
    time: inputSlot('params', 'time', 'scalar'),
    height: inputSlot('params', 'height', 'scalar'),
    intensity: inputSlot('params', 'intensity', 'scalar'),
    scale: inputSlot('params', 'scale', 'scalar'),
    speed: inputSlot('params', 'speed', 'scalar'),
    distortion: inputSlot('params', 'distortion', 'scalar'),
    turbulence: inputSlot('params', 'turbulence', 'scalar'),
    occlusion: inputSlot('params', 'occlusion', 'scalar'),
    refraction: inputSlot('params', 'refraction', 'scalar'),
    aspect: inputSlot('params', 'aspect', 'scalar'),
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
  /** Animation time in seconds */
  public time: number = 0
  /** Color of the hot flame core */
  public colorCore: IVec3 = vec3(1.0, 0.8, 0.35)
  /** Color of the cool flame edges */
  public colorEdge: IVec3 = vec3(1.0, 0.2, 0.02)
  /** Flame reach in uv units */
  public height: number = 0.25
  /** Brightness multiplier, values above 1 feed into bloom */
  public intensity: number = 3
  /** Noise frequency */
  public scale: number = 6
  /** Upwards scroll speed of the noise */
  public speed: number = 1.5
  /** Sideways bending in uv units */
  public distortion: number = 0.15
  /** How strongly the noise breaks the flame into tongues (0-1) */
  public turbulence: number = 0.8
  /** How much the silhouette hides flames behind it (0-1) */
  public occlusion: number = 0.85
  /** Heat haze strength in uv units, distorts the input around the flame */
  public refraction: number = 0.03

  public constructor(device: Device) {
    this.program = device.createShaderModule(flameShaderOptions()).program.clone()
    this.compiled = this.program.compiled.then(() => this)
  }

  public render(pass: RenderEncoder) {
    console.assert(!!this.textureIn, 'input texture must be set')
    console.assert(!!this.textureOut, 'output texture must be set')

    const params = this.params
    params.texture = this.textureIn
    params.colorCore = this.colorCore
    params.colorEdge = this.colorEdge
    params.time = this.time
    params.height = this.height
    params.intensity = this.intensity
    params.scale = this.scale
    params.speed = this.speed
    params.distortion = this.distortion
    params.turbulence = this.turbulence
    params.occlusion = this.occlusion
    params.refraction = this.refraction
    params.aspect = this.textureIn.width / Math.max(1, this.textureIn.height)
    this.program.applyBlocks(params.blocks)
    this.program.commit()

    pass.setRenderTarget(0, this.textureOut)
    pass.setViewportState(0, 0, this.textureOut.width, this.textureOut.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
  }
}
