import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { mat4GetTranslation, spherePointIntersects, vec3, type IVec3 } from '@gglib/math'
import { RegionComponent } from '../region/RegionComponent'
import { SliceSpawnerComponent } from './SliceSpawnerComponent'

export class SliceSystem extends GameSystem {
  private activeSlices: GameQuery
  private activeRegions: GameQuery
  private game: EcsGame

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)

    this.activeRegions = world.query({ scope: 'active', required: [RegionComponent] })
    this.activeSlices = world.query({ scope: 'active', required: [SliceSpawnerComponent] })
  }

  private camPosition = vec3()
  public update() {
    const view = this.game.scene.getView(0)
    mat4GetTranslation(view.camera.world, this.camPosition)
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
    const world = component.entity.getTransform().world
    const position = mat4GetTranslation(world, vec3.$0)
    const intersects = spherePointIntersects(position, component.spawnRadius, camera)
    if (intersects) {
      component.spawn()
    }
  }

  public destroy(): void {
    //
  }
}
