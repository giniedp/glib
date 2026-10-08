import {
  BoundsComponent,
  InstanceDataComponent,
  LifeCycleFlags,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialNodeComponent,
  TaskPhase,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import { GameEntity, type CreateEntityOptions, type GameComponent } from '@gglib/ecs'

import { Color } from '@gglib/graphics'
import { mat4CreateTranslation, vec3AddScalars, vec4$initFrom, type IVec3 } from '@gglib/math'
import type { Model } from '@gglib/model'
import { ContentService } from '../../content'
import { setInstanceDissolveAmount } from '../../material'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import type { MeshLoaderComponent } from '../slice/MeshLoaderComponent'
import type { SliceSpawnerComponent } from '../slice/SliceSpawnerComponent'

export interface ImpostorComponentOptions {
  name: string
  regionSize: number
  cellSize: number
  origin: IVec3
  model: string
  isPOI: boolean
}

export function impostorEntityOptions(parent: GameEntity, options: ImpostorComponentOptions): CreateEntityOptions {
  return {
    parent: parent,
    name: options.name,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateTranslation(options.origin),
      lifeCycle: LifeCycleFlags.Propagate, // is controlled by RegionSystem
    }),
    components: [
      new DebugShapeComponent({
        type: 'bounds-box',
        layer: options.isPOI ? DebugLayer.Impostor_POI : DebugLayer.Impostor_VEG,
        color: options.isPOI ? Color.Orange : Color.Lime,
      }),
      new SpatialNodeComponent(),
      new BoundsComponent(),
      new ModelComponent(),
      new InstanceDataComponent(),
      new RegionImpostorComponent(options),
    ],
  }
}
/**
 * - far: chunk content is inactive, the impostor is shown
 * - loading: chunks are spawned and their meshes are activated, the impostor is shown
 * - ready: all members are active and loaded, the impostor may hide
 */
export type ImpostorCellState = 'far' | 'loading' | 'ready'

export interface ImpostorCellMember {
  entity: GameEntity
  loaders: MeshLoaderComponent[]
}

export class RegionImpostorComponent implements GameComponent {
  private content: ContentService
  private scheduler: SchedulerSystem

  public readonly entity: GameEntity
  public readonly min: IVec3
  public readonly max: IVec3
  public readonly isPoi: boolean
  private modelUrl: string
  private task: ScheduledTask
  private model: Model
  private instance: InstanceDataComponent

  /**
   * Chunk slices owned by this cell, spawned when the cell starts loading (POI cells in chunk worlds only)
   */
  public readonly chunks: SliceSpawnerComponent[] = []
  /**
   * Mesh entities of the owned chunks with a size in IMPOSTOR_HOLD_CHUNK_SIZES, activated by the cell instead of the
   * range system. The cell waits for them before it is ready.
   */
  public readonly members: ImpostorCellMember[] = []
  public cellState: ImpostorCellState = 'far'
  /**
   * Number of members activated since the cell started loading
   */
  private activated = 0

  public get hasChunks() {
    return this.chunks.length > 0
  }

  public setCellState(state: ImpostorCellState) {
    this.cellState = state
    const shape = this.entity.component(DebugShapeComponent).entries[0]

    switch (state) {
      case 'loading': {
        vec4$initFrom(shape.color, Color.Red)
        break
      }
      case 'ready': {
        vec4$initFrom(shape.color, Color.DeepSkyBlue)
        setInstanceDissolveAmount(this.instance.data, 1)
        break
      }
      default: {
        vec4$initFrom(shape.color, Color.Orange)
        break
      }
    }
  }

  public addMember(member: ImpostorCellMember) {
    for (const loader of member.loaders) {
      loader.lane = PriorityLane.High
    }
    this.members.push(member)
  }

  public removeMembers(parent: GameEntity) {
    for (let i = this.members.length - 1; i >= 0; i--) {
      if (this.members[i].entity.parent === parent) {
        this.members.splice(i, 1)
      }
    }
    this.activated = Math.min(this.activated, this.members.length)
  }

  /**
   * Number of members whose meshes are not loaded yet
   */
  public countPending() {
    let result = 0
    for (const member of this.members) {
      if (!isMemberDone(member)) {
        result++
      }
    }
    return result
  }

  /**
   * Spawns the owned chunks and activates members until the deadline. Returns true when the cell is ready.
   */
  public updateLoading(deadline: number): boolean {
    let spawned = true
    for (const chunk of this.chunks) {
      if (chunk.isSpawned) {
        continue
      }
      // the chunk entity is initialized by the SliceSystem
      if (!chunk.entity.isInitialized) {
        spawned = false
        continue
      }
      chunk.load()
      chunk.spawn()
    }
    while (this.activated < this.members.length) {
      const entity = this.members[this.activated].entity
      if (entity.canInitialize) {
        entity.initialize()
      }
      if (entity.canActivate) {
        entity.activate()
      }
      this.activated++
      if ((this.activated & 7) === 0 && performance.now() > deadline) {
        return false
      }
    }

    return spawned && this.countPending() === 0
  }

  public deactivateMembers() {
    for (const member of this.members) {
      if (member.entity.canDeactivate) {
        member.entity.deactivate()
      }
    }
    this.activated = 0
  }

  public constructor(data: ImpostorComponentOptions) {
    this.isPoi = !!data.isPOI
    const half = data.cellSize * 0.5
    this.min = vec3AddScalars(data.origin, -half, -half, 0)
    this.max = vec3AddScalars(data.origin, half, half, data.regionSize)
    this.modelUrl = data.model
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)
    this.instance = this.entity.component(InstanceDataComponent)
  }

  public activate(): void {
    // the model is requested by the RegionSystem with updateLoad(), once the cell is in view
  }

  /**
   * Requests the model while the cell is in view. A queued load of a cell that left the view is cancelled,
   * a load in flight is kept, it is likely needed again soon and most of the work is done.
   */
  public updateLoad(inView: boolean): void {
    if (this.model) {
      return
    }
    if (!inView) {
      if (this.task?.phase === TaskPhase.Idle) {
        this.scheduler.cancel(this.task)
      }
      return
    }
    if (this.task) {
      return
    }
    this.task = this.scheduler.schedule<Model>({
      lane: PriorityLane.Critical,
      entity: this.entity,
      label: this.modelUrl,
      context: null,
      load: async (task) => {
        task.context = await this.content.loadModel(this.modelUrl, null)
      },
      work: (task) => {
        this.model = task.context
        this.entity.component(ModelComponent).model = this.model
        return true
      },
      finalize: (task, err) => {
        if (this.task === task) {
          this.task = null
        }
      },
    })
  }

  public deactivate(): void {
    // finalize clears the task
    this.scheduler.cancel(this.task)
  }

  public destroy(): void {
    this.scheduler.cancel(this.task)
  }
}

function isMemberDone(member: ImpostorCellMember) {
  for (const loader of member.loaders) {
    if (loader.state !== 'loaded' && loader.state !== 'failed') {
      return false
    }
  }
  return true
}
