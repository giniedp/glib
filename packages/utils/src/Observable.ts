import { removeFromArray, removeFromArrayUnstable } from "./utils"

/**
 * A simple implementation of an event emitter that
 *
 * @remarks
 * This allows to
 * - add an observer function
 * - add on observer function that will be called only once
 * - remove an already added observer function
 * - notify all observers with a value
 *
 * There is nothing more to it.
 */
export class SimpleObservable<T> {
  private observers: Array<(arg: T) => void> = []
  private lastValue: T | undefined
  private hasValue = false
  private notifyOnAdd = false

  public constructor(options: { notifyOnAdd?: boolean } = {}) {
    this.notifyOnAdd = options.notifyOnAdd || false
  }

  public add(observer: (arg: T) => void): () => void {
    if (this.observers.indexOf(observer) === -1) {
      this.observers.push(observer)
      if (this.notifyOnAdd && this.hasValue) {
        try {
          observer(this.lastValue!)
        } catch (e) {
          console.error("Error in observer", e)
        }
      }
    }
    return () => this.remove(observer)
  }

  public once(observer: (arg: T) => void): () => void {
    const wrappedObserver = (arg: T) => {
      this.remove(wrappedObserver)
      observer(arg)
    }
    return this.add(wrappedObserver)
  }

  public remove(observer: (arg: T) => void): boolean {
    return removeFromArray(this.observers, observer)
  }

  public notify(arg: T) {
    this.hasValue = true
    this.lastValue = arg
    for (const observer of this.observers) {
      try {
        observer(arg)
      } catch (e) {
        console.error("Error in observer", e)
      }
    }
  }

  public dispose() {
    this.observers = []
    this.hasValue = false
    this.lastValue = undefined
  }
}

export function simpleObservable<T>() {
  return new SimpleObservable<T>()
}

export class EventEmitter {
  public static removeFromArray = removeFromArrayUnstable
  private listeners: Record<string, Array<(arg: any) => void>> = {}

  public on<T>(event: string, listener: (arg: T) => void): () => void {
    this.listeners[event] ||= []
    if (this.listeners[event].includes(listener)) {
      return () => this.off(event, listener)
    }
    this.listeners[event].push(listener)
    return () => this.off(event, listener)
  }

  public off(event: string, listener: (arg: any) => void): boolean {
    if (!this.listeners[event]) {
      return false
    }
    return EventEmitter.removeFromArray(this.listeners[event], listener)
  }

  public once<T>(event: string, listener: (arg: T) => void): () => void {
    const wrappedListener = (arg: any) => {
      this.off(event, wrappedListener)
      listener(arg)
    }
    return this.on(event, wrappedListener)
  }

  public notify<T>(event: string, arg: T) {
    if (!this.listeners[event]) {
      return
    }
    for (const listener of this.listeners[event]) {
      try {
        listener(arg)
      } catch (e) {
        console.error("Error in listener", e)
      }
    }
  }
}
