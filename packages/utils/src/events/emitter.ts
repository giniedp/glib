import { removeItemUnordered } from '../collections'
import { EventChannel, EventType } from './channel'
import { eventSource } from './source'
import { EventHandler, UnsubscribeFn } from './types'

export class EventEmitter {
  private channels: Record<EventType<any>, EventChannel<any>> = {}
  private captures: Array<(type: EventType<any>, arg: any) => void> = []

  public channel<T = unknown>(name: EventType<T>): EventChannel<T> {
    this.channels[name] ||= eventSource(name, (type, arg) => this.emitCapture(type, arg))
    return this.channels[name] as EventChannel<T>
  }

  public capture(handler: (type: EventType<any>, arg: any) => void): UnsubscribeFn {
    this.captures.push(handler)
    return () => {
      removeItemUnordered(this.captures, handler)
    }
  }

  public on<T>(event: EventType<T>, handler: EventHandler<T>): UnsubscribeFn {
    return this.channel<T>(event).add(handler)
  }

  public off(event: EventType<any>, handler: (arg: any) => void): void {
    this.channel(event).remove(handler)
  }

  public once<T>(event: EventType<T>, handler: EventHandler<T>): UnsubscribeFn {
    return this.channel<T>(event).once(handler)
  }

  public emit<T>(event: EventType<T>, arg: T) {
    this.channel(event).emit(arg)
  }

  private emitCapture<T>(event: EventType<T>, arg: T) {
    for (const handler of this.captures) {
      handler(event, arg)
    }
  }
}
