import { BasicGame } from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { boxMat4DistanceSquared } from '@gglib/math'
import { LOD_SPANS, lodSpanEnd, lodSpanStart, lodSpanVisibleEnd } from '../../constants'
import type { ContentService } from '../../content'
import { RegionComponent } from './RegionComponent'
import { RegionImpostorComponent } from './RegionImpostorComponent'

const IMPOSTOR_SHOW_AT = Math.pow(lodSpanStart(LOD_SPANS.impostor), 2)
const IMPOSTOR_HIDE_AT = Math.pow(lodSpanVisibleEnd(LOD_SPANS.impostor), 2)
const IMPOSTOR_UNLOAD_AT = Math.pow(lodSpanEnd(LOD_SPANS.impostor), 2)

export class RegionSystem extends GameSystem {
  private allRegions: GameQuery

  private game: BasicGame
  private content: ContentService
  private world: GameWorld

  public initialize(world: GameWorld): void {
    this.world = world
    this.allRegions = world.query({ scope: 'all', required: [RegionComponent] })
    this.game = world.getSystem(BasicGame)

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
    const camera = this.game.view.camera

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
    const camera = this.game.view.camera
    const impostor = entity.component(RegionImpostorComponent)
    const distance = boxMat4DistanceSquared(impostor.min, impostor.max, camera.world)

    const impostorShouldShow = IMPOSTOR_SHOW_AT <= distance && distance <= IMPOSTOR_HIDE_AT

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
