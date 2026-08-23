import {
  Color,
  Device,
  inputSlot,
  Program,
  RenderEncoder,
  SamplerState,
  ShaderModuleOptions,
  Texture,
  TextureUsage,
  typedProgramInputs,
} from '@gglib/graphics'
import { IVec3, vec3 } from '@gglib/math'
import { FULLSCREEN_GLSL_VS } from '../image/common.glsl'
import {
  NISHITA_OPTICAL_LUT_GLSL_FS,
  NISHITA_PANORAMA_GLSL_FS,
  NISHITA_SCATTERING_GLSL_FS,
} from './nishita-sky-filter.glsl'
import { NISHITA_OPTICAL_LUT_WGSL, NISHITA_SCATTERING_WGSL, NISHITA_PANORAMA_WGSL } from './nishita-sky-filter.wgsl'

export function nishitaLutShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Optical LUT Shader',
    wgsl: { source: NISHITA_OPTICAL_LUT_WGSL },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: NISHITA_OPTICAL_LUT_GLSL_FS },
  }
}

export function nishitaScatteringShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Nishita Scattering Shader',
    wgsl: { source: NISHITA_SCATTERING_WGSL },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: NISHITA_SCATTERING_GLSL_FS },
  }
}

export function nishitaPanoramaShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Nishita Panorama Shader',
    wgsl: { source: NISHITA_PANORAMA_WGSL },
    glsl: { vertex: FULLSCREEN_GLSL_VS, fragment: NISHITA_PANORAMA_GLSL_FS },
  }
}

export interface NishitaSkyOptions {
  /**
   * Planet radius in km.
   * Default is `6368`
   */
  radius?: number

  /**
   * Atmosphere thickness in km.
   * Default is `100`
   */
  thickness?: number

  /**
   * height in km where average aerosols density is found.
   * Default is `1.2`
   */
  scaleHeightMie?: number

  /**
   * height in km where average air molecule density is found.
   * Default is `7.994`
   */
  scaleHeightRayleigh?: number

  /**
   * Wave lengths
   *
   * Default is `vec3(650, 570, 475)`
   */
  waveLength?: IVec3

  /**
   * Strength of Mie (aerosol/haze) scattering, roughly wavelength-independent.
   * Produces the bright glow/corona around the sun.
   * Known as `Km` in most scattering literature.
   *
   * Default is `0.001`
   */
  mieScattering?: number

  /**
   * Strength of Rayleigh (air molecule) scattering.
   * This is what makes clear sky blue.
   * Known as `Kr` in most scattering literature.
   *
   * Default is `0.00025`
   */
  rayleighScattering?: number

  /**
   * Henyey-Greenstein asymmetry parameter for the Mie phase function:
   * Known as `g` in most scattering literature.
   *
   * - 0 = scatters equally in all directions
   * - +1 = strongly forward-scattered (continues mostly in its original direction)
   * - -1 = strongly backward-scattered.
   *
   * Default is `-0.99` for earth (strongly forward-peaked, giving a tight corona around the sun)
   */
  phaseAsymmetry?: number

  /**
   * Sun color or intensity
   *
   * Default is `vec3(20, 20, 20)`
   */
  sunIntensity?: IVec3

  /**
   * Sun vertical angle
   */
  sunLatitude?: number

  /**
   * Sun horizontal angle
   */
  sunLongitude?: number

  /**
   * Ground color for the lower hemisphere when rendering the panorama composition
   *
   * Default is `vec3(0.1, 0.1, 0.1)`
   */
  groundColor?: IVec3

  /**
   * Width and height for the generated optical LUT texture.
   * This can not be changed later.
   * Default is `[256, 32]`
   */
  opticalMapSize?: [number, number]

  /**
   * Width and height for the generated scattering textures.
   * This can not be changed later.
   * Default is `[64, 32]`
   */
  scatteringMapSize?: [number, number]
}

