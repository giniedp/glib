import { GameEntity, GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { BoundingBox, BoundingSphere, Mat4, Vec3 } from '@gglib/math'
import { BoundsComponent, TransformComponent } from '../components'

export class BoundsUpdateSystem extends GameSystem {
  private query: GameQuery

  public initialize(world: GameWorld): void {
    this.query = world.query({ required: [BoundsComponent, TransformComponent] })
    //
  }

  public destroy(): void {
    //
  }

  public override update(): void {
    this.query.forEach(this.updateBounds)
  }

  private updateBounds = (entity: GameEntity) => {
    const transform = entity.getTransform() as TransformComponent
    const bounds = entity.component(BoundsComponent)
    if (bounds.transformVersion === transform.version) {
      // bounds are up to date
      return
    }

    bounds.transformVersion = transform.version
    bounds.version++
    const world = bounds.world
    const local = bounds.local

    if (local.sphere) {
      world.sphere ||= new BoundingSphere()
      updateSphere(local.sphere, world.sphere, transform.world)
    } else {
      world.sphere = null
    }

    if (local.box) {
      world.box ||= new BoundingBox()
      updateBoxExact(local.box, world.box, transform.world)
    } else {
      world.box = null
    }
  }
}

function updateSphere(local: BoundingSphere, world: BoundingSphere, transform: Mat4) {
  world.center.init(local.radius, local.radius, local.radius)
  world.radius = transform.transformV3Normal(world.center).length()
  transform.transformV3(local.center, world.center)
}

const temp = Vec3.init({}, 0, 0, 0)
function updateBoxExact(local: BoundingBox, world: BoundingBox, transform: Mat4) {
  const t = temp

  transform.transformV3(local.getCorner(0, t))
  world.init(t.x, t.y, t.z, t.x, t.y, t.z)

  world.mergePoint(transform.transformV3(local.getCorner(1, t)))
  world.mergePoint(transform.transformV3(local.getCorner(2, t)))
  world.mergePoint(transform.transformV3(local.getCorner(3, t)))
  world.mergePoint(transform.transformV3(local.getCorner(4, t)))
  world.mergePoint(transform.transformV3(local.getCorner(5, t)))
  world.mergePoint(transform.transformV3(local.getCorner(6, t)))
  world.mergePoint(transform.transformV3(local.getCorner(7, t)))
  // console.assert(!world.isEmpty, 'transformed box should not be empty')
  // console.assert(world.max.x - world.min.x >= 0, 'invalid box')
  // console.assert(world.max.y - world.min.y >= 0, 'invalid box')
  // console.assert(world.max.z - world.min.z >= 0, 'invalid box')
}
