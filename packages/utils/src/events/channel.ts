import { Brand, RxJsObserver, RxJsSubscribable, SymbolObservable } from '../types'
import { EventHandler } from './types'

export type EventType<T> = Brand<string | symbol | number, T>

export abstract class EventChannel<T> implements RxJsSubscribable<T> {
  protected type: EventType<T>
  protected handlers = new Set<EventHandler<T>>()
  protected toRemove: Array<EventHandler<T>> = []
  protected toAdd: Array<EventHandler<T>> = []
  protected notifyDepth = 0
  protected capture?: (type: EventType<any>, arg: any) => void

  public add(handler: EventHandler<T>): () => void {
    this.toAdd.push(handler)
    if (this.notifyDepth === 0) {
      this.processPending()
    }
    return () => this.remove(handler)
  }

  public once(handler: EventHandler<T>): () => void {
    const wrapper = (arg: T) => {
      this.remove(wrapper)
      handler(arg)
    }
    return this.add(wrapper)
  }

  public remove(handler: EventHandler<T>): void {
    this.toRemove.push(handler)
    if (this.notifyDepth === 0) {
      this.processPending()
    }
  }

  public emit(arg: T): boolean {
    if (this.notifyDepth > 0) {
      console.warn(`[${typeName(this.type)}] Nested notify calls detected.`, new Error().stack)
      return false
    }
    this.notifyDepth++
    for (const observer of this.handlers) {
      try {
        observer(arg)
      } catch (e) {
        console.error(e)
      }
    }
    try {
      this.capture?.(this.type, arg)
    } catch (e) {
      console.error(e)
    }
    this.notifyDepth--
    if (this.notifyDepth === 0) {
      this.processPending()
    }
    return true
  }

  public clear() {
    if (this.notifyDepth) {
      console.warn(`[${typeName(this.type)}] clear was called during notify.`, new Error().stack)
    }
    this.handlers.clear()
  }

  protected abstract processPending(): void

  public subscribe(observer: Partial<RxJsObserver<T>>) {
    return {
      unsubscribe: this.add((value) => {
        observer.next?.(value)
      }),
    }
  }

  [SymbolObservable](): RxJsSubscribable<T> {
    return this
  }
}

function typeName(type: EventType<any>) {
  if (typeof type === 'string') {
    return type
  } else if (typeof type === 'symbol') {
    return type.toString()
  } else {
    return String(type)
  }
}
