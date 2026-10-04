import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { boxMat4DistanceSquared, mat4GetTranslation, vec3 } from '@gglib/math'
import { Renderer, type RenderContext } from '@gglib/render'
import {
  DISTRIBUTION_VIEW_DISTANCE_SCALE,
  LOD_SPANS,
  lodSpanVisibleEnd,
  SEGMENT_SIZE,
} from '../../constants'
import { DistributionComponent } from './DistributionComponent'

// must match the distance where impostors start to show, otherwise there is a gap or an overlap
const VISIBLE_DISTANCE = lodSpanVisibleEnd(LOD_SPANS.distribution)
// models are loaded ahead of time, so they are ready when they become visible
const PREPARE_DISTANCE_SQ = Math.pow(VISIBLE_DISTANCE + SEGMENT_SIZE, 2)

const cellMin = vec3()
const cellMax = vec3()
const cameraPosition = vec3()

/**
 * Requests distribution models around the camera and culls the distribution on the GPU before each frame.
 */
export class DistributionSystem extends GameSystem {
  private allDistributions: GameQuery
  private game: EcsGame
  private world: GameWorld
  private renderer: Renderer | null = null

  public initialize(world: GameWorld): void {
    this.world = world
    this.allDistributions = world.query({ scope: 'active', required: [DistributionComponent] })
    this.game = world.getSystem(EcsGame)
  }

  public update() {
    if (!this.renderer) {
      this.renderer = this.world.getSystem(Renderer, { optional: true })
      this.renderer?.onContextReady.add(this.cull)
    }

    const camera = this.game.scene.getView(0).camera
    for (const entity of this.allDistributions) {
      const distribution = entity.component(DistributionComponent)
      if (!distribution.ensureBatch()) {
        continue
      }
      const { origin, cellSize, mountainHeight } = distribution.options
      for (const cell of distribution.cells) {
        cellMin.x = origin.x + cell.x * cellSize
        cellMin.y = origin.y + cell.y * cellSize
        cellMin.z = 0
        cellMax.x = cellMin.x + cellSize
        cellMax.y = cellMin.y + cellSize
        cellMax.z = mountainHeight
        if (boxMat4DistanceSquared(cellMin, cellMax, camera.world) <= PREPARE_DISTANCE_SQ) {
          distribution.requestCell(cell)
        }
      }
    }
  }

  public destroy(): void {
    this.renderer?.onContextReady.remove(this.cull)
  }

  private cull = (context: RenderContext) => {
    const camera = context.view.camera
    if (camera !== this.game.scene.getView(0).camera) {
      return
    }
    mat4GetTranslation(camera.world, cameraPosition)
    for (const entity of this.allDistributions) {
      entity.component(DistributionComponent).batch?.cull({
        view: camera.view,
        projection: camera.projection,
        cameraPosition,
        visibleDistance: VISIBLE_DISTANCE,
        viewDistanceScale: DISTRIBUTION_VIEW_DISTANCE_SCALE,
      })
    }
  }
}
