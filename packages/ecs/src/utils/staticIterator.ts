interface IteratorOptions<TState, TValue> {
  state: () => TState
  start: (state: TState) => void
  next: (state?: TState) => TValue | typeof DONE
}

export const DONE = Symbol('DONE')

export function createStaticIterator<TState, TValue>(options: IteratorOptions<TState, TValue>) {
  const state = options.state()
  const yieldResult = { done: false as const, value: undefined as unknown as TValue }
  const doneResult = { done: true as const, value: undefined }

  let iterating = false
  const iterator: Iterator<TValue> = {
    next(): IteratorResult<TValue> {
      try {
        const value = options.next(state)
        if (value === DONE) {
          iterating = false
          return doneResult
        }
        yieldResult.value = value
        return yieldResult
      } catch (e) {
        iterating = false
        throw e
      }
    },
    return(): IteratorReturnResult<undefined> {
      iterating = false
      return doneResult
    },
    throw(e: unknown): never {
      iterating = false
      throw e
    },
  }

  return () => {
    if (iterating) {
      throw new Error('Does not support nested iteration')
    }
    iterating = true
    options.start(state)
    return iterator
  }
}
