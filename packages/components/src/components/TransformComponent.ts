import {
  ActivatableComponent,
  GameEntity,
  GameEntityState,
  InitializableComponent,
  type GameComponent,
  type GameTransform,
} from '@gglib/ecs'
import { Transform, type IVec3, type IVec4, type Mat4 } from '@gglib/math'

/**
 * Constructor options for {@link TransformComponent}
 *
 * @public
 */
export interface TransformComponentOptions {
  /**
   * The initial scale value in local space
   */
  scale?: IVec3

  /**
   * The initial position value in local space
   */
  position?: IVec3

  /**
   * The initial rotation value in local space
   */
  rotation?: IVec4

  /**
   * The initial local transform.
   *
   * @remarks
   * If set, the `position`, `rotation` and `scale` properties are ignored.
   */
  local?: Mat4

  /**
   * The initial world transform. Useful along with `keepWorld` to keep the world transform
   * when assigning a new parent.
   */
  world?: Mat4

  /**
   * Indicates that the world transform should be kept when the transform is set to a new parent
   */
  keepWorld?: boolean

  /**
   * If true, the transform will propagate the entity life cycle calls (initialize, activate etc.) to child entities
   */
  lifeCycle?: LifeCycleFlags
}

export type LifeCycleFlags = number
export const LifeCycleReceive = 1 << 0
export const LifeCyclePropagate = 1 << 1
export const LifeCycleFlags = {
  None: 0,
  Receive: LifeCycleReceive,
  Propagate: LifeCyclePropagate,
  Full: LifeCycleReceive | LifeCyclePropagate,
}

/**
 * Provides access to the position rotation and scale of an entity
 *
 * @public
 * @remarks
 * Calculates the final world transform matrix once position, rotation or scale properties have changed.
 * Takes the transform of the parent entity into account if the parent also owns a `TransformComponent`
 */
export class TransformComponent
  extends Transform
  implements GameTransform, GameComponent, InitializableComponent, ActivatableComponent
{
  /**
   * Default value for {@link TransformComponentOptions.lifeCycle}
   */
  public static lifeCycle: LifeCycleFlags = LifeCycleFlags.Full

  /**
   * Default value for {@link TransformComponentOptions.keepWorld}
   */
  public static keepWorld = false

  /**
   * The entity that owns this component instance
   */
  public readonly entity: GameEntity

  protected lifeCycle: LifeCycleFlags

  constructor(options: TransformComponentOptions = {}) {
    super()
    if (options.scale) {
      this.scale.initFrom(options.scale)
    }
    if (options.position) {
      this.translation.initFrom(options.position)
    }
    if (options.rotation) {
      this.rotation.initFrom(options.rotation)
    }
    if (options.local) {
      this.matrix.initFrom(options.local)
      this.matrix.decompose(this.scale, this.rotation, this.translation)
    }
    if (options.world) {
      this.world.initFrom(options.world)
      if (!options.local && !options.scale && !options.position && !options.rotation) {
        this.world.decompose(this.scale, this.rotation, this.translation)
      }
    }

    this.keepWorld = options.keepWorld ?? TransformComponent.keepWorld
    this.lifeCycle = options.lifeCycle ?? TransformComponent.lifeCycle
  }

  public initialize(): void {
    this.name ||= `${this.entity.name} Transform`
    if (!(this.lifeCycle & LifeCycleFlags.Propagate)) {
      return
    }
    for (const child of this.children) {
      if (!(child.lifeCycle & LifeCycleFlags.Receive)) {
        continue
      }
      if (child.entity?.canInitialize) {
        child.entity.initialize()
      }
    }
  }

  public activate(): void {
    if (!(this.lifeCycle & LifeCycleFlags.Propagate)) {
      return
    }
    for (const child of this.children) {
      if (!(child.lifeCycle & LifeCycleFlags.Receive)) {
        continue
      }
      if (child.entity?.canInitialize) {
        child.entity.initialize()
      }
      if (child.entity?.canActivate) {
        child.entity.activate()
      }
    }
  }

  public deactivate(): void {
    if (!(this.lifeCycle & LifeCycleFlags.Propagate)) {
      return
    }
    for (const child of this.children) {
      if (!(child.lifeCycle & LifeCycleFlags.Receive)) {
        continue
      }
      if (child.entity?.canDeactivate) {
        child.entity.deactivate()
      }
    }
  }

  public destroy(): void {
    if (!(this.lifeCycle & LifeCycleFlags.Propagate)) {
      return
    }
    for (const child of this.children) {
      if (!(child.lifeCycle & LifeCycleFlags.Receive)) {
        continue
      }
      child.entity.destroy()
    }
  }

  protected override handleParentChange(parent: this, oldParent: this): void {
    if (!(this.lifeCycle & LifeCycleFlags.Receive)) {
      return
    }
    if (!this.entity) {
      // not initialized, no state to sync
      return
    }
    if (!parent) {
      // Detaching from parent, keep current state
      return
    }
    if (!parent.entity) {
      // The new parent doesn't have an entity, so it's not initialized yet
      return
    }

    switch (parent.entity.state) {
      case GameEntityState.Created: {
        // No need to do anything, the entity will be initialized and activated by the parent when it's ready
        break
      }
      case GameEntityState.Initialized: {
        // The parent is initialized but not activated,
        // initialize the entity but don't activate it
        // or deactivate it if it was already active to bring it to the correct state
        if (this.entity.canInitialize) {
          this.entity.initialize()
        }
        if (this.entity.canDeactivate) {
          this.entity.deactivate()
        }
        break
      }
      case GameEntityState.Activated: {
        // The parent is active, activate the entity as well
        if (this.entity.canInitialize) {
          this.entity.initialize()
        }
        if (this.entity.canActivate) {
          this.entity.activate()
        }
        break
      }
      case GameEntityState.Destroyed: {
        // The parent is destroyed
        throw new Error('Cannot set parent to an entity that is already destroyed')
      }
    }
  }
}