export class NishitaSkyFilter {
  public readonly opticalLutProgram: Program
  public readonly opticalLutParams = typedProgramInputs({
    radius: inputSlot('params', 'radius', 'scalar'),
    thickness: inputSlot('params', 'thickness', 'scalar'),
    scaleHeightMie: inputSlot('params', 'scaleHeightMie', 'scalar'),
    scaleHeightRayleigh: inputSlot('params', 'scaleHeightRayleigh', 'scalar'),
  })

  public readonly scatteringProgram: Program
  public readonly panoramaProgram: Program
  public readonly params = typedProgramInputs({
    radius: inputSlot('params', 'radius', 'scalar'),
    thickness: inputSlot('params', 'thickness', 'scalar'),
    sunLatitude: inputSlot('params', 'sunLatitude', 'scalar'),
    sunLongitude: inputSlot('params', 'sunLongitude', 'scalar'),
    sunIntensity: inputSlot('params', 'sunIntensity', 'vec3'),
    groundColor: inputSlot('params', 'groundColor', 'vec3'),
    waveLength: inputSlot('params', 'waveLength', 'vec3'),
    waveLengthInv: inputSlot('params', 'waveLengthInv', 'vec3'),
    mieScattering: inputSlot('params', 'mieScattering', 'scalar'),
    rayleighScattering: inputSlot('params', 'rayleighScattering', 'scalar'),
    phaseAsymmetry: inputSlot('params', 'phaseAsymmetry', 'scalar'),

    opticalLutMap: inputSlot('', 'opticalLutMap', 'texture'),
    opticalLutSampler: inputSlot('', 'opticalLutSampler', 'sampler'),
    mieScatteringMap: inputSlot('', 'mieScatteringMap', 'texture'),
    mieScatteringSampler: inputSlot('', 'mieScatteringSampler', 'sampler'),
    rayleighScatteringMap: inputSlot('', 'rayleighScatteringMap', 'texture'),
    rayleighScatteringSampler: inputSlot('', 'rayleighScatteringSampler', 'sampler'),
  })

  public readonly compiled: Promise<this>
  public get isCompiled() {
    return this.opticalLutProgram.isCompiled && this.scatteringProgram.isCompiled && this.panoramaProgram.isCompiled
  }
  public get isValid() {
    return this.opticalLutProgram.isValid && this.scatteringProgram.isValid && this.panoramaProgram.isValid
  }

  /**
   * Planet radius in km.
   * Default is `6368`
   */
  public radius = 6368
  /**
   * Atmosphere thickness in km.
   * Default is `100`
   */
  public thickness = 100
  /**
   * height in km where average aerosols density is found.
   * Default is `1.2`
   */
  public scaleHeightMie = 1.2
  /**
   * height in km where average air molecule density is found.
   * Default is `7.994`
   */
  public scaleHeightRayleigh = 7.994

  /**
   * Wave lengths
   *
   * Default is `vec3(650, 570, 475)`
   */
  public waveLength: IVec3 = vec3(650, 570, 475)

  /**
   * Strength of Mie (aerosol/haze) scattering, roughly wavelength-independent.
   * Produces the bright glow/corona around the sun.
   * Known as `Km` in most scattering literature.
   *
   * Default is `0.001`
   */
  public mieScattering = 0.001

  /**
   * Strength of Rayleigh (air molecule) scattering.
   * This is what makes clear sky blue.
   * Known as `Kr` in most scattering literature.
   *
   * Default is `0.00025`
   */
  public rayleighScattering = 0.00025

  /**
   * Henyey-Greenstein asymmetry parameter for the Mie phase function:
   * Known as `g` in most scattering literature.
   *
   * - 0 = scatters equally in all directions
   * - +1 = strongly forward-scattered (continues mostly in its original direction)
   * - -1 = strongly backward-scattered.
   *
   * Default is `-0.99` for earth (strongly forward-peaked, giving a tight corona around the sun)
   */
  public phaseAsymmetry = -0.99

