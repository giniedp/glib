import type { Ownable, ResourceOwner } from './ResourceOwnerSet'

/**
 * Option for device resource creation
 */
export interface ResourceScopeOption {
  /**
   * The scope that should own the created or acquired resource.
   * If omitted, the resource is owned by the global scope of the device.
   */
  scope?: ResourceScope | null
}

/**
 * Owns resources and releases them all at once when disposed.
 *
 * @remarks
 * Resources are created on the device and are implicitly owned by the global scope of the device.
 * Calling {@link own} on any other scope moves the ownership to that scope.
 * When multiple scopes own the same resource, it lives until all of them released it.
 *
 * Owning an object also owns its {@link Ownable.ownedChildren} recursively.
 */
export class ResourceScope implements ResourceOwner, Disposable {
  /**
   * Number of paths (direct own calls and owned parents) by which this scope owns a resource.
   * A count of 0 marks an implicitly owned (adopted) resource.
   */
  private resources = new Map<Ownable, number>()
  private children = new Set<ResourceScope>()
  private disposed = false

  /**
   * Name for debugging purposes
   */
  public readonly name: string

  /**
   * The parent scope. The scope is disposed together with its parent.
   */
  public readonly parent: ResourceScope | null

  /**
   * Whether this scope has been disposed
   */
  public get isDisposed(): boolean {
    return this.disposed
  }

  /**
   * Number of resources owned by this scope
   */
  public get count(): number {
    return this.resources.size
  }

  public constructor(name?: string, parent?: ResourceScope | null) {
    this.name = name ?? 'scope'
    this.parent = parent || null
  }

  /**
   * Takes ownership of the given resource and its owned children.
   *
   * @returns the given resource
   */
  public own<T extends Ownable>(resource: T): T {
    this.assertNotDisposed()
    if (!resource.owners.isExplicit(this)) {
      resource.owners.add(this)
    }
    const count = this.resources.get(resource) ?? 0
    this.resources.set(resource, count + 1)
    const children = resource.ownedChildren?.()
    if (children) {
      for (const child of children) {
        this.own(child)
      }
    }
    return resource
  }

  /**
   * Releases the ownership of the given resource and its owned children.
   *
   * @remarks
   * Resources that are owned by this scope by other means (owned directly or through another parent) are kept.
   */
  public release(resource: Ownable): void {
    const count = this.resources.get(resource)
    if (count == null) {
      return
    }
    if (count === 0) {
      // implicitly owned, children were adopted on their own
      this.resources.delete(resource)
      resource.owners.delete(this)
      return
    }
    // capture children first, losing the last owner may dispose the resource and clear its children
    const children = resource.ownedChildren ? Array.from(resource.ownedChildren()) : null
    if (count === 1) {
      this.resources.delete(resource)
      resource.owners.delete(this)
    } else {
      this.resources.set(resource, count - 1)
    }
    if (children) {
      for (const child of children) {
        this.release(child)
      }
    }
  }

  /**
   * Whether this scope owns the given resource
   */
  public has(resource: Ownable): boolean {
    return this.resources.has(resource)
  }

  /**
   * Tracks a resource that has this scope as its implicit default owner.
   *
   * @internal
   * @remarks
   * Used by the device for freshly created resources. Does not affect owned children.
   */
  public adopt<T extends Ownable>(resource: T): T {
    this.assertNotDisposed()
    if (resource.owners.defaultOwner !== this) {
      throw new Error(`Scope '${this.name}' is not the default owner of the resource`)
    }
    if (!this.resources.has(resource)) {
      this.resources.set(resource, 0)
    }
    return resource
  }

  /**
   * Creates a child scope that is disposed together with this scope
   */
  public createScope(name?: string): ResourceScope {
    this.assertNotDisposed()
    const scope = new ResourceScope(name, this)
    this.children.add(scope)
    return scope
  }

  /**
   * Disposes all child scopes and releases all owned resources
   */
  public dispose(): void {
    if (this.disposed) {
      return
    }
    for (const child of Array.from(this.children).reverse()) {
      child.dispose()
    }
    // children of owned resources are tracked as entries themselves, so no recursion needed
    const resources = Array.from(this.resources.keys()).reverse()
    for (const resource of resources) {
      if (this.resources.delete(resource)) {
        resource.owners.delete(this)
      }
    }
    this.disposed = true
    this.parent?.children.delete(this)
  }

  public [Symbol.dispose](): void {
    this.dispose()
  }

  public [Symbol.iterator](): IterableIterator<Ownable> {
    return this.resources.keys()
  }

  /**
   * @internal
   */
  public detach(resource: Ownable): void {
    this.resources.delete(resource)
  }

  private assertNotDisposed() {
    if (this.disposed) {
      throw new Error(`Scope '${this.name}' is disposed`)
    }
  }
}
