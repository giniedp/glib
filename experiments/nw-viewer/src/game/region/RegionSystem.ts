import { EcsGame } from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { boxMat4DistanceSquared, type IVec3, type Mat4 } from '@gglib/math'
import { IMPOSTOR_FADE_RANGE, LOD_SPANS, lodSpanStart, lodSpanVisibleEnd } from '../../constants'
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

  public update() {
    for (const entity of this.allRegions) {
      const region = entity.component(RegionComponent)
      this.updateRegionVisibility(region)
      if (entity.isActive) {
        this.updateRegionImpostor(region)
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
      if (child.entity.canDeactivate) {
        child.entity.deactivate()
      }
    }
  }

  private updateRegionImpostor(region: RegionComponent) {
    for (const child of region.impostors.getTransform().children) {
      this.updateImpostorVisibility(child.entity)
    }
  }

  private updateImpostorVisibility(entity: GameEntity) {
    const camera = this.game.scene.getView(0).camera
    const impostor = entity.component(RegionImpostorComponent)
    const distance = boxMat4DistanceSquared(impostor.min, impostor.max, camera.world)

    const showAt = lodSpanStart(impostor.span)
    const hideAt = lodSpanVisibleEnd(impostor.span)
    let impostorShouldShow = showAt * showAt <= distance && distance <= hideAt * hideAt
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
