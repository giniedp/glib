import {
  BoundsComponent,
  EcsGame,
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
import { boxMat4DistanceSquared, mat4CreateTranslation, vec3AddScalars, type IVec3 } from '@gglib/math'
import type { Model } from '@gglib/model'
import {
  IMPOSTOR_FADE_RANGE,
  LOD_SPANS,
  lodSpanStart,
  lodSpanVisibleEnd,
  POI_IMPOSTOR_FADE_LENGTH,
  type LodSpan,
} from '../../constants'
import { ContentService } from '../../content'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import type { MeshLoaderComponent } from '../slice/MeshLoaderComponent'
import type { SliceSpawnerComponent } from '../slice/SliceSpawnerComponent'

export interface ImpostorComponentOptions {
  name: string
  regionSize: number
  cellSize: number
  origin: IVec3
  model: string
  /**
   * Distance span in which the impostor is visible
   */
  span: LodSpan
}

export function impostorEntityOptions(parent: GameEntity, options: ImpostorComponentOptions): CreateEntityOptions {
  const isPoi = options.span === LOD_SPANS.impostorPoi
  const impostor = new RegionImpostorComponent(options)
  const debug = new DebugShapeComponent({
    type: 'bounds-box',
    layer: isPoi ? DebugLayer.Impostor_POI : DebugLayer.Impostor,
    color: isPoi ? Color.Orange : Color.Lime,
  })
  const cameraWorld = () => debug.entity.world.getSystem(EcsGame).scene.getView(0).camera.world
  debug
    .addInfo('kind', () => (isPoi ? 'poi' : 'vegetation'))
    .addInfo('model', () => options.model)
    .addInfo('show at', () => lodSpanStart(options.span))
    .addInfo('hide at', () => lodSpanVisibleEnd(options.span))
    .addInfo('fade', () =>
      isPoi
        ? `in ${lodSpanStart(options.span)} -> ${lodSpanStart(options.span) + POI_IMPOSTOR_FADE_LENGTH}`
        : `in ${lodSpanStart(options.span) - IMPOSTOR_FADE_RANGE} -> ${lodSpanStart(options.span)}`,
    )
    .addInfo('box distance', () =>
      Math.sqrt(boxMat4DistanceSquared(impostor.min, impostor.max, cameraWorld())).toFixed(1),
    )
    .addInfo('state', () => debug.entity.stateName)
  if (isPoi) {
    debug
      .addInfo('cell state', () => impostor.cellState)
      .addInfo('cell chunks', () => impostor.chunks.length)
      .addInfo('cell members', () => impostor.members.length)
      .addInfo('cell pending', () => impostor.pending)
  }
  return {
    parent: parent,
    name: options.name,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateTranslation(options.origin),
      lifeCycle: LifeCycleFlags.Propagate, // is controlled by RegionSystem
    }),
    components: [debug, new SpatialNodeComponent(), new BoundsComponent(), new ModelComponent(), impostor],
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
  public readonly span: LodSpan
  private modelUrl: string
  private task: ScheduledTask
  private model: Model

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
    if (this.cellState === state) {
      return
    }
    this.cellState = state
    const shape = this.entity.component(DebugShapeComponent).entries[0]
    const color = state === 'loading' ? Color.Red : state === 'ready' ? Color.DeepSkyBlue : Color.Orange
    shape.color.x = color.x
    shape.color.y = color.y
    shape.color.z = color.z
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
  public get pending() {
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
    return spawned && this.pending === 0
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
    // impostor origin is the cell center
    this.span = data.span
    const half = data.cellSize * 0.5
    this.min = vec3AddScalars(data.origin, -half, -half, 0)
    this.max = vec3AddScalars(data.origin, half, half, data.regionSize)
    this.modelUrl = data.model
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)
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
