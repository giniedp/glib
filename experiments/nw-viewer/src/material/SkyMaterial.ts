import {
  BlendState,
  CullState,
  DepthState,
  Device,
  materialSchemaClass,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Vec2, Vec3 } from '@gglib/math'
import SkyMaterialSchema from './SkyMaterial.meta'
import SKY_SHADER from './SkyMaterial.wgsl'

export function skyShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Sky Shader',
    wgsl: SKY_SHADER,
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
    this.effect.cullState = CullState.None
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.blendState = BlendState.Alpha

    this.PartialRayleighInScattering = Vec3.create(
      5.8 * 0.40909049, // R
      13.5 * 0.40909049, // G
      33.1 * 0.40909049, // B
    )
    this.PartialMieInScattering = Vec3.create(21.0 * 4.8000002, 21.0 * 4.8000002, 21.0 * 4.8000002)

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
}

function phaseFunctionConstants(g: number): [number, number, number] {
  const miePart = 1 / (4 * Math.PI)
  const miePartPow = Math.pow(miePart, -2 / 3)
  return [miePartPow * (-2 * g), miePartPow * (1 + g * g), 0.0]
}

// Rayleigh scattering scales with 1/λ⁴ (shorter wavelength = more scattering)
function computeRayleighCoefficients(
  wavelengths: [number, number, number], // nm
  rayleighMultiplier: number,
): [number, number, number] {
  // reference wavelength 680nm, coefficient 5.8 at that wavelength
  const ref = 680
  const base = 5.8
  return wavelengths.map((labda) => base * Math.pow(ref / labda, 4) * rayleighMultiplier) as [number, number, number]
}

// Mie is wavelength-independent, just a scalar multiplier
function computeMieCoefficients(mieMultiplier: number): [number, number, number] {
  const base = 21.0
  return [base * mieMultiplier, base * mieMultiplier, base * mieMultiplier]
}
