import { BasicGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { spherePointIntersects } from '@gglib/math'
import { SliceSpawnerComponent } from './SliceSpawnerComponent'

export class SliceSystem extends GameSystem {
  private qrSlices: GameQuery
  private game: BasicGame

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(BasicGame)
    this.qrSlices = world.query({ required: [SliceSpawnerComponent] })
  }

  public update() {
    const camera = this.game.view.camera.world.translation

    for (const entity of this.qrSlices) {
      const component = entity.component(SliceSpawnerComponent)

      if (component.isInstantiated) {
        component.updateRanges(this.game.view.camera)
        continue
      }

      if (!component.data) {
        component.load()
        continue
      }

      // if (!component.data.isStaticSlice) {
      //   continue
      // }

      const intersects = spherePointIntersects(
        entity.getTransform().world.translation,
        component.data.spawnRadius,
        camera,
      )
      if (intersects) {
        component.instantiate()
      }
    }
  }

  public destroy(): void {
    //
  }
}
