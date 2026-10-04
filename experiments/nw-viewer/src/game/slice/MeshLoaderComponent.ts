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
import {
  type Mat4,
  mat4CreateFromArray,
  mat4CreateFromRTS,
  mat4Identity,
  mat4Multiply,
  vec3Add,
  vec3MultiplyScalar,
  vec3Subtract,
  vec4,
} from '@gglib/math'
import { Model } from '@gglib/model'
import { brand, type EventType } from '@gglib/utils'
import type { ViewerMeshComponent } from '../../api'
import { COMBINE_INSTANCE_ARRAYS, ENABLE_INSTANCED_LEVEL_OBJECTS } from '../../constants'
import { ContentService } from '../../content'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import { InstancedModelComponent } from '../instancing/InstancedModelComponent'
import { InstancedRenderSystem } from '../instancing/InstancedRenderSystem'

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
        const createModelComponent = this.modelComponentFactory(task.context)
        const combineInstances = COMBINE_INSTANCE_ARRAYS && !task.context.skins?.length
        if (this.data.instances?.length > 0 && !combineInstances) {
          for (const inst of this.data.instances) {
            const model = task.context.instantiate({
              meshes: false,
              materials: false,
            })

            this.entity.world.createEntity({
              parent: this.entity,
              transform: new TransformComponent({
                local: mat4CreateFromArray(inst),
              }),
              components: [
                new BoundsComponent(),
                this.data.alwaysRender ? null : new SpatialNodeComponent(),
                this.addMeshDebugInfo(
                  new DebugShapeComponent({
                    type: 'bounds-box',
                    color: Color.LimeGreen,
                    layer: DebugLayer.MeshInstance,
                  }),
                ),
                createModelComponent(model),
              ].filter((it) => !!it),
            })
          }
        } else {
          const model =
            this.data.instances?.length > 0
              ? createInstanceArrayModel(task.context, this.data.instances)
              : task.context.instantiate({
                  meshes: false,
                  materials: false,
                })
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
            const boxScale = vec3Subtract(box.max, box.min)
            const boxCenter = vec3MultiplyScalar(vec3Add(box.min, box.max), 0.5)
            const boxTransform = mat4CreateFromRTS(vec4(0, 0, 0, 1), boxCenter, boxScale)
            boxTransforms.push(mat4Multiply(node.world, boxTransform))
          }

          this.entity.world.createEntity({
            parent: this.entity,
            transform: new TransformComponent({
              local: mat4Identity(),
            }),
            components: [
              new BoundsComponent(),
              this.data.alwaysRender ? null : new SpatialNodeComponent(),
              this.addMeshDebugInfo(
                new DebugShapeComponent({
                  type: 'box',
                  color: color,
                  layer: DebugLayer.Mesh,
                  instances: boxTransforms,
                }),
              ),
              createModelComponent(model),
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

  private addMeshDebugInfo(debug: DebugShapeComponent) {
    const data = this.data
    return debug
      .addInfo('mesh', () => data.mesh)
      .addInfo('material', () => data.material)
      .addInfo('maxViewDistance', () => data.maxViewDistance)
      .addInfo('viewDistanceMultiplier', () => data.viewDistanceMultiplier)
      .addInfo('instances', () => data.instances?.length ?? 0)
      .addInfo('alwaysRender', () => !!data.alwaysRender)
      .addInfo('visibilityOccluder', () => !!data.visibilityOccluder)
  }

  /**
   * Renders static models through the GPU instance batch, falls back to the scene render path otherwise
   */
  private modelComponentFactory(model: Model): (instance: Model) => GameComponent {
    const system = ENABLE_INSTANCED_LEVEL_OBJECTS
      ? this.entity.world.getSystem(InstancedRenderSystem, { optional: true })
      : null
    const canInstance =
      !!system &&
      this.data.instances?.length > 0 &&
      !this.data.alwaysRender &&
      InstancedModelComponent.canRender(system, model)
    if (!canInstance) {
      return (instance) => new ModelComponent({ model: instance })
    }
    const key = `${this.data.mesh}|${this.data.material || ''}`
    const maxViewDistance = (this.data.maxViewDistance || 0) * (this.data.viewDistanceMultiplier || 1)
    return (instance) => new InstancedModelComponent({ model: instance, key, maxViewDistance })
  }
}

/**
 * Creates a model that contains the mesh nodes of the source model once per instance.
 * The meshes are shared with the source model, so all instances are rendered and culled as one model.
 */
function createInstanceArrayModel(source: Model, instances: ArrayLike<number>[]): Model {
  const base = source.instantiate({ meshes: false, materials: false })
  base.update(mat4Identity())
  const meshNodes = base.sceneNodes.filter((node) => source.meshes[node.data?.mesh])
  const nodes = []
  for (const instance of instances) {
    const instanceMatrix = mat4CreateFromArray(instance)
    for (const node of meshNodes) {
      nodes.push({
        name: node.data.name,
        mesh: node.data.mesh,
        matrix: Array.from(mat4Multiply(instanceMatrix, node.world)),
      })
    }
  }
  return new Model(source.device, {
    name: source.name,
    meta: { ...source.meta },
    meshes: source.meshes,
    nodes,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    scene: 0,
  })
}
