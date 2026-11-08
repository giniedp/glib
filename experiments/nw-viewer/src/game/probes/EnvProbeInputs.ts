import { SamplerState } from '@gglib/graphics'
import { vec4, type IVec3, type IVec4 } from '@gglib/math'
import type { Renderer } from '@gglib/render'
import type { ProbeCube, ProbeCubeLoader } from '../../content/ProbeCubeLoader'
import { InputSlots } from '../../material'
import type { TimeOfDay } from '../level/TimeOfDay'
import type { EnvProbeComponent } from './EnvProbeComponent'

/**
 * Writes the environment probe state to the global shader inputs.
 *
 * @remarks
 * Falls back to the default probe while the global cube loads. Without a global probe (model and material previews)
 * or in the `sky` mode the shaders use the dynamic sky cube.
 */
export class EnvProbeInputs {
  private global = vec4(0)
  private diffuse = vec4(1)
  private specular = vec4(1)
  private fog = vec4(0)

  private renderer: Renderer
  private cubes: ProbeCubeLoader
  private timeOfDay: TimeOfDay

  public constructor(renderer: Renderer, cubes: ProbeCubeLoader, timeOfDay: TimeOfDay) {
    this.renderer = renderer
    this.cubes = cubes
    this.timeOfDay = timeOfDay
    renderer.inputs.set(InputSlots.Global.ProbeSpecularCubes, cubes.atlas.specular)
    renderer.inputs.set(InputSlots.Global.ProbeDiffuseCubes, cubes.atlas.diffuse)
    renderer.inputs.set(InputSlots.Global.ProbeSampler, SamplerState.LinearClamp)
  }

  public write(probe: EnvProbeComponent | null, baked: boolean) {
    const cube = baked && probe ? this.resolveCube(probe) : null
    this.global.x = cube?.slot ?? 0
    this.global.y = cube ? 1 : 0
    if (cube) {
      this.writeColors(probe, cube === probe.cube)
    }
    this.writeFog(!!cube)
    const inputs = this.renderer.inputs
    inputs.set(InputSlots.Global.ProbeGlobal, this.global)
    inputs.set(InputSlots.Global.ProbeDiffuseColor, this.diffuse)
    inputs.set(InputSlots.Global.ProbeSpecularColor, this.specular)
    inputs.set(InputSlots.Global.VolFog2Probe, this.fog)
  }

  /**
   * Fog in-scattering of the global probe (CVolumetricFog::PrepareLightList): the probe light color times the
   * entities fog albedo. Attenuation is 1, the global probe box spans the level.
   */
  private writeFog(enabled: boolean) {
    const albedo = this.timeOfDay.volFog2EntityAlbedo
    this.fog.x = this.diffuse.x * albedo.x
    this.fog.y = this.diffuse.y * albedo.y
    this.fog.z = this.diffuse.z * albedo.z
    this.fog.w = enabled ? 1 : 0
  }

  private resolveCube(probe: EnvProbeComponent): ProbeCube | null {
    if (probe.cube?.state === 'ready') {
      return probe.cube
    }
    return this.cubes.defaultCube?.state === 'ready' ? this.cubes.defaultCube : null
  }

  /**
   * Engine part (LightInstance.cpp): diffuse is `color * diffuseMultiplier`, specular is that times `specMultiplier`.
   *
   * Time of day part, not verified: New World only, no source available. Scaling by the multipliers and blending them
   * by `todInfluence` is the simplest reading of the data.
   */
  private writeColors(probe: EnvProbeComponent, ownCube: boolean) {
    const tod = this.timeOfDay
    const config = probe.config
    const color = ownCube ? config.color : DEFAULT_COLOR
    const diffuseMultiplier = ownCube ? (config.diffuseMultiplier ?? 1) : 1
    const specularMultiplier = ownCube ? (config.specMultiplier ?? 1) : 1
    const influence = config.todInfluence ?? 0

    writeColor(
      this.diffuse,
      color,
      diffuseMultiplier * influenced(tod.envProbeDiffuseMultiplier, influence),
      tod.envProbeMultiplier,
      influence,
    )
    // the engine multiplies the specular multiplier on top of the diffuse scaled color (light.color.rgb * light.color.a
    // in TiledShading.cfi), the time of day specular multiplier is read the same way: on top of the diffuse one
    writeColor(
      this.specular,
      color,
      diffuseMultiplier *
        influenced(tod.envProbeDiffuseMultiplier, influence) *
        specularMultiplier *
        influenced(tod.envProbeSpecularMultiplier, influence),
      tod.envProbeMultiplier,
      influence,
    )
  }
}

const DEFAULT_COLOR: [number, number, number, number] = [1, 1, 1, 1]

function influenced(value: number, influence: number) {
  return 1 + (value - 1) * influence
}

function writeColor(out: IVec4, color: ArrayLike<number>, scale: number, tint: IVec3, influence: number) {
  out.x = color[0] * scale * influenced(tint.x, influence)
  out.y = color[1] * scale * influenced(tint.y, influence)
  out.z = color[2] * scale * influenced(tint.z, influence)
  out.w = 1
}
