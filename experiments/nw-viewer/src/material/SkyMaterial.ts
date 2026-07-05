import {
  CullState,
  DepthState,
  Device,
  materialSchemaClass,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { clamp, Vec2, vec3, Vec3, Vec4 } from '@gglib/math'
import SkyMaterialSchema from './SkyMaterial.meta'
import WGSL from './SkyMaterial.wgsl'

export function skyShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Sky Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function skyEffectOptions(): EffectOptions {
  return {
    name: 'Sky Effect',
    meta: {},
    program: {
      shader: skyShaderOptions(),
      sharedBlocks: [],
    },
  }
}

export class SkyMaterial extends materialSchemaClass(SkyMaterialSchema) {
  public constructor(device: Device) {
    super(device, {
      name: 'Sky Material',
      effect: skyEffectOptions(),
      meta: {},
    })
    this.SamplerLinear = SamplerState.LinearClamp
    this.SamplerPoint = SamplerState.PointClamp

    this.effect.cullState = CullState.None
    this.effect.depthState = DepthState.GreaterEqualNoWrite

    this.PartialRayleighInScattering = Vec3.create(
      5.8 * 0.40909049, // R
      13.5 * 0.40909049, // G
      33.1 * 0.40909049, // B
    )
    this.PartialMieInScattering = Vec3.create(
      21.0 * 4.8000002, // R
      21.0 * 4.8000002, // G
      21.0 * 4.8000002, // B
    )

    // Phase function constants derived from asymmetry factor g = 0.76
    // (0 = isotropic, 1 = full forward scattering; haze is ~0.76-0.8)
    //
    //   miePart      = 1 / (4π)
    //   miePart_g_2  = pow(miePart, -2/3) * (-2 * g)
    //   miePart_g2_1 = pow(miePart, -2/3) * (1 + g*g)
    //
    // With g = 0.76, miePart = 0.07958:
    //   pow(0.07958, -2/3) ≈ 5.17
    //   miePart_g_2        ≈ 5.17 * (-1.52) ≈ -7.86
    //   miePart_g2_1       ≈ 5.17 * (1.578) ≈  8.16
    this.PhaseFunctionConstants = Vec3.create(-7.86, 8.16, 0.0)

    // Night sky base: deep blue-black at the horizon
    this.NightSkyColBase = Vec3.create(0.308 * 0.3, 0.427 * 0.3, 0.555 * 0.3)
    this.NightSkyColDelta = Vec3.create(0.0, 0.0, 0.0)

    // Zenith gradient shift: maps sky_dir.z → [0,1] gradient parameter
    // sky_dir.z * x + y = 0 at horizon (z=0), = 1 at zenith (z=1)
    // x = 1.0, y = 0.0 is the simplest linear mapping
    this.NightSkyZenithColShift = Vec2.create(42.9, 0.0)
  }

  public setMoonParams(latitude: number, longitude: number, size: number, direction: Vec3) {
    const moonLati = -Math.PI + (Math.PI * latitude) / 180.0
    const moonLong = 0.5 * Math.PI - (Math.PI * longitude) / 180.0

    const sinLonR = Math.sin(-0.5 * Math.PI)
    const cosLonR = Math.cos(-0.5 * Math.PI)
    const sinLatR = Math.sin(moonLati + 0.5 * Math.PI)
    const cosLatR = Math.cos(moonLati + 0.5 * Math.PI)
    const right = this.NightMoonTexGenRight || Vec3.create()
    Vec3.init(right, sinLonR * cosLatR, sinLonR * sinLatR, cosLonR)
    Vec3.normalize(right, right)
    this.NightMoonTexGenRight = right

    const sinLonU = Math.sin(moonLong + 0.5 * Math.PI)
    const cosLonU = Math.cos(moonLong + 0.5 * Math.PI)
    const sinLatU = Math.sin(moonLati)
    const cosLatU = Math.cos(moonLati)
    const up = this.NightMoonTexGenUp || Vec3.create()
    Vec3.init(up, sinLonU * cosLatU, sinLonU * sinLatU, cosLonU)
    Vec3.normalize(up, up)
    this.NightMoonTexGenUp = up

    const dirSize = this.NightMoonDirSize || Vec4.create()
    Vec4.init(dirSize, direction.x, direction.y, direction.z, 25 - clamp(24 * size, 0, 1))
    Vec3.normalize(dirSize, dirSize)
    this.NightMoonDirSize = dirSize
  }

  public setSkylightParams(
    km: number,
    kr: number,
    g: number,
    waveR: number,
    waveG: number,
    waveB: number,
    sunIntensity: number,
  ) {
    const rInv4 = Math.pow(waveR * 0.001, -4)
    const gInv4 = Math.pow(waveG * 0.001, -4)
    const bInv4 = Math.pow(waveB * 0.001, -4)

    const mie = this.PartialMieInScattering || vec3(0)
    mie.x = km * rInv4 * 0.001 // sunIntensity
    mie.y = km * gInv4 * 0.001 // sunIntensity
    mie.z = km * bInv4 * 0.001 // sunIntensity
    this.PartialMieInScattering = mie

    const rayleigh = this.PartialRayleighInScattering || vec3(0)
    rayleigh.x = kr * 0.005 // * sunIntensity
    rayleigh.y = kr * 0.005 // * sunIntensity
    rayleigh.z = kr * 0.005 // * sunIntensity
    this.PartialRayleighInScattering = rayleigh

    const phase = this.PhaseFunctionConstants || vec3(0)
    const miePart = 1 / (4 * Math.PI)
    const miePartPow = Math.pow(miePart, -2 / 3)
    phase.x = miePartPow * (-2 * g)
    phase.y = miePartPow * (1 + g * g)
    this.PhaseFunctionConstants = phase

    const scales = this.ScatteringScales || vec3(0)
    scales.x = sunIntensity
    scales.y = g
    this.ScatteringScales = scales
  }
}
