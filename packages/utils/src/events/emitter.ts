import { EventChannel } from './channel'
import { eventSource } from './source'
import { EventHandler, UnsubscribeFn } from './types'

export class EventEmitter {
  private channels: Record<string, EventChannel<any>> = {}

  public channel<T = unknown>(name: string): EventChannel<T> {
    this.channels[name] ||= eventSource(name)
    return this.channels[name] as EventChannel<T>
  }

  public on<T>(event: string, handler: EventHandler<T>): UnsubscribeFn {
    return this.channel<T>(event).add(handler)
  }

  public off(event: string, handler: (arg: unknown) => void): void {
    this.channel(event).remove(handler)
  }

  public once<T>(event: string, handler: EventHandler<T>): UnsubscribeFn {
    return this.channel<T>(event).once(handler)
  }

  public emit<T>(event: string, arg: T) {
    this.channels[event]?.emit(arg)
  }
}