  /**
   * Sun color or intensity
   *
   * Default is `vec3(20, 20, 20)`
   */
  public sunIntensity: IVec3 = vec3(20)

  /**
   * Sun vertical angle
   */
  public sunLatitude = 0

  /**
   * Sun horizontal angle
   */
  public sunLongitude = 0

  /**
   * Ground color for the lower hemisphere when rendering the panorama composition
   *
   * Default is `vec3(0.1, 0.1, 0.1)`
   */
  public groundColor: IVec3 = vec3(0.1)

  public readonly opticalLUT: Texture
  public readonly mieScatteringMap: Texture
  public readonly rayleighScatteringMap: Texture
  public textureOut: Texture

  public constructor(device: Device, options: NishitaSkyOptions = {}) {
    this.radius = options.radius ?? this.radius
    this.thickness = options.thickness ?? this.thickness
    this.scaleHeightMie = options.scaleHeightMie ?? this.scaleHeightMie
    this.scaleHeightRayleigh = options.scaleHeightRayleigh ?? this.scaleHeightRayleigh
    this.waveLength = options.waveLength ?? this.waveLength
    this.mieScattering = options.mieScattering ?? this.mieScattering
    this.rayleighScattering = options.rayleighScattering ?? this.rayleighScattering
    this.phaseAsymmetry = options.phaseAsymmetry ?? this.phaseAsymmetry
    this.sunIntensity = options.sunIntensity ?? this.sunIntensity
    this.sunLatitude = options.sunLatitude ?? this.sunLatitude
    this.sunLongitude = options.sunLongitude ?? this.sunLongitude
    this.groundColor = options.groundColor ?? this.groundColor

    this.opticalLutProgram = device.createShaderModule(nishitaLutShaderOptions()).program.clone()
    this.scatteringProgram = device.createShaderModule(nishitaScatteringShaderOptions()).program.clone()
    this.panoramaProgram = device.createShaderModule(nishitaPanoramaShaderOptions()).program.clone()
    this.compiled = Promise.all([
      this.opticalLutProgram.compiled,
      this.scatteringProgram.compiled,
      this.panoramaProgram.compiled,
    ]).then(() => this)

    const [lutWidth, lutHeight] = options?.opticalMapSize ?? [256, 32]
    this.opticalLUT = device.createRenderTarget({
      width: lutWidth,
      height: lutHeight,
      format: 'RGBA16_FLOAT',
      type: 'Texture2D',
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      mipLevelCount: 1,
    })

    const [scatteringWidth, scatteringHeight] = options?.scatteringMapSize ?? [64, 32]
    this.mieScatteringMap = device.createRenderTarget({
      width: scatteringWidth,
      height: scatteringHeight,
      format: 'RGBA16_FLOAT',
      type: 'Texture2D',
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      mipLevelCount: 1,
    })

    this.rayleighScatteringMap = device.createRenderTarget({
      width: scatteringWidth,
      height: scatteringHeight,
      format: 'RGBA16_FLOAT',
      type: 'Texture2D',
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      mipLevelCount: 1,
    })
  }

  private renderOpticalLUT(pass: RenderEncoder) {
    console.assert(this.isValid, 'shader must be compiled and valid')

    const program = this.opticalLutProgram
    const params = this.opticalLutParams
    const output = this.opticalLUT

    if (
      params.radius === this.radius &&
      params.thickness === this.thickness &&
      params.scaleHeightMie === this.scaleHeightMie &&
      params.scaleHeightRayleigh === this.scaleHeightRayleigh
    ) {
      return
    }
    params.radius = this.radius
    params.thickness = this.thickness
    params.scaleHeightMie = this.scaleHeightMie
    params.scaleHeightRayleigh = this.scaleHeightRayleigh

    program.applyBlocks(params.blocks)
    program.commit()

    pass.setRenderTarget(0, output)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.setViewportState(0, 0, output.width, output.height)
    pass.clear()
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()

    pass.setProgram(null)
    pass.setRenderTarget(0, null)
    pass.setRenderTarget(1, null)
  }

