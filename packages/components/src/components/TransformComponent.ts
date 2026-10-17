import {
  ActivatableComponent,
  GameEntity,
  GameEntityState,
  InitializableComponent,
  type GameComponent,
  type GameTransform,
} from '@gglib/ecs'
import {
  Mat4,
  mat4$initFrom,
  mat4$initFromRTS,
  mat4Decompose,
  mat4Premultiply,
  Transform,
  vec3$initFrom,
  vec4$initFrom,
  type IVec3,
  type IVec4,
} from '@gglib/math'
import { brand, EventType } from '@gglib/utils'

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
   * Controls whether entity life cycle calls (initialize, activate etc.) are received from the parent
   * and propagated to child entities. See {@link LifeCycleFlags}.
   */
  lifeCycle?: LifeCycleFlags
}

/**
 * Bit flags controlling how entity life cycle calls (initialize, activate, deactivate)
 * travel along the transform hierarchy. See {@link LifeCycleFlags}.
 *
 * @remarks
 * Destruction is not controlled by the flags, destroying an entity always destroys its children.
 *
 * @public
 */
export type LifeCycleFlags = number
/**
 * Accept life cycle calls from the parent.
 *
 * @public
 * @remarks
 * The entity is initialized, activated and deactivated along with its parent.
 * On re-parenting, the entity state is synced to the state of the new parent.
 */
export const LifeCycleInherit = 1 as const
/**
 * Forward life cycle calls to child entities that have the {@link LifeCycleInherit} flag set.
 *
 * @public
 */
export const LifeCyclePropagate = 2 as const
/**
 * Values for {@link TransformComponentOptions.lifeCycle}
 *
 * @public
 */
export const LifeCycleFlags = {
  /**
   * Life cycle is fully decoupled from the hierarchy. Entity state is managed manually.
   */
  None: 0,
  /**
   * Accept life cycle calls from the parent.
   *
   * @remarks
   * The entity is initialized, activated and deactivated along with its parent.
   * On re-parenting, the entity state is synced to the state of the new parent.
   */
  InheritOnly: LifeCycleInherit,
  /**
   * Forward life cycle calls to child entities that have the {@link LifeCycleFlags.InheritOnly} flag set.
   */
  PropagateOnly: LifeCyclePropagate,
  /**
   * Accept life cycle calls from the parent and passes down to children
   */
  InheritAndPropagate: LifeCycleInherit | LifeCyclePropagate,
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
  public static onUpdated = brand<EventType<TransformComponent>>(Symbol('TransformComponent.onUpdated'))
  /**
   * Default value for {@link TransformComponentOptions.lifeCycle}
   */
  public static lifeCycle: LifeCycleFlags = LifeCycleFlags.InheritAndPropagate

  /**
   * Default value for {@link TransformComponentOptions.keepWorld}
   */
  public static keepWorld = false

  /**
   * The entity that owns this component instance
   */
  public readonly entity: GameEntity

  /**
   * Life cycle flags of this transform. See {@link LifeCycleFlags}.
   */
  public lifeCycle: LifeCycleFlags

  constructor(options: TransformComponentOptions = {}) {
    super()
    if (options.scale) {
      vec3$initFrom(this.scale, options.scale)
    }
    if (options.position) {
      vec3$initFrom(this.translation, options.position)
    }
    if (options.rotation) {
      vec4$initFrom(this.rotation, options.rotation)
    }
    if (options.local) {
      mat4$initFrom(this.matrix, options.local)
      mat4Decompose(this.matrix, this.scale, this.rotation, this.translation)
    } else {
      mat4$initFromRTS(this.matrix, this.rotation, this.translation, this.scale)
    }
    if (options.world) {
      mat4$initFrom(this.world, options.world)
      if (!options.local && !options.scale && !options.position && !options.rotation) {
        mat4Decompose(this.world, this.scale, this.rotation, this.translation)
      }
    } else {
      if (this.parent) {
        mat4Premultiply(this.matrix, this.parent.world, this.world)
      } else {
        mat4$initFrom(this.world, this.matrix)
      }
    }

    this.keepWorld = options.keepWorld ?? TransformComponent.keepWorld
    this.lifeCycle = options.lifeCycle ?? TransformComponent.lifeCycle
  }

  public initialize(): void {
    this.name ||= `${this.entity.name} Transform`
    if (!(this.lifeCycle & LifeCyclePropagate)) {
      return
    }
    for (const child of this.children) {
      if (!(child.lifeCycle & LifeCycleFlags.InheritOnly)) {
        continue
      }
      if (child.entity?.canInitialize) {
        child.entity.initialize()
      }
    }
  }

  public activate(): void {
    if (!(this.lifeCycle & LifeCyclePropagate)) {
      return
    }
    for (const child of this.children) {
      if (!(child.lifeCycle & LifeCycleInherit)) {
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
    if (!(this.lifeCycle & LifeCyclePropagate)) {
      return
    }
    for (const child of this.children) {
      if (!(child.lifeCycle & LifeCycleInherit)) {
        continue
      }
      if (child.entity?.canDeactivate) {
        child.entity.deactivate()
      }
    }
  }

  /**
   * Destroys all child entities, regardless of their life cycle flags
   *
   * @remarks
   * The flags only control initialization, activation and deactivation. A child never outlives its parent.
   */
  public destroy(): void {
    for (const child of Array.from(this.children)) {
      if (child.entity && !child.entity.isDestroyed) {
        child.entity.destroy()
      }
    }
  }

  protected override handleParentChange(parent: this, oldParent: this): void {
    if (!(this.lifeCycle & LifeCycleInherit)) {
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

  public override handleWorldUpdated(): void {
    super.handleWorldUpdated()
    this.entity.events.emit(TransformComponent.onUpdated, this)
  }
}
