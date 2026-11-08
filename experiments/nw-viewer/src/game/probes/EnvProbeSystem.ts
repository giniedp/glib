import { PriorityLane } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { Renderer } from '@gglib/render'
import { ViewerConfig } from '../../config'
import { ProbeCubeLoader } from '../../content/ProbeCubeLoader'
import { SkyLightSystem } from '../level/SkyLightSystem'
import { compareEnvProbes, EnvProbeComponent } from './EnvProbeComponent'
import { EnvProbeInputs } from './EnvProbeInputs'

/**
 * Tracks the active environment probes in blend order and requests their cubes.
 *
 * @remarks
 * Probes activate with their slice, so the list only holds probes around the camera.
 * GPU resources are handled by the {@link ProbeCubeLoader}, shading is handled elsewhere.
 */
export class EnvProbeSystem extends GameSystem {
  /**
   * Active probes, in blend order
   */
  public readonly active: EnvProbeComponent[] = []
  /**
   * The global probe the placed probes blend over, the last one in blend order
   */
  public global: EnvProbeComponent | null = null

  private query: GameQuery
  private cubes: ProbeCubeLoader
  private config: ViewerConfig
  private inputs: EnvProbeInputs

  public initialize(world: GameWorld): void {
    this.query = world.query({ scope: 'active', required: [EnvProbeComponent] })
    this.cubes = world.getSystem(ProbeCubeLoader)
    this.config = world.getSystem(ViewerConfig)
    this.inputs = new EnvProbeInputs(world.getSystem(Renderer), this.cubes, world.getSystem(SkyLightSystem).timeOfDay)
  }

  public override update(): void {
    const active = this.active
    active.length = 0
    this.global = null
    for (const entity of this.query) {
      const probe = entity.component(EnvProbeComponent)
      if (probe.enabled) {
        // the global probe is visible everywhere, it must not wait for placed probes
        probe.cube ??= this.cubes.request(
          probe.config.cubemap,
          probe.isGlobal ? PriorityLane.High : PriorityLane.Medium,
          entity,
        )
        active.push(probe)
      }
    }
    active.sort(compareEnvProbes)
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].isGlobal) {
        this.global = active[i]
        break
      }
    }
  }

  public override render(): void {
    this.inputs.write(this.global, this.config.value.environmentLight === 'baked')
  }

  public destroy(): void {
    this.active.length = 0
    this.global = null
  }
}