  private renderScatteringMaps(pass: RenderEncoder) {
    const program = this.scatteringProgram
    const params = this.params

    params.radius = this.radius
    params.thickness = this.thickness
    params.waveLength = this.waveLength
    params.waveLengthInv ||= vec3(0)
    params.waveLengthInv.x = Math.pow(this.waveLength.x * 0.001, -4)
    params.waveLengthInv.y = Math.pow(this.waveLength.y * 0.001, -4)
    params.waveLengthInv.z = Math.pow(this.waveLength.z * 0.001, -4)

    params.sunIntensity = this.sunIntensity
    params.sunLatitude = this.sunLatitude
    params.sunLongitude = this.sunLongitude
    params.mieScattering = this.mieScattering
    params.rayleighScattering = this.rayleighScattering
    params.phaseAsymmetry = this.phaseAsymmetry
    params.opticalLutMap = this.opticalLUT
    params.opticalLutSampler = SamplerState.LinearClamp

    program.applyBlocks(params.blocks)
    program.commit()

    pass.setRenderTarget(0, this.mieScatteringMap)
    pass.setRenderTarget(1, this.rayleighScatteringMap)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.setClearColor(1, Color.TransparentBlack)
    pass.setViewportState(0, 0, this.mieScatteringMap.width, this.mieScatteringMap.height)
    pass.clear()
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()

    pass.setProgram(null)
    pass.setRenderTarget(0, null)
    pass.setRenderTarget(1, null)
    pass.setClearColor(0, null)
    pass.setClearColor(1, null)
  }

  private renderPanorama(pass: RenderEncoder) {
    const program = this.panoramaProgram
    const params = this.params

    params.radius = this.radius
    params.thickness = this.thickness
    params.groundColor = this.groundColor
    params.waveLength = this.waveLength
    params.waveLengthInv ||= vec3(0)
    params.waveLengthInv.x = Math.pow(this.waveLength.x * 0.001, -4)
    params.waveLengthInv.y = Math.pow(this.waveLength.y * 0.001, -4)
    params.waveLengthInv.z = Math.pow(this.waveLength.z * 0.001, -4)
    params.sunIntensity = this.sunIntensity
    params.sunLatitude = this.sunLatitude
    params.sunLongitude = this.sunLongitude
    params.mieScattering = this.mieScattering
    params.rayleighScattering = this.rayleighScattering
    params.phaseAsymmetry = this.phaseAsymmetry
    params.mieScatteringMap = this.mieScatteringMap
    params.mieScatteringSampler = SamplerState.LinearClamp
    params.rayleighScatteringMap = this.rayleighScatteringMap
    params.rayleighScatteringSampler = SamplerState.LinearClamp

    program.applyBlocks(params.blocks)
    program.commit()

    pass.setRenderTarget(0, this.textureOut)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.setViewportState(0, 0, this.textureOut.width, this.textureOut.height)
    pass.clear()
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()

    pass.setProgram(null)
    pass.setRenderTarget(0, null)
    pass.setRenderTarget(1, null)
  }

  /**
   * Using current parameters it updates the following textures
   * - {@link opticalLUT} only if any of {@link radius}, {@link thickness}, {@link mieScattering} or {@link rayleighScattering} has changed
   * - {@link mieScatteringMap} as top hemisphere panorama projection
   * - {@link rayleighScatteringMap} as top hemisphere panorama projection
   *
   * If {@link textureOut} is set, final atmospheric scattering sky composition is rendered into it.
   */
  public render(pass: RenderEncoder) {
    console.assert(this.isValid, 'shader must be compiled and valid')

    this.renderOpticalLUT(pass)
    this.renderScatteringMaps(pass)
    if (this.textureOut) {
      this.renderPanorama(pass)
    }

    pass.flush()

    if (this.textureOut) {
      this.textureOut.updateMipmaps()
    }
  }
}
