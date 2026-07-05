import { EventChannel, EventType } from './channel'

export function eventSource<T>(name?: EventType<T>, capture?: (type: EventType<any>, arg: any) => void) {
  return new EventSource<T>(name, capture)
}

export class EventSource<T> extends EventChannel<T> {
  public constructor(type?: EventType<T>, capture?: (type: EventType<any>, arg: any) => void) {
    super()
    this.type = type ?? ('EventSource' as any)
    this.capture = capture
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

  public constructor(type?: EventType<T>, options?: { initialValue: T }) {
    super()
    this.type = type ?? ('ValueSource' as any)
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
