/**
 * An object whose lifetime is controlled by its owners
 */
export interface Ownable {
  /**
   * The ownership state of this object
   */
  readonly ownership: ResourceOwnership
}

/**
 * Holds the ownership state of a single resource: who owns it, what it holds (children) and when it ends.
 *
 * @remarks
 * Owners are scopes (see {@link ResourceScope}) and the resources that hold this one.
 *
 * Holding:
 * - {@link adopt} holds a child, whether it was created by the owning resource or passed in.
 *   The child lives as long as anything holds it.
 * - {@link drop} stops holding a child, e.g. when it is replaced.
 * - {@link finalize} ends the resource immediately and drops all of its children.
 *
 * Claims:
 * - {@link adoptUntilClaimed} holds a child provisionally, until the first other owner claims it.
 *   The device uses this for its global scope: everything created without a scope is held there until claimed.
 * - A resource is finalized when the last owner lets go of it, unless a release handler is set,
 *   see {@link setReleaseHandler}.
 */
export class ResourceOwnership {
  private target: object
  private owners = new Set<ResourceOwnership>()
  private provisional: ResourceOwnership | null = null
  // allocated on demand, most resources never hold children or have handlers
  private childSet: Set<Ownable> | null = null
  private finalized = false
  private releaseHandler: (() => void) | null = null
  private onFinalizeHandlers: Array<() => void> | null = null

  /**
   * Name of the resource for debugging purposes
   */
  public get name(): string {
    const name = (this.target as { name?: unknown }).name
    return typeof name === 'string' && name ? name : this.target.constructor?.name || 'resource'
  }

  /**
   * Whether anything owns the resource, including a provisional owner
   */
  public get isOwned(): boolean {
    return this.owners.size > 0 || !!this.provisional
  }

  /**
   * Whether the resource is claimed, i.e. owned by a scope or a resource that holds it, not only provisionally
   */
  public get isClaimed(): boolean {
    return this.owners.size > 0
  }

  /**
   * Whether the resource has been finalized
   */
  public get isFinalized(): boolean {
    return this.finalized
  }

  /**
   * The resources held by this resource
   */
  public get children(): ReadonlySet<Ownable> {
    return this.childSet || NO_CHILDREN
  }

  /**
   * @param target - the object this ownership belongs to, usually the resource itself
   */
  public constructor(target: object) {
    this.target = target
  }

  /**
   * Holds a child, whether it was created by this resource or passed in.
   *
   * @remarks
   * Claims the child: a provisional owner (e.g. the global scope) gives it up.
   * The child lives as long as this or any other owner holds it.
   * Holding a child twice has no effect, a child that is held provisionally is claimed.
   *
   * @returns the given child
   */
  public adopt<T extends Ownable>(child: T): T {
    this.assertCanAdopt(child)
    const children = (this.childSet ||= new Set())
    child.ownership.claim(this)
    children.add(child)
    return child
  }

  /**
   * Holds a child provisionally, until another owner claims it.
   *
   * @remarks
   * Has no effect if the child is already owned.
   *
   * @returns the given child
   */
  public adoptUntilClaimed<T extends Ownable>(child: T): T {
    this.assertCanAdopt(child)
    if (!child.ownership.isOwned) {
      child.ownership.provisional = this
      ;(this.childSet ||= new Set()).add(child)
    }
    return child
  }

  /**
   * Stops holding a child, e.g. when it is replaced.
   *
   * @remarks
   * A child that has no other owner is finalized (or given to its release handler).
   */
  public drop(child: Ownable): void {
    if (this.childSet?.delete(child)) {
      child.ownership.unclaim(this)
    }
  }

  /**
   * Immediately finalizes the resource, regardless of its owners.
   *
   * @remarks
   * Owners stop holding the resource, the {@link onFinalize} handlers are called and all children are dropped.
   * Calling this multiple times has no effect.
   */
  public finalize(): void {
    if (this.finalized) {
      return
    }
    this.finalized = true
    // the owners only update their child sets, the owner set can be iterated in place
    this.provisional?.childSet?.delete(this.target as Ownable)
    this.provisional = null
    for (const owner of this.owners) {
      owner.childSet?.delete(this.target as Ownable)
    }
    this.owners.clear()
    trigger(this.onFinalizeHandlers)
    if (this.childSet) {
      const children = this.childSet
      this.childSet = null
      for (const child of children) {
        child.ownership.unclaim(this)
      }
    }
    this.releaseHandler = null
    this.onFinalizeHandlers = null
  }

  /**
   * Registers a handler to be called when the resource is finalized
   *
   * @returns a function that unregisters the handler
   */
  public onFinalize(handler: () => void): () => void {
    return subscribe((this.onFinalizeHandlers ||= []), handler)
  }

  /**
   * Sets a handler that is called instead of finalizing the resource when its last owner lets go of it.
   *
   * @remarks
   * Used by pools that keep resources alive for reuse. The handler decides when to call {@link finalize}.
   * The handler is called again each time the resource loses its last owner.
   */
  public setReleaseHandler(handler: (() => void) | null): void {
    this.releaseHandler = handler
  }

  private assertCanAdopt(child: Ownable) {
    if (this.finalized) {
      throw new Error(`'${this.name}' is finalized and can not hold '${child.ownership.name}'`)
    }
    if (child.ownership === this) {
      throw new Error(`'${this.name}' can not hold itself`)
    }
    if (child.ownership.finalized) {
      throw new Error(`'${this.name}' can not hold '${child.ownership.name}', it is finalized`)
    }
  }

  private claim(owner: ResourceOwnership) {
    const displaced = this.provisional
    this.provisional = null
    this.owners.add(owner)
    if (displaced && displaced !== owner) {
      displaced.childSet?.delete(this.target as Ownable)
    }
  }

  private unclaim(owner: ResourceOwnership) {
    if (this.finalized) {
      return
    }
    if (this.provisional === owner) {
      this.provisional = null
    } else if (!this.owners.delete(owner)) {
      return
    }
    if (this.isOwned) {
      return
    }
    if (this.releaseHandler) {
      call(this.releaseHandler)
    } else {
      this.finalize()
    }
  }
}

const NO_CHILDREN: ReadonlySet<Ownable> = new Set<Ownable>()

/**
 * Whether the given value is an {@link Ownable}
 */
export function isOwnable(value: unknown): value is Ownable {
  return !!value && (value as Ownable).ownership instanceof ResourceOwnership
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

function trigger(handlers: Array<() => void> | null) {
  if (!handlers?.length) {
    return
  }
  if (handlers.length === 1) {
    call(handlers[0])
    return
  }
  // a handler may unsubscribe while triggered
  for (const handler of handlers.slice()) {
    call(handler)
  }
}

function call(handler: () => void) {
  try {
    handler()
  } catch (e) {
    console.error(e)
  }
}
