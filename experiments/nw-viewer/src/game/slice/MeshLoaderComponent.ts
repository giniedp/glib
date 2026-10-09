import {
  BoundsComponent,
  InstanceDataComponent,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialNodeComponent,
  TaskCancelledError,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import {
  mat4CreateFromArray,
  mat4CreateFromRTS,
  mat4Identity,
  mat4Multiply,
  vec3Add,
  vec3MultiplyScalar,
  vec3Subtract,
  vec4,
  type Mat4,
} from '@gglib/math'
import { Model } from '@gglib/model'
import { brand, type Brand, type EventType } from '@gglib/utils'
import type { ViewerMeshComponent } from '../../api'
import { COMBINE_INSTANCE_ARRAYS, ENABLE_INSTANCED_LEVEL_OBJECTS } from '../../constants'
import { ContentService } from '../../content'
import { createInstanceData } from '../../material/common'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import { InstancedModelComponent } from '../instancing/InstancedModelComponent'
import { InstancedRenderSystem } from '../instancing/InstancedRenderSystem'

export type MeshLoadState = Brand<number, 'MeshLoad'>
export const MeshLoadState = {
  idle: brand<MeshLoadState>(0),
  loading: brand<MeshLoadState>(1),
  loaded: brand<MeshLoadState>(2),
  failed: brand<MeshLoadState>(-1),
}

export class MeshLoaderComponent implements GameComponent {
  /**
   * Emitted when a model is successfully loaded
   */
  public static onLoad = brand<EventType<GameEntity>>(Symbol('MeshLoaderComponent.onLoad'))
  /**
   * Emitted when o model failed to load
   */
  public static onError = brand<EventType<GameEntity>>(Symbol('MeshLoaderComponent.onError'))

  public readonly entity: GameEntity
  public readonly data: ViewerMeshComponent

  private content: ContentService
  private scheduler: SchedulerSystem

  private isLoaded: boolean = false
  private task: ScheduledTask

  /**
   * Load state of the model, failed loads are not retried until the next activation
   */
  public state: MeshLoadState = MeshLoadState.idle
  /**
   * Scheduler lane of the model load
   */
  public lane: PriorityLane = PriorityLane.Low

  public constructor(data: ViewerMeshComponent) {
    this.data = data
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)
  }

  public destroy(): void {
    this.cancelLoad()
  }

  public activate(): void {
    if (this.task || this.isLoaded) {
      return
    }

    this.state = MeshLoadState.loading
    this.task = this.scheduler.schedule<Model>({
      entity: this.entity,
      lane: this.lane,
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

            const child = this.entity.world.createEntity({
              parent: this.entity,
              transform: new TransformComponent({
                local: mat4CreateFromArray(inst),
              }),
              components: [
                new BoundsComponent(),
                this.data.alwaysRender ? null : new SpatialNodeComponent(),
                new DebugShapeComponent({
                  type: 'bounds-box',
                  color: Color.LimeGreen,
                  layer: DebugLayer.MeshInstance,
                }),
                ...createModelComponent(model),
              ].filter((it) => !!it),
            })
            // render layer of the owning entity (e.g. inactive entities)
            child.layer = this.entity.layer
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

          const child = this.entity.world.createEntity({
            parent: this.entity,
            transform: new TransformComponent({
              local: mat4Identity(),
            }),
            components: [
              new BoundsComponent(),
              this.data.alwaysRender ? null : new SpatialNodeComponent(),
              new DebugShapeComponent({
                type: 'box',
                color: color,
                layer: DebugLayer.Mesh,
                instances: boxTransforms,
              }),
              ...createModelComponent(model),
            ].filter((it) => !!it),
          })
          // render layer of the owning entity (e.g. inactive entities)
          child.layer = this.entity.layer
        }
        return true
      },
      finalize: (task, err) => {
        if (this.task === task) {
          this.task = null
        }

        if (!err) {
          this.state = MeshLoadState.loaded
          this.isLoaded = true
          this.entity.events.emit(MeshLoaderComponent.onLoad, this.entity)
        } else if (err instanceof TaskCancelledError) {
          this.state = MeshLoadState.idle
          //
        } else {
          this.state = MeshLoadState.failed
          this.entity.events.emit(MeshLoaderComponent.onError, this.entity)
        }
      },
    })
  }

  /**
   * Out of range, a pending load is no longer needed. It is scheduled again on the next activation.
   */
  public deactivate(): void {
    this.cancelLoad()
  }

  private cancelLoad() {
    if (this.task) {
      // finalize resets the state to 'idle' and clears the task
      this.scheduler.cancel(this.task)
    }
  }

  /**
   * Renders static models through the GPU instance batch, falls back to the scene render path otherwise
   */
  private modelComponentFactory(model: Model): (instance: Model) => GameComponent[] {
    const maxViewDistance = (this.data.maxViewDistance || 0) * (this.data.viewDistanceMultiplier || 1)
    const instanceSystem = this.entity.world.getSystem(InstancedRenderSystem, { optional: true })
    let canInstance = ENABLE_INSTANCED_LEVEL_OBJECTS

    if (!instanceSystem || !instanceSystem.canRender(model)) {
      canInstance = false
    }
    if (this.data.alwaysRender) {
      canInstance = false
    }
    if (!this.data.instances?.length) {
      canInstance = false
    }

    if (!canInstance) {
      // shaders fade out by the relative distance to the max view distance (e.g. GeometryBeam %ENABLE_FADEOUT)
      return (instance) => {
        return [
          new InstanceDataComponent({
            data: createInstanceData({ maxViewDistance }),
          }),
          new ModelComponent({
            model: instance,
          }),
        ]
      }
    }

    const key = `${this.data.mesh}|${this.data.material || ''}`
    return (instance) => {
      return [
        new InstancedModelComponent({
          model: instance,
          key,
          maxViewDistance,
        }),
      ]
    }
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
