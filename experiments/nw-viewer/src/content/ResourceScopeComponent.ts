import { type GameComponent, type GameEntity } from '@gglib/ecs'
import { type ResourceScope } from '@gglib/graphics'
import { ContentService } from './ContentService'

/**
 * Provides a resource scope to the entity and its descendants, see {@link ContentService.scopeOf}
 *
 * @remarks
 * The scope is a child of the scope of the nearest ancestor with this component, else of the level scope,
 * see {@link ContentService.scopeOf}.
 * It is created on first access and disposed with {@link unload} or when the component is destroyed.
 */
export class ResourceScopeComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly name: string
  private current: ResourceScope | null = null

  public constructor(name: string) {
    this.name = name
  }

  /**
   * The scope of this entity, created on first access
   */
  public get scope(): ResourceScope {
    if (!this.current || this.current.isDisposed) {
      this.current = this.parentScope().createChild(this.name)
    }
    return this.current
  }

  /**
   * Whether the scope currently exists
   */
  public get isLoaded(): boolean {
    return !!this.current && !this.current.isDisposed
  }

  /**
   * Disposes the scope and frees all resources it owns. The next access creates a new scope.
   */
  public unload(): void {
    this.current?.dispose()
    this.current = null
  }

  public initialize(): void {}
  public activate(): void {}
  public deactivate(): void {}
  public destroy(): void {
    this.unload()
  }

  private parentScope(): ResourceScope {
    const content = this.entity.world.getSystem(ContentService)
    const parent = this.entity.parent
    return parent ? content.scopeOf(parent) : content.device.scope
  }
}
