import { PriorityLane, SchedulerSystem } from '@gglib/components'
import { GameSystem, GameWorld, type GameEntity } from '@gglib/ecs'
import { Device, type TextureSource } from '@gglib/graphics'
import { ProbeCubeAtlas } from '../graphics/probes/ProbeCubeAtlas'
import { ContentService } from './ContentService'

export type ProbeCubeState = 'loading' | 'ready' | 'failed'

/**
 * A baked probe cube, shared by all probes that reference the same file
 */
export interface ProbeCube {
  file: string
  slot: number
  state: ProbeCubeState
  sources?: { specular: TextureSource; diffuse: TextureSource }
}

/**
 * Stand-in while the global probe of a level is not loaded yet
 */
const DEFAULT_PROBE_CUBE = 'engineassets/shading/defaultprobe_cm.dds'
/**
 * Uploads per frame. A cube is about 0.5 MB, the budget only prevents a burst after a level load.
 */
const MAX_UPLOADS_PER_FRAME = 1

/**
 * Loads baked probe cubes through the scheduler and uploads them to the {@link ProbeCubeAtlas} within a budget.
 *
 * @remarks
 * Cubes are requested when probes activate. They are never unloaded, there are only a few of them
 * and all of them fit the atlas.
 */
export class ProbeCubeLoader extends GameSystem {
  public atlas: ProbeCubeAtlas
  public defaultCube: ProbeCube

  public readonly cubes = new Map<string, ProbeCube>()

  private content: ContentService
  private scheduler: SchedulerSystem
  private uploads: ProbeCube[] = []

  public initialize(world: GameWorld): void {
    this.content = world.getSystem(ContentService)
    this.scheduler = world.getSystem(SchedulerSystem)
    this.atlas = new ProbeCubeAtlas(world.getSystem(Device))
    this.defaultCube = this.request(DEFAULT_PROBE_CUBE, PriorityLane.High)
  }

  /**
   * Gets the cube of a file and starts loading it on first use
   *
   * @param file - path of the specular cube, the diffuse cube is its `_diff` sibling
   * @param lane - the lane of the load, only used on first request
   * @param entity - orders the load by distance to the camera
   */
  public request(file: string, lane: PriorityLane, entity?: GameEntity): ProbeCube {
    let cube = this.cubes.get(file)
    if (cube) {
      return cube
    }
    cube = { file, slot: this.atlas.acquire(file), state: 'loading' }
    this.cubes.set(file, cube)
    if (cube.slot < 0) {
      console.warn(`Probe atlas is full, cube is not loaded: ${file}`)
      cube.state = 'failed'
      return cube
    }
    this.scheduler.schedule<void>({
      lane,
      entity,
      label: file,
      load: async () => {
        cube.sources = await this.loadSources(file)
      },
      finalize: (_, error) => {
        if (error) {
          console.warn(`Probe cube not loaded: ${file}`, error)
          cube.state = 'failed'
        } else {
          this.uploads.push(cube)
        }
      },
    })
    return cube
  }

  public override update(): void {
    for (let i = 0; i < MAX_UPLOADS_PER_FRAME && this.uploads.length; i++) {
      const cube = this.uploads.shift()
      const { specular, diffuse } = cube.sources
      cube.sources = undefined
      if (this.atlas.upload(cube.slot, specular, diffuse)) {
        cube.state = 'ready'
      } else {
        console.warn(`Probe cube does not fit the atlas: ${cube.file}`)
        cube.state = 'failed'
      }
    }
  }

  private async loadSources(file: string) {
    const [specular, diffuse] = await Promise.all([
      // the top mips are split into separate files
      this.content.loadTextureSource(`${file}?merge=true`),
      this.content.loadTextureSource(file.replace(/_cm\.dds$/, '_cm_diff.dds')),
    ])
    return { specular, diffuse }
  }

  public destroy(): void {
    this.atlas?.dispose()
    this.cubes.clear()
    this.uploads.length = 0
  }
}
