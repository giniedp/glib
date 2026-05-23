import {
  LifeCycleFlags,
  PriorityLane,
  SchedulerSystem,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { ActivatableComponent, CreateEntityOptions, GameComponent, GameEntity } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import { Mat4, spherePointIntersects } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import {
  fetchTypedRequest,
  getSliceUrl,
  isViewerMeshComponent,
  isViewerPrefabSpawnerComponent,
  type AssetReference,
  type ViewerSlice,
} from '../../api'
import { ContentService } from '../../content'
import { DebugShapeComponent } from '../debug/DebugShapeComponent'
import { MeshLoaderComponent } from './MeshLoaderComponent'

export interface SliceSpawnerComponentOptions {
  capitalId: string
  slice: AssetReference
}

export class SliceSpawnerComponent implements GameComponent, ActivatableComponent {
  public capitalId: string
  public entity: GameEntity
  public slice: AssetReference
  public debug: DebugShapeComponent
  private content: ContentService
  private scheduler: SchedulerSystem
  private loadTask: ScheduledTask
  private rangeActivatable: Array<{ entity: GameEntity; range: number }> = []

  public data: ViewerSlice
  public isInstantiated: boolean

  public constructor(data: SliceSpawnerComponentOptions) {
    this.capitalId = data.capitalId
    this.slice = data.slice
  }

  public initialize(): void {
    this.scheduler = this.entity.service(SchedulerSystem)
    this.content = this.entity.service(ContentService)
    this.debug = this.entity.getOrCreateComponent(DebugShapeComponent, () => {
      return new DebugShapeComponent({
        type: 'sphere',
        solid: false,
      })
    })
  }

  public activate(): void {
    //
  }

  public load() {
    if (this.loadTask || this.data) {
      return
    }
    this.debug.color = Color.Yellow
    this.loadTask = this.scheduler.schedule({
      lane: PriorityLane.Low,
      entity: this.entity,
      load: async () => {
        this.data = await fetchTypedRequest(this.content.nwbtUrl, getSliceUrl(this.slice))
        this.data.entities ||= []
        this.debug.color = Color.Green
        this.debug.scale.x = this.data.spawnRadius
        this.debug.scale.y = this.data.spawnRadius
        this.debug.scale.z = this.data.spawnRadius

        if (this.capitalId === '2a3ad663-ffcf-c6a1-7aa8-cbefb7a76f09') {
          this.debug.color = Color.Red
          this.debug.solid = true
          console.log('Loaded slice data', this.data, this.entity.getTransform().world.getTranslation())
        }
      },
      onCancel: () => {
        this.loadTask = null
      },
      onDone: () => {
        this.loadTask = null
      },
    })
  }

  public unload() {
    //
  }

  public instantiate() {
    if (this.isInstantiated || !this.data) {
      return
    }
    this.isInstantiated = true
    if (!this.data.entities?.length) {
      this.debug.color = Color.Red
      return
    }

    this.debug.color = Color.White
    const parent = this.entity
    const parentWorld = parent.getTransform().world
    let range: number = 0
    for (const item of this.data.entities) {
      const options: CreateEntityOptions = {
        parent: this.entity,
        name: item.name,

        components: [
          new DebugShapeComponent({
            type: 'box',
            solid: false,
            color: { x: 1, y: 0, z: 1, w: 1 },
          }),
        ],
      }
      for (const comp of item.components) {
        if (isViewerMeshComponent(comp)) {
          options.components.push(new MeshLoaderComponent(comp))
          range = Math.max(range, comp.maxViewDistance * comp.viewDistanceMultiplier)
          continue
        }
        if (isViewerPrefabSpawnerComponent(comp)) {
          options.components.push(
            new SliceSpawnerComponent({
              slice: comp.slice,
              capitalId: '',
            }),
          )
          continue
        }
        console.log(comp.type)
      }

      options.transform = new TransformComponent({
        keepWorld: true,
        world: Mat4.createFromArray(item.transform).premultiply(parentWorld),
        lifeCycle: range ? LifeCycleFlags.Propagate : LifeCycleFlags.Full,
      })

      const entity = this.entity.world.createEntity(options)
      if (range) {
        range = 500
        this.rangeActivatable.push({ entity, range })
      }
    }
  }

  public updateRanges(camera: CameraData) {
    for (const item of this.rangeActivatable) {
      const shouldActivate = spherePointIntersects(
        item.entity.getTransform().world.translation,
        item.range,
        camera.world.translation,
      )

      if (shouldActivate && !item.entity.isActive) {
        if (item.entity.canInitialize) {
          item.entity.initialize()
        }
        if (item.entity.canActivate) {
          item.entity.activate()
        }
      }

      if (!shouldActivate && item.entity.isActive) {
        if (item.entity.canDeactivate) {
          item.entity.deactivate()
        }
      }
    }
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    //
  }
}
