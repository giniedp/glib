import { EventChannel } from './channel'

export function eventSource<T>(name?: string) {
  return new EventSource<T>(name)
}

export class EventSource<T> extends EventChannel<T> {
  public constructor(name?: string) {
    super()
    this.name = name || 'EventSource'
  }

  protected processPending(): void {
    while (this.toRemove.length > 0) {
      const handler = this.toRemove.shift()
      this.handlers.delete(handler)
    }
    while (this.toAdd.length > 0) {
      const handler = this.toAdd.shift()
      this.handlers.add(handler)
    }
  }
}

export function valueSource<T>() {
  return new ValueSource<T>()
}

export class ValueSource<T> extends EventChannel<T> {
  private value: T | undefined
  private hasValue = false

  public constructor(name?: string, options?: { initialValue: T }) {
    super()
    this.name = name ?? 'ValueSource'
    if (options) {
      this.value = options.initialValue
      this.hasValue = true
    } else {
      this.value = undefined
      this.hasValue = false
    }
  }

  protected processPending(): void {
    while (this.toRemove.length > 0) {
      const handler = this.toRemove.shift()
      this.handlers.delete(handler)
    }
    while (this.toAdd.length > 0) {
      const handler = this.toAdd.shift()
      this.handlers.add(handler)
      if (this.hasValue) {
        try {
          handler(this.value!)
        } catch (e) {
          console.error(e)
        }
      }
    }
  }
}
