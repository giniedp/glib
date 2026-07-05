import type { GameComponent, GameEntity } from '@gglib/ecs'
import { boxPointIntersects, spherePointIntersects, Vec3, type IVec3 } from '@gglib/math'
import type { ViewerTimeOfDayComponent } from '../../api'
import { TimeOfDayPreset } from './TimeOfDayPreset'

export class TimeOfDayComponent implements GameComponent {
  public config: ViewerTimeOfDayComponent
  public preset: TimeOfDayPreset
  public readonly entity: GameEntity

  public constructor(config: ViewerTimeOfDayComponent) {
    this.config = config
    this.preset = new TimeOfDayPreset(config.preset)
  }

  public isPointInside(point: IVec3) {
    const world = this.entity.getTransform().world
    const px = world.translationX
    const py = world.translationY
    let pz = world.translationZ

    const config = this.config
    switch (config.shape) {
      case 'box': {
        const min = Vec3.$1.init(px - config.width / 2, py - config.depth / 2, pz - config.height / 2)
        const max = Vec3.$2.init(px + config.width / 2, py + config.depth / 2, pz + config.height / 2)
        if (boxPointIntersects(min, max, point)) {
          return true
        }
        break
      }
      case 'sphere': {
        if (spherePointIntersects(Vec3.$0.init(px, py, pz), config.radius, point)) {
          return true
        }
        break
      }
      case 'cylinder': {
        pz = point.z
        if (spherePointIntersects(Vec3.$0.init(px, py, pz), config.radius, point)) {
          return true
        }
        break
      }
    }
    return false
  }
}
