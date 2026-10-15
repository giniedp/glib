/**
 * An owner of resources, e.g. a {@link ResourceScope}
 */
export interface ResourceOwner {
  /**
   * Name for debugging purposes
   */
  readonly name: string
  /**
   * Takes ownership of the given resource
   */
  own<T extends Ownable>(resource: T): T
  /**
   * Releases the ownership of the given resource
   */
  release(resource: Ownable): void
  /**
   * Called by the owner set when this owner loses the resource without releasing it,
   * e.g. when it is displaced as default owner or the resource is finalized.
   *
   * @internal
   */
  detach(resource: Ownable): void
}

/**
 * An object whose lifetime is controlled by its owners
 */
export interface Ownable {
  /**
   * The owners of this object
   */
  readonly owners: ResourceOwnerSet
  /**
   * Resources created (not borrowed) by this object.
   * These are owned and released together with this object.
   */
  ownedChildren?(): Iterable<Ownable>
}

/**
 * Holds the owners of a single resource.
 *
 * @remarks
 * A resource may have an implicit default owner (usually the global scope of the device).
 * The first explicit owner displaces the default owner, i.e. ownership is moved.
 * If the default owner claims the resource explicitly, it stays an owner and later owners are added.
 *
 * The owner set does not destroy anything itself. The creator of the resource subscribes to {@link onEmpty}
 * and decides when to finalize.
 */
export class ResourceOwnerSet implements Iterable<ResourceOwner> {
  private explicit = new Set<ResourceOwner>()
  private implicit: ResourceOwner | null = null
  private finalized = false
  private wasEmptied = false
  private onEmptyHandlers: Array<() => void> = []
  private onReviveHandlers: Array<() => void> = []
  private onFinalizeHandlers: Array<() => void> = []

  /**
   * The resource this set belongs to
   */
  public readonly target: Ownable

  /**
   * The implicit owner. Is `null` once displaced or promoted to an explicit owner.
   */
  public get defaultOwner(): ResourceOwner | null {
    return this.implicit
  }

  /**
   * Number of owners, including the implicit default owner
   */
  public get size(): number {
    return this.explicit.size + (this.implicit ? 1 : 0)
  }

  /**
   * Whether the resource has at least one owner
   */
  public get isOwned(): boolean {
    return this.size > 0
  }

  /**
   * Whether the resource has been finalized
   */
  public get isFinalized(): boolean {
    return this.finalized
  }

  public constructor(target: Ownable, defaultOwner?: ResourceOwner | null) {
    this.target = target
    this.implicit = defaultOwner || null
  }

  /**
   * Whether the given owner owns the resource, explicitly or implicitly
   */
  public has(owner: ResourceOwner): boolean {
    return this.implicit === owner || this.explicit.has(owner)
  }

  /**
   * Whether the given owner owns the resource explicitly
   */
  public isExplicit(owner: ResourceOwner): boolean {
    return this.explicit.has(owner)
  }

  /**
   * Adds an explicit owner.
   *
   * @remarks
   * - If the owner is the default owner, it is promoted to an explicit owner.
   * - If another default owner is set, it is displaced and detached.
   *
   * @returns true if the ownership has changed
   */
  public add(owner: ResourceOwner): boolean {
    if (this.finalized) {
      throw new Error(`Can not add owner '${owner.name}' to a finalized resource`)
    }
    if (this.explicit.has(owner)) {
      return false
    }
    const wasEmpty = this.size === 0
    const displaced = this.implicit
    this.implicit = null
    this.explicit.add(owner)
    if (displaced && displaced !== owner) {
      displaced.detach(this.target)
    }
    if (wasEmpty && this.wasEmptied) {
      trigger(this.onReviveHandlers)
    }
    return true
  }

  /**
   * Sets the implicit default owner of a resource that has no owners.
   *
   * @returns true if the default owner was set
   */
  public setDefault(owner: ResourceOwner): boolean {
    if (this.finalized) {
      throw new Error(`Can not set default owner '${owner.name}' of a finalized resource`)
    }
    if (this.size > 0) {
      return false
    }
    this.implicit = owner
    if (this.wasEmptied) {
      trigger(this.onReviveHandlers)
    }
    return true
  }

  /**
   * Removes an owner, explicit or implicit. Triggers {@link onEmpty} when the last owner is removed.
   *
   * @returns true if the owner was removed
   */
  public delete(owner: ResourceOwner): boolean {
    if (this.finalized) {
      return false
    }
    if (this.implicit === owner) {
      this.implicit = null
    } else if (!this.explicit.delete(owner)) {
      return false
    }
    owner.detach(this.target)
    if (this.size === 0) {
      this.wasEmptied = true
      trigger(this.onEmptyHandlers)
    }
    return true
  }

  /**
   * Immediately finalizes the resource. All owners are detached.
   *
   * @remarks
   * Does not trigger {@link onEmpty}. Calling this multiple times has no effect.
   */
  public finalize(): void {
    if (this.finalized) {
      return
    }
    this.finalized = true
    const owners = Array.from(this)
    this.implicit = null
    this.explicit.clear()
    for (const owner of owners) {
      owner.detach(this.target)
    }
    trigger(this.onFinalizeHandlers)
    this.onEmptyHandlers.length = 0
    this.onReviveHandlers.length = 0
    this.onFinalizeHandlers.length = 0
  }

  /**
   * Registers a handler to be called when the last owner is removed
   *
   * @returns a function that unregisters the handler
   */
  public onEmpty(handler: () => void): () => void {
    return subscribe(this.onEmptyHandlers, handler)
  }

  /**
   * Registers a handler to be called when an owner is added after the resource had no owners
   *
   * @returns a function that unregisters the handler
   */
  public onRevive(handler: () => void): () => void {
    return subscribe(this.onReviveHandlers, handler)
  }

  /**
   * Registers a handler to be called when the resource is finalized
   *
   * @returns a function that unregisters the handler
   */
  public onFinalize(handler: () => void): () => void {
    return subscribe(this.onFinalizeHandlers, handler)
  }

  public *[Symbol.iterator](): IterableIterator<ResourceOwner> {
    if (this.implicit) {
      yield this.implicit
    }
    yield* this.explicit
  }
}

function subscribe(handlers: Array<() => void>, handler: () => void) {
  handlers.push(handler)
  return () => {
    const index = handlers.indexOf(handler)
    if (index >= 0) {
      handlers.splice(index, 1)
    }
  }
}

function trigger(handlers: Array<() => void>) {
  for (const handler of [...handlers]) {
    try {
      handler()
    } catch (e) {
      console.error(e)
    }
  }
}
