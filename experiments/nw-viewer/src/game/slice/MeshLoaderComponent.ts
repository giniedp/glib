import {
  BoundsComponent,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialNodeComponent,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import { Mat4, Vec3, Vec4 } from '@gglib/math'
import { Model } from '@gglib/model'
import { brand, type EventType } from '@gglib/utils'
import type { ViewerMeshComponent } from '../../api'
import { ContentService } from '../../content'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'

export class MeshLoaderComponent implements GameComponent {
  public static onLoad = brand<EventType<GameEntity>>(Symbol('MeshLoaderComponent.onLoaded'))

  public readonly entity: GameEntity
  public readonly data: ViewerMeshComponent

  private content: ContentService
  private scheduler: SchedulerSystem

  private isLoaded: boolean = false
  private task: ScheduledTask

  public constructor(data: ViewerMeshComponent) {
    this.data = data
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)
  }

  public destroy(): void {
    //
  }

  public activate(): void {
    if (this.task || this.isLoaded) {
      return
    }

    this.task = this.scheduler.schedule<Model>({
      entity: this.entity,
      lane: PriorityLane.Low,
      context: null,
      load: async (task) => {
        task.context = await this.content.loadModel(this.data.mesh, this.data.material)
      },
      work: (task) => {
        const device = task.context.device
        const options = task.context.toOptions()

        if (this.data.instances?.length > 0) {
          for (const inst of this.data.instances) {
            const model = new Model(device, options)

            this.entity.world.createEntity({
              parent: this.entity,
              transform: new TransformComponent({
                local: Mat4.createFromArray(inst),
              }),
              components: [
                new BoundsComponent(),
                this.data.alwaysRender ? null : new SpatialNodeComponent(),
                new DebugShapeComponent({
                  type: 'bounds-box',
                  color: Color.LimeGreen,
                  layer: DebugLayer.BoundsMeshInstance,
                }),
                new ModelComponent({ model }),
              ].filter((it) => !!it),
            })
          }
        } else {
          const model = new Model(device, options)
          const color = { x: 0, y: 0, z: 1 }
          if (this.data.visibilityOccluder) {
            color.x = 1
          }
          if (this.data.alwaysRender) {
            color.x = 1
            color.y = 1
          }

          const boxTransforms: Mat4[] = []
          // console.log('scene', model.sceneNodes)
          for (const node of model.sceneNodes) {
            const mesh = model.meshes[node.data?.mesh]
            if (!mesh) {
              continue
            }
            const box = mesh.boundingBox
            const boxScale = Vec3.subtract(box.max, box.min)
            const boxCenter = Vec3.add(box.min, box.max).multiplyScalar(0.5)
            const boxTransform = Mat4.createFromRTS(Vec4.create(0, 0, 0, 1), boxCenter, boxScale)
            boxTransforms.push(node.world.copy().premultiply(boxTransform))
          }

          this.entity.world.createEntity({
            parent: this.entity,
            transform: new TransformComponent({
              local: Mat4.createIdentity(),
            }),
            components: [
              new BoundsComponent(),
              this.data.alwaysRender ? null : new SpatialNodeComponent(),
              new DebugShapeComponent({
                type: 'box',
                color: color,
                layer: DebugLayer.BoundsMesh,
                instances: boxTransforms,
              }),
              new ModelComponent({
                model,
              }),
            ].filter((it) => !!it),
          })
        }
        return true
      },
      finalize: (task, err) => {
        this.isLoaded = !err
        if (this.task === task) {
          this.task = null
        }
        this.entity.events.emit(MeshLoaderComponent.onLoad, this.entity)
      },
    })
  }

  public deactivate(): void {
    //
  }
}
