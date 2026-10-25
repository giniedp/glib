import { ModelComponent } from '@gglib/components'
import { GameComponent, GameEntity } from '@gglib/ecs'
import { CommonMaterial } from '@gglib/effects'
import { boxGeometry, cylinderGeometry, Device, Geometry, Mesh, sphereGeometry } from '@gglib/graphics'
import { Model } from '@gglib/model'
import { PhysicsProxy, PhysicsShape } from './physics-proxy'

/**
 * One model per shape, size and material. Entities draw instances of it, so the renderer can batch them
 */
const models = new WeakMap<Device, Map<string, Model>>()

/**
 * Gives the entity a model that matches the shape of its {@link PhysicsProxy}
 */
export class ShapeComponent implements GameComponent {
  public renderable!: ModelComponent
  public entity!: GameEntity

  public constructor(private material: CommonMaterial) {}

  public initialize() {
    this.renderable = this.entity.component(ModelComponent)
    const device = this.entity.service(Device)
    const physics = this.entity.component(PhysicsProxy)
    const size = physics.size

    if (!models.has(device)) {
      models.set(device, new Map())
    }
    const cache = models.get(device)!
    const key = `${physics.shapeType} ${size.x} ${size.y} ${size.z} ${this.material.uid}`
    if (!cache.has(key)) {
      const geometry = createGeometry(device, physics.shapeType, size.x, size.y, size.z)
      const mesh = new Mesh(device, {
        geometries: [geometry],
        materials: [this.material],
        parts: [{ geometryIndex: 0, materialIndex: 0 }],
      })
      cache.set(key, new Model(device, { meshes: [mesh] }))
    }
    this.renderable.model = cache.get(key)!.instantiate()
  }

  public destroy(): void {
    this.renderable.model?.dispose()
    this.renderable.model = null!
  }
}

function createGeometry(device: Device, shape: PhysicsShape, x: number, y: number, z: number): Geometry {
  switch (shape) {
    case PhysicsShape.Sphere:
      return sphereGeometry(device, { radius: x })
    case PhysicsShape.Cone:
      return cylinderGeometry(device, { radius: x, height: y, topRadius: 0, closeBottom: true })
    case PhysicsShape.Cylinder:
      return cylinderGeometry(device, { radius: x / 2, height: y, closeTop: true, closeBottom: true })
    default:
      return boxGeometry(device, { width: x, height: y, depth: z })
  }
}
