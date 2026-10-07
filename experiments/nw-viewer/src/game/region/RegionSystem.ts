import { EcsGame } from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import {
  BoundingFrustum,
  boxMat4DistanceSquared,
  frustumBoxIntersects,
  mat4GetTranslationX,
  mat4GetTranslationY,
  vec3,
  vec3$initFrom,
  type IVec3,
  type Mat4,
} from '@gglib/math'
import {
  CHUNK_MESH_RANGE,
  ENABLE_POI_IMPOSTOR_DITHER,
  IMPOSTOR_FADE_RANGE,
  LOD_SPANS,
  lodSpanStart,
  lodSpanVisibleEnd,
  RANGE_ACTIVATION_BUDGET_MS,
  RANGE_HYSTERESIS,
} from '../../constants'
import type { ContentService } from '../../content'
import { RegionComponent } from './RegionComponent'
import { RegionImpostorComponent } from './RegionImpostorComponent'

export class RegionSystem extends GameSystem {
  private allRegions: GameQuery

  private game: EcsGame
  private content: ContentService
  private world: GameWorld

  public initialize(world: GameWorld): void {
    this.world = world
    this.allRegions = world.query({ scope: 'all', required: [RegionComponent] })
    this.game = world.getSystem(EcsGame)

    this.world.eventBus.on(GameEntity.onInitialized, this.addRegionTag)
    this.world.eventBus.on(GameEntity.onDestroyed, this.removeRegionTag)
  }

  /**
   * Camera frustum of this frame, impostor models are loaded only for cells in view
   */
  private frustum = new BoundingFrustum()
  private loadMin = vec3()
  private loadMax = vec3()

  public update() {
    const start = performance.now()
    const camera = this.game.scene.getView(0).camera
    this.frustum.updateFromViewProjection(camera.view, camera.projection)
    this.loadingCells.length = 0
    for (const entity of this.allRegions) {
      const region = entity.component(RegionComponent)
      this.updateRegionVisibility(region)
      if (entity.isActive) {
        this.updateRegionImpostor(region)
      }
    }
    this.updateLoadingCells(start + RANGE_ACTIVATION_BUDGET_MS)
  }

  /**
   * POI cells in the loading state of this frame, with their squared distance to the camera
   */
  private loadingCells: Array<{ cell: RegionImpostorComponent; distance: number }> = []

  /**
   * Advances the chunk state of a POI cell that owns chunks
   *
   * @param distance - squared distance from the camera to the cell box
   */
  private updateCellState(cell: RegionImpostorComponent, distance: number) {
    const loadAt = CHUNK_MESH_RANGE
    const unloadAt = CHUNK_MESH_RANGE * RANGE_HYSTERESIS
    if (cell.cellState === 'far') {
      if (distance <= loadAt * loadAt) {
        cell.setCellState('loading')
      }
    } else if (distance > unloadAt * unloadAt) {
      cell.deactivateMembers()
      cell.setCellState('far')
    }
    if (cell.cellState === 'loading') {
      this.loadingCells.push({ cell, distance })
    }
  }

  /**
   * Spawns and activates the content of loading cells, nearest first, until the deadline
   */
  private updateLoadingCells(deadline: number) {
    this.loadingCells.sort((a, b) => a.distance - b.distance)
    for (const { cell } of this.loadingCells) {
      if (cell.updateLoading(deadline)) {
        cell.setCellState('ready')
      }
      if (performance.now() > deadline) {
        break
      }
    }
  }

  public destroy(): void {
    this.world.eventBus.off(GameEntity.onInitialized, this.addRegionTag)
    this.world.eventBus.off(GameEntity.onDestroyed, this.removeRegionTag)
  }

  private updateRegionVisibility(region: RegionComponent) {
    const entity = region.entity
    const camera = this.game.scene.getView(0).camera

    if (!entity) {
      debugger
    }
    const regionSize = region.regionSize
    const cellSize = region.cellSize

    const activateAt = regionSize * 0.5 - cellSize
    const deactivateAt = regionSize * 0.5

    const distance = Math.sqrt(boxMat4DistanceSquared(region.min, region.max, camera.world))
    if (entity.isActive && distance >= deactivateAt) {
      entity.deactivate()
      this.deactivateRegionImpostor(entity)
    }

    if (!entity.isActive && distance <= activateAt) {
      if (entity.canInitialize) {
        entity.initialize()
      }
      entity.activate()
    }
  }

