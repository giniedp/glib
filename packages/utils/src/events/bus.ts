import { EventChannel, EventType } from './channel'
import { EventEmitter } from './emitter'
import { eventSource } from './source'
import { EventHandler, UnsubscribeFn } from './types'

export class EventBus {
  private channels: Record<EventType<any>, EventChannel<any>> = {}
  private registry = new Map<EventEmitter, UnsubscribeFn>()

  private channel<T = unknown>(name: EventType<T>): EventChannel<T> {
    this.channels[name] ||= eventSource(name)
    return this.channels[name] as EventChannel<T>
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

  private emit<T>(event: EventType<T>, arg: T) {
    this.channels[event]?.emit(arg)
  }

  public register(emitter: EventEmitter): UnsubscribeFn {
    if (this.registry.has(emitter)) {
      throw new Error('Emitter is already registered')
    }
    const uncapture = emitter.capture((type, arg) => {
      this.emit(type, arg)
    })
    const unregister = () => {
      uncapture()
      this.registry.delete(emitter)
    }
    this.registry.set(emitter, unregister)
    return unregister
  }

  public unregister(emitter: EventEmitter): void {
    const unregister = this.registry.get(emitter)
    if (!unregister) {
      throw new Error('Emitter is not registered')
    }
    unregister()
  }
}
