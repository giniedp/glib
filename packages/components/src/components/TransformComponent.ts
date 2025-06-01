import { EntityState, GameComponent, GameEntity } from '@gglib/ecs'
import { IVec3, IVec4, Mat4, Transform } from '@gglib/math'
import { simpleObservable } from '@gglib/utils'
import { GameTransform } from 'ecs/src/GameTransform'
import { GameLoop } from '../systems/GameLoop'

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
  enityLifeCycle?: boolean

  /**
   * If true, the componetn will install update hooks to the game loop
   */
  autoUpdate?: boolean
}

/**
 * Provides access to the position rotation and scale of an entity
 *
 * @public
 * @remarks
 * Calculates the final world transform matrix once position, rotation or scale properties have changed.
 * Takes the transform of the parent entity into account if the parent also owns a `TransformComponent`
 */
export class TransformComponent extends Transform implements GameComponent, GameTransform {
  /**
   * Default value for {@link TransformComponentOptions.enityLifeCycle}
   */
  public static enityLifeCycle = true

  /**
   * Default value for {@link TransformComponentOptions.keepWorld}
   */
  public static keepWorld = false

  /**
   * Default value for {@link TransformComponentOptions.autoUpdate}
   */
  public static autoUpdate = true

  /**
   * The entity that owns this component instance
   */
  public entity: GameEntity<TransformComponent>

  /**
   * The parent transform component
   */
  public parent: TransformComponent

  /**
   * The child transform components
   *
   * @remarks
   * Manipulating this array directly is not recommended. Use the `add*` methods instead.
   */
  public readonly children: TransformComponent[] = []

  protected loop: GameLoop
  protected autoUpdate: boolean
  protected entityLifeCycle: boolean

  public onUpdated = simpleObservable<void>()

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
    }

    this.keepWorld = options.keepWorld ?? TransformComponent.keepWorld
    this.entityLifeCycle = options.enityLifeCycle ?? TransformComponent.enityLifeCycle
    this.autoUpdate = options.autoUpdate ?? TransformComponent.autoUpdate
    this.needsUpdate = true
  }

  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.entity.transform = this
    this.loop = entity.provider.get(GameLoop)
    this.needsUpdate = true
    if (this.entityLifeCycle) {
      for (const child of this.children) {
        if (child.entity && child.entity.state === EntityState.Created) {
          child.entity.initialize(entity.provider)
        }
      }
    }
  }

  public activate(): void {
    if (this.autoUpdate) {
      this.loop.onUpdate.add(this.updateIfNeeded)
    }
    if (this.entityLifeCycle) {
      for (const child of this.children) {
        if (child.entity.state === EntityState.Initialized) {
          child.entity.activate()
        }
      }
    }
  }

  public deactivate(): void {
    this.loop.onUpdate.remove(this.updateIfNeeded)
    if (this.entityLifeCycle) {
      for (const child of this.children) {
        if (child.entity.state === EntityState.Activated) {
          child.entity.deactivate()
        }
      }
    }
  }

  public destroy(): void {
    if (this.entityLifeCycle) {
      for (const child of this.children) {
        child.entity.destroy()
      }
    }
    this.entity.transform = null
  }

  /**
   * Updates the local and world transforms.
   *
   * @remarks
   * - Ignores the `needsUpdate` flag, but sets it to false after the update.
   * - Emits the `onUpdated` event.
   */
  public updateWorldTransform(): void {
    super.updateWorldTransform()
    this.onUpdated.notify()
  }
}
