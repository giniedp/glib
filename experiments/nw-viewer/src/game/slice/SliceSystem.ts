import { BasicGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { spherePointIntersects, Vec3, type IVec3 } from '@gglib/math'
import { RegionComponent } from '../region/RegionComponent'
import { SliceSpawnerComponent } from './SliceSpawnerComponent'

export class SliceSystem extends GameSystem {
  private activeSlices: GameQuery
  private activeRegions: GameQuery
  private game: BasicGame

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(BasicGame)

    this.activeRegions = world.query({ scope: 'active', required: [RegionComponent] })
    this.activeSlices = world.query({ scope: 'active', required: [SliceSpawnerComponent] })
  }

  private camPosition = new Vec3()
  public update() {
    this.game.view.camera.world.getTranslation(this.camPosition)
    for (const entity of this.activeRegions) {
      const region = entity.component(RegionComponent)
      this.updateSlices(region.slices, this.camPosition)
    }
    for (const entity of this.activeSlices) {
      const slice = entity.component(SliceSpawnerComponent)
      this.updateSlices(slice.slices, this.camPosition)
    }
  }

  private updateSlices(slices: SliceSpawnerComponent[], camera: IVec3) {
    for (const component of slices) {
      if (!component.entity.isActive) {
        if (component.entity.canInitialize) {
          component.entity.initialize()
        }
        if (component.entity.canActivate) {
          component.entity.activate()
        }
      }
      this.updateSlice(component, camera)
    }
  }

  private updateSlice(component: SliceSpawnerComponent, camera: IVec3) {
    if (component.isSpawned) {
      component.updateRanges(camera)
      return
    }
    if (!component.isLoaded) {
      component.load()
      return
    }
    const intersects = spherePointIntersects(
      component.entity.getTransform().world.translation,
      component.spawnRadius,
      camera,
    )
    if (intersects) {
      component.spawn()
    }
  }

  public destroy(): void {
    //
  }
}
