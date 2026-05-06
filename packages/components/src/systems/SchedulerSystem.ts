import { GameEntity, GameSystem } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'
import { CameraData } from '@gglib/render'
import { AsyncScheduler, PriorityLane, ScheduledTask, SchedulerConfig } from './Scheduler'

export class SchedulerSystem extends GameSystem {
  public instance: AsyncScheduler

  public constructor(config?: Partial<SchedulerConfig>) {
    super()
    config ||= {}
    this.instance = new AsyncScheduler({
      frameBudgetMs: 4,
      maxConcurrent: 10,
      readyBudgetRatio: 1,
      maxReadyTasksPerTick: 10,
      lanes: {
        [PriorityLane.Critical]: {
          budgetRatio: 0.5,
        },
        [PriorityLane.High]: {
          budgetRatio: 0.5,
        },
        [PriorityLane.Medium]: {
          budgetRatio: 0.3,
        },
        [PriorityLane.Low]: {
          budgetRatio: 0.2,
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
    for (const entry of this.instance.pendingEntries) {
      const task = entry.value
      this.updatePriority(task, camera, frame)
    }
  }

  public scheduleAsync<T>(entity: GameEntity, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      let result: T
      this.instance.enqueue({
        lane: PriorityLane.Medium,
        entity: entity,
        load: async () => {
          result = await fn()
        },
        onDone() {
          resolve(result)
        },
        onCancel() {
          reject(new Error('Task cancelled'))
        },
      })
    })
  }

  public schedule<T extends ScheduledTask>(task: T): T {
    this.instance.enqueue(task)
    return task
  }

  private _v1 = Vec3.create()
  private _v2 = Vec3.create()
  private _v3 = Vec3.create()
  public updatePriority(task: ScheduledTask, camera: CameraData, frame: number): void {
    if (!task.entity) {
      return
    }
    const transform = task.entity.getTransform()
    if (!transform) {
      return
    }

    const objPos = transform.world.getTranslation(this._v1)
    const camPos = camera.world.getTranslation(this._v2)
    const toObj = this._v3.initFrom(objPos).subtract(camPos)

    const distSq = Vec3.distanceSquared(objPos, camPos)
    const dist = Math.sqrt(distSq)
    const alignment = toObj.normalize().dot(camera.world.getForward(camPos)) // [-1, 1]

    const visible = false // intersectsFrustum(spatial.position, spatial.boundingRadius, camera.frustumPlanes)

    // --- Scoring ---

    let score = 0

    // Visibility dominates everything
    if (visible) {
      score -= 1000
      // spatial.lastVisibleFrame = frame
    }

    // Distance falloff (quadratic is smoother than linear)
    score += distSq * 0.01

    // Forward bias (prefer what's in front of camera)
    score += (1 - alignment) * 50

    // recently visible gets stickiness
    // if (spatial.lastVisibleFrame !== undefined) {
    //   const framesAgo = frame - spatial.lastVisibleFrame
    //   if (framesAgo < 30) {
    //     score -= 200 * (1 - framesAgo / 30)
    //   }
    // }

    const priority = task.basePriority + score
    const lane = this.classifyLane(visible, dist)
    this.instance.reprioritize(task, priority, lane)
  }

  public classifyLane(visible: boolean, dist: number): PriorityLane {
    if (visible && dist < 32) {
      return PriorityLane.Critical
    }
    if (visible) {
      return PriorityLane.High
    }
    if (dist < 64) {
      return PriorityLane.Medium
    }
    return PriorityLane.Low
  }
}
