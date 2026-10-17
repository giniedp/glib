import { type Ownable, ResourceOwnership } from './ResourceOwnership'

// walking is synchronous and does not call out, one set serves all scopes
const walkVisited = new Set<Ownable>()

function walkResource(resource: Ownable, out: Ownable[]) {
  if (walkVisited.has(resource)) {
    return
  }
  walkVisited.add(resource)
  out.push(resource)
  for (const child of resource.ownership.children) {
    walkResource(child, out)
  }
}

/**
 * Option for device resource creation
 */
export interface ResourceScopeOption {
  /**
   * The scope that should own the created or acquired resource.
   * If omitted, the global scope of the device holds the resource until it is claimed.
   */
  scope?: ResourceScope | null
}

/**
 * Owns resources and releases them all at once when disposed.
 *
 * @remarks
 * - {@link adopt} claims a resource. A resource lives as long as any scope or resource holds it.
 * - {@link adoptUntilClaimed} holds a resource provisionally, until the first other owner claims it.
 *   The global scope of the device holds everything that is created without a scope this way.
 * - A scope only owns the resources given to it. What those resources hold (e.g. the meshes of a model)
 *   is owned by the resources themselves and lives as long as they do, see {@link walk}.
 */
export class ResourceScope implements Disposable {
  private holder = new ResourceOwnership(this)
  private childScopes = new Set<ResourceScope>()
  private parentScope: ResourceScope | null = null
  private disposed = false

  /**
   * Name for debugging purposes
   */
  public readonly name: string

  /**
   * The parent scope, see {@link createChild}. The scope is disposed together with its parent.
   */
  public get parent(): ResourceScope | null {
    return this.parentScope
  }

  /**
   * The child scopes of this scope
   */
  public get children(): Iterable<ResourceScope> {
    return this.childScopes
  }

  /**
   * Whether this scope has been disposed
   */
  public get isDisposed(): boolean {
    return this.disposed
  }

  /**
   * The resources owned by this scope, not including what they hold, see {@link walk}
   */
  public get resources(): Iterable<Ownable> {
    return this.holder.children
  }

  /**
   * Number of resources owned by this scope, not including what they hold
   */
  public get resourceCount(): number {
    return this.holder.children.size
  }

  public constructor(name?: string) {
    this.name = name ?? 'scope'
  }

  /**
   * Claims the given resource. Owning a resource twice has no effect.
   *
   * @remarks
   * A resource that this scope holds provisionally is claimed.
   *
   * @returns the given resource
   */
  public adopt<T extends Ownable>(resource: T): T {
    this.assertNotDisposed()
    return this.holder.adopt(resource)
  }

  /**
   * Holds the given resource provisionally, until another scope or resource claims it.
   *
   * @remarks
   * Has no effect if the resource is already owned.
   *
   * @returns the given resource
   */
  public adoptUntilClaimed<T extends Ownable>(resource: T): T {
    this.assertNotDisposed()
    return this.holder.adoptUntilClaimed(resource)
  }

  /**
   * Releases the given resource.
   *
   * @remarks
   * The resource is finalized if it has no other owner, e.g. another scope or a resource that holds it.
   */
  public drop(resource: Ownable): void {
    this.holder.drop(resource)
  }

  /**
   * Whether this scope owns the given resource directly
   */
  public has(resource: Ownable): boolean {
    return this.holder.children.has(resource)
  }

  /**
   * Collects the owned resources and everything they hold, each resource once, depth first
   *
   * @param out - the array to fill, pass the same array on every call to avoid allocations. It is cleared first.
   * @returns the given or a new array
   */
  public walk(out: Ownable[] = []): Ownable[] {
    out.length = 0
    walkVisited.clear()
    try {
      for (const resource of this.holder.children) {
        walkResource(resource, out)
      }
    } finally {
      walkVisited.clear()
    }
    return out
  }

  /**
   * Creates a child scope that is disposed together with this scope
   */
  public createChild(name?: string): ResourceScope {
    this.assertNotDisposed()
    const scope = new ResourceScope(name)
    scope.parentScope = this
    this.childScopes.add(scope)
    return scope
  }

  /**
   * Disposes all child scopes and releases all owned resources
   */
  public dispose(): void {
    if (this.disposed) {
      return
    }
    for (const child of Array.from(this.childScopes).reverse()) {
      child.dispose()
    }
    this.disposed = true
    this.holder.finalize()
    this.parentScope?.childScopes.delete(this)
  }

  public [Symbol.dispose](): void {
    this.dispose()
  }

  private assertNotDisposed() {
    if (this.disposed) {
      throw new Error(`Scope '${this.name}' is disposed`)
    }
  }
}
