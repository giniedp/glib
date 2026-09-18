import { ModelComponent } from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameEntity } from '@gglib/ecs'
import { BasicMaterial, boxGeometry, cylinderGeometry, Device, Geometry, Mesh, sphereGeometry } from '@gglib/graphics'
import { vec3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { PhysicsProxy, PhysicsShape } from './physics-proxy'

export class GameComponent implements GameComponent {
  public renderable!: ModelComponent
  public entity!: GameEntity

  public async initialize() {
    this.renderable = this.entity.component(ModelComponent)
    const content = this.entity.service(ContentLoader)
    const device = this.entity.service(Device)
    const physics = this.entity.component(PhysicsProxy)
    const size = physics.size

    let geometry!: Geometry
    switch (physics.shapeType) {
      case PhysicsShape.Box: {
        geometry = boxGeometry(device, {
          width: size.x,
          height: size.y,
          depth: size.z,
        })
        break
      }
      case PhysicsShape.Sphere: {
        geometry = sphereGeometry(device, {
          radius: size.x,
        })
        break
      }
      case PhysicsShape.Capsule: {
        geometry = boxGeometry(device, {
          width: size.x,
          height: size.y,
          depth: size.z,
        })
        break
      }
      case PhysicsShape.Cone: {
        geometry = cylinderGeometry(device, {
          radius: size.x,
          height: size.y,
          topRadius: 0,
          closeBottom: true,
        })
        break
      }
      case PhysicsShape.Cylinder: {
        geometry = cylinderGeometry(device, {
          radius: size.x / 2,
          height: size.y,
          closeTop: true,
          closeBottom: true,
        })
        break
      }
    }
    const material = new BasicMaterial(device)
    material.BaseColor = vec3(Math.random(), Math.random(), Math.random())

    const mesh = new Mesh(device, {
      geometries: [geometry],
      materials: [material],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
    })
    const model = new Model(device, {
      meshes: [mesh],
    })

    this.renderable.model = model
  }

  public destroy(): void {
    this.renderable.model?.dispose()
    this.renderable.model = null!
  }
}