  private deactivateRegionImpostor(entity: GameEntity) {
    const region = entity.component(RegionComponent)
    for (const child of region.impostors.getTransform().children) {
      const impostor = child.entity.component(RegionImpostorComponent)
      if (impostor.hasChunks && impostor.cellState !== 'far') {
        impostor.deactivateMembers()
        impostor.setCellState('far')
      }
      if (child.entity.canDeactivate) {
        child.entity.deactivate()
      }
    }
  }

  private updateRegionImpostor(region: RegionComponent) {
    for (const child of region.impostors.getTransform().children) {
      this.updateImpostorVisibility(region, child.entity)
    }
  }

  private updateImpostorVisibility(region: RegionComponent, entity: GameEntity) {
    const camera = this.game.scene.getView(0).camera
    const impostor = entity.component(RegionImpostorComponent)
    const distance = boxMat4DistanceSquared(impostor.min, impostor.max, camera.world)

    const showAt = lodSpanStart(impostor.span)
    const hideAt = lodSpanVisibleEnd(impostor.span)
    let impostorShouldShow = showAt * showAt <= distance && distance <= hideAt * hideAt
    if (impostor.span === LOD_SPANS.impostorPoi && region.enableChunks && impostor.hasChunks) {
      // The cell drives its chunk content. The impostor stays until the holding chunk meshes are loaded,
      // even if the camera is inside the cell.
      this.updateCellState(impostor, distance)
      impostorShouldShow =
        distance <= hideAt * hideAt && (distance >= showAt * showAt || impostor.cellState !== 'ready')
    } else if (impostor.span === LOD_SPANS.impostorPoi && ENABLE_POI_IMPOSTOR_DITHER) {
      // A POI cell covers many meshes, each activated by the distance to itself. Keep the cell visible as long as
      // any part of it is beyond showAt, so it still covers the meshes that are not active yet.
      // The shader discards impostor pixels closer than showAt, so the near part does not overlap.
      impostorShouldShow =
        boxFarthestDistanceSquared(impostor.min, impostor.max, camera.world) >= showAt * showAt &&
        distance <= hideAt * hideAt
    }
    if (impostor.span === LOD_SPANS.impostor) {
      // vegetation impostors crossfade with the distribution in [showAt - IMPOSTOR_FADE_RANGE, showAt].
      // A cell must be visible as soon as any part of it reaches into that range, the shader discards the closer pixels.
      const fadeStart = showAt - IMPOSTOR_FADE_RANGE
      impostorShouldShow =
        boxFarthestDistanceSquared(impostor.min, impostor.max, camera.world) >= fadeStart * fadeStart &&
        distance <= hideAt * hideAt
    }

    if (entity.isActive && !impostorShouldShow) {
      entity.deactivate()
    }

    if (!entity.isActive && impostorShouldShow) {
      if (entity.canInitialize) {
        entity.initialize()
      }
      entity.activate()
    }

    if (entity.isActive) {
      impostor.updateLoad(this.isCellInView(impostor, region.cellSize))
    }
  }

  /**
   * Whether the cell box, grown by one cell horizontally, intersects the camera frustum.
   * The margin loads cells shortly before they turn into view.
   */
  private isCellInView(impostor: RegionImpostorComponent, margin: number) {
    vec3$initFrom(this.loadMin, impostor.min)
    vec3$initFrom(this.loadMax, impostor.max)
    this.loadMin.x -= margin
    this.loadMin.y -= margin
    this.loadMax.x += margin
    this.loadMax.y += margin
    return frustumBoxIntersects(this.frustum, this.loadMin, this.loadMax)
  }

  private addRegionTag = (entity: GameEntity) => {
    const root = entity.component(RegionComponent, GetComponent.OptionalFollowParent)
    if (root && !entity.has(root.Tag)) {
      // prettier-ignore
      entity.addComponent(
        new root.Tag(), // instance
        root.Tag, // instance type
        RegionComponent.Tag, // alias type, so it can be found without knowing the instance type
      )
    }
  }

  private removeRegionTag = (entity: GameEntity) => {
    entity.removeComponentByType(RegionComponent.Tag)
  }
}

/**
 * Squared horizontal distance from the camera position to the farthest point of the box.
 * Impostor boxes span the whole region height, so the vertical axis is ignored.
 */
function boxFarthestDistanceSquared(min: IVec3, max: IVec3, world: Mat4) {
  const x = mat4GetTranslationX(world)
  const y = mat4GetTranslationY(world)
  const dx = Math.max(Math.abs(x - min.x), Math.abs(x - max.x))
  const dy = Math.max(Math.abs(y - min.y), Math.abs(y - max.y))
  return dx * dx + dy * dy
}
