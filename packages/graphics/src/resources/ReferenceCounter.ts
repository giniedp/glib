export const RefCounterKey = Symbol('ReferenceCounter')

export function getRefCounter(options: any): ReferenceCounter | null {
  return options[RefCounterKey] || null
}

export interface ReferenceCounter {
  /**
   * The current reference count.
   */
  readonly count: number
  /**
   * Increments the reference count by one.
   */
  retain(): void
  /**
   * Decrements the reference count by one.
   */
  release(): void
  /**
   * Immediately finalizes the resource, regardless of the current reference count.
   *
   * @internal
   * @remarks
   * This is an internal utility method. Avoid calling unless you know what you are doing.
   */
  finalize(): void
  /**
   * Registers a handler to be called when the reference count reaches zero.
   */
  onZero(handler: () => void): void
  /**
   * Registers a handler to be called when the reference count transitions from zero to one.
   */
  onRevive(handler: () => void): void
  /**
   * Registers a handler to be called when the resource is finalized.
   */
  onFinalize(handler: () => void): void
}

export function referenceCounter(): ReferenceCounter {
  let count = 0
  const onReviveHandlers: Array<() => void> = []
  const onZeroHandlers: Array<() => void> = []
  const onFinalizeHandlers: Array<() => void> = []
  function trigger(handlers: Array<() => void>) {
    for (const handler of handlers) {
      try {
        handler()
      } catch (e) {
        console.error(e)
      }
    }
  }
  return {
    get count() {
      return count
    },
    retain() {
      count++
      if (count === 1) {
        trigger(onReviveHandlers)
      }
    },
    release() {
      count--
      if (count > 0) {
        return
      }
      if (count === 0) {
        trigger(onZeroHandlers)
      }
      if (count < 0) {
        console.warn('Reference count dropped below zero.')
      }
    },
    finalize() {
      if (this.count > 0) {
        console.warn(`Finalizing a resource with non-zero reference count (${this.count}).`)
      }
      trigger(onFinalizeHandlers)
      onZeroHandlers.length = 0
      onReviveHandlers.length = 0
      onFinalizeHandlers.length = 0
    },
    onRevive(handler: () => void) {
      onReviveHandlers.push(handler)
    },
    onZero(handler: () => void) {
      onZeroHandlers.push(handler)
    },
    onFinalize(handler: () => void) {
      onFinalizeHandlers.push(handler)
    },
  }
}
