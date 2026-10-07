import { GameEntity, GameSystem } from '@gglib/ecs'
import {
  mat4GetForward,
  mat4GetTranslation,
  vec3,
  vec3$normalize,
  vec3Distance,
  vec3Dot,
  vec3Subtract,
} from '@gglib/math'
import { CameraData } from '@gglib/render'
import { AsyncScheduler, PriorityLane, ScheduledTask, SchedulerConfig } from './Scheduler'

export class SchedulerSystem extends GameSystem {
  public instance: AsyncScheduler

  public constructor(config?: Partial<SchedulerConfig>) {
    super()
    config ||= {}
    this.instance = new AsyncScheduler({
      frameBudgetMs: 4,
      maxConcurrent: 12,
      maxReadyTasksPerTick: 10,
      // Lower lanes start loads only while few loads are in flight, so higher lanes always find a free slot.
      // Browsers allow ~6 connections per host over HTTP/1.1, lower lanes must not occupy all of them.
      lanes: {
        [PriorityLane.Critical]: {
          budgetRatio: 0.5,
        },
        [PriorityLane.High]: {
          budgetRatio: 0.5,
          maxConcurrent: 6,
        },
        [PriorityLane.Medium]: {
          budgetRatio: 0.3,
          maxConcurrent: 4,
        },
        [PriorityLane.Low]: {
          budgetRatio: 0.2,
          maxConcurrent: 3,
        },
      },
      ...config,
    })
  }

  public override initialize(): void {
    //
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
   * Orders a pending task within its lane by distance to the camera, things in front of the camera first.
   * The lane is chosen by the task owner and is not changed here.
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
    const toObj = vec3$normalize(vec3Subtract(objPos, camPos, this._v3))
    const alignment = dist > 0 ? vec3Dot(toObj, mat4GetForward(camera.world, this._v4)) : 1 // [-1, 1]

    // objects behind the camera count up to 3 times as far
    const score = dist * (2 - alignment)
    this.instance.reprioritize(task, score)
  }
}
