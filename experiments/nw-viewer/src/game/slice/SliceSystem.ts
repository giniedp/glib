import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { mat4GetTranslation, spherePointIntersects, vec3, vec3DistanceSquared, type IVec3 } from '@gglib/math'
import { RegionComponent } from '../region/RegionComponent'
import { SliceSpawnerComponent } from './SliceSpawnerComponent'

/**
 * Camera movement that triggers a new update pass
 */
const MOVE_THRESHOLD_SQ = 1 * 1

export class SliceSystem extends GameSystem {
  private activeRegions: GameQuery
  private game: EcsGame

  private camPosition = vec3()
  private lastPosition = vec3(Infinity, Infinity, Infinity)
  /**
   * Set when the last pass left work behind, e.g. loaded or spawned slices or pending range buckets
   */
  private hasPendingWork = true
  private topLevelCount = 0

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.activeRegions = world.query({ scope: 'active', required: [RegionComponent] })
  }

  public update() {
    const view = this.game.scene.getView(0)
    mat4GetTranslation(view.camera.world, this.camPosition)

    let topLevelCount = 0
    for (const entity of this.activeRegions) {
      topLevelCount += entity.component(RegionComponent).slices.length
    }

    const moved = vec3DistanceSquared(this.camPosition, this.lastPosition) >= MOVE_THRESHOLD_SQ
    if (!moved && !this.hasPendingWork && topLevelCount === this.topLevelCount) {
      return
    }
    if (moved) {
      this.lastPosition.x = this.camPosition.x
      this.lastPosition.y = this.camPosition.y
      this.lastPosition.z = this.camPosition.z
    }
    this.topLevelCount = topLevelCount
    this.hasPendingWork = false

    for (const entity of this.activeRegions) {
      this.updateSlices(entity.component(RegionComponent).slices, this.camPosition, moved)
    }
  }

  private updateSlices(slices: SliceSpawnerComponent[], camera: IVec3, moved: boolean) {
    for (const component of slices) {
      if (!component.entity.isActive) {
        if (component.entity.canInitialize) {
          component.entity.initialize()
        }
        if (component.entity.canActivate) {
          component.entity.activate()
        }
      }
      this.updateSlice(component, camera, moved)
      if (component.slices.length) {
        this.updateSlices(component.slices, camera, moved)
      }
    }
  }

  private updateSlice(component: SliceSpawnerComponent, camera: IVec3, moved: boolean) {
    if (component.isSpawned) {
      if (component.updateRanges(camera, moved)) {
        this.hasPendingWork = true
      }
      return
    }
    if (!component.isLoaded) {
      component.load()
      this.hasPendingWork = true
      return
    }
    const world = component.entity.getTransform().world
    const position = mat4GetTranslation(world, vec3.$0)
    const intersects = spherePointIntersects(position, component.spawnRadius, camera)
    if (intersects) {
      component.spawn()
      // spawned slices may contain nested spawners and range activatable entities
      this.hasPendingWork = true
    }
  }

  public destroy(): void {
    //
  }
}
