import { GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import {
  mat4GetTranslation,
  SpaceBasis,
  vec3,
  vec3$normalize,
  vec3ApplyMat4Rotation,
  vec3Distance,
  vec3Dot,
  vec3Subtract,
} from '@gglib/math'
import { CameraData } from '@gglib/render'
import { AsyncScheduler, PriorityLane, ScheduledTask, SchedulerConfig } from './Scheduler'

export interface SchedulerSystemOptions extends Partial<SchedulerConfig> {
  /**
   * Weight of the view direction in the task priority: the score is `distance * (1 + viewAlignment * (1 - alignment))`
   * with the alignment in [-1, 1]. 1 (default) counts tasks behind the camera up to 3 times as far, 0 orders by
   * distance only.
   */
  viewAlignment?: number
}

export class SchedulerSystem extends GameSystem {
  public instance: AsyncScheduler
  /**
   * See {@link SchedulerSystemOptions.viewAlignment}
   */
  public viewAlignment: number

  private basis: SpaceBasis = SpaceBasis.Y_UP_NEG_Z

  public constructor(options?: SchedulerSystemOptions) {
    super()
    const { viewAlignment, ...config } = options || {}
    this.viewAlignment = viewAlignment ?? 1
    this.instance = new AsyncScheduler({
      frameBudgetMs: 4,
      // Sized for HTTP/2, where the browser multiplexes all requests over one connection.
      // Over HTTP/1.1 (~6 connections per host) the extra loads only queue up in the browser.
      maxConcurrent: 64,
      maxReadyTasksPerTick: 10,
      // Lane limits count only their own lane. Medium + Low stay below the global cap,
      // so Critical and High always find a free slot.
      lanes: {
        [PriorityLane.Critical]: {
          budgetRatio: 0.5,
        },
        [PriorityLane.High]: {
          budgetRatio: 0.5,
          maxConcurrent: 48,
        },
        [PriorityLane.Medium]: {
          budgetRatio: 0.3,
          maxConcurrent: 16,
        },
        [PriorityLane.Low]: {
          budgetRatio: 0.2,
          maxConcurrent: 32,
        },
      },
      ...config,
    })
  }

  public override initialize(world: GameWorld): void {
    this.basis = world.getSystem(SpaceBasis, { optional: true }) ?? this.basis
  }

  public override update(): void {
    this.instance.tick()
  }

  public override destroy(): void {
    this.instance.cancelAll()
  }

  public updatePriorities(camera: CameraData, frame: number) {
    this.instance.releaseCancelled()
    for (const task of this.instance.pendingTasks()) {
      this.updatePriority(task, camera, frame)
    }
  }

  /**
   * Cancels the task, aborts its load if in flight and finalizes it with a {@link TaskCancelledError}
   */
  public cancel(task: ScheduledTask | null | undefined): void {
    if (task) {
      this.instance.cancel(task)
    }
  }

  public scheduleAsync<T>(entity: GameEntity, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.instance.enqueue<T>({
        lane: PriorityLane.Medium,
        entity: entity,
        load: async (task) => {
          task.context = await fn()
        },
        finalize: (task, err) => {
          if (err) {
            reject(err)
          } else {
            resolve(task.context)
          }
        },
      })
    })
  }

  public schedule<T>(task: ScheduledTask<T>): ScheduledTask<T> {
    this.instance.enqueue(task)
    return task
  }

  private _v1 = vec3()
  private _v2 = vec3()
  private _v3 = vec3()
  private _v4 = vec3()
  /**
   * Orders a pending task within its lane by distance to the camera, things in front of the camera first unless
   * {@link viewAlignment} is 0. The lane is chosen by the task owner and is not changed here.
   */
  public updatePriority(task: ScheduledTask, camera: CameraData, frame: number): void {
    if (!task.entity) {
      return
    }
    const transform = task.entity.getTransform()
    if (!transform) {
      return
    }

    const objPos = mat4GetTranslation(transform.world, this._v1)
    const camPos = mat4GetTranslation(camera.world, this._v2)
    const dist = vec3Distance(objPos, camPos)
    if (!this.viewAlignment) {
      this.instance.reprioritize(task, dist)
      return
    }
    const toObj = vec3$normalize(vec3Subtract(objPos, camPos, this._v3))
    const forward = vec3$normalize(vec3ApplyMat4Rotation(this.basis.forward, camera.world, this._v4))
    const alignment = dist > 0 ? vec3Dot(toObj, forward) : 1 // [-1, 1]

    // with a weight of 1, objects behind the camera count up to 3 times as far
    const score = dist * (1 + this.viewAlignment * (1 - alignment))
    this.instance.reprioritize(task, score)
  }
}
