export const SymbolObservable = (typeof Symbol === 'function' && (Symbol as any).observable) || '@@observable'

export type RxJsObserver<T> = {
  next: (value: T) => void
  error: (err: any) => void
  complete: () => void
}

export interface RxJsSubscribable<T> {
  subscribe(observer: Partial<RxJsObserver<T>>): RxJsUnsubscribable
}

export interface RxJsUnsubscribable {
  unsubscribe(): void
}

export function toObservableLike<T>(source: RxJsSubscribable<T>) {
  return {
    subscribe: source.subscribe.bind(source),

    [SymbolObservable]() {
      return this
    },
  }
}
