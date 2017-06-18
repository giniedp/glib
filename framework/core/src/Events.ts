function triggerEvents(events: EventRegistry[], args: any[]) {
  let e
  for (let i = 0; i < events.length; i += 1) {
    (e = events[i]).callback.apply(e.ctx, args)
  }
}

interface EventRegistry {
  callback: Callback
  context: any
  ctx: any
}

export type Callback = (...args: any[]) => void

/**
 * Implements logic for binding and unbinding methods to and from events.
 * The code is taken from https://github.com/jashkenas/backbone
 */
export class Events {

  private events: { [key: string]: EventRegistry[] } = {}

  /**
   * Bind an event to a `callback` function. Passing `"all"` will bind the callback to all events fired.
   * @param name The name of the event
   * @param callback The function to call when the even fires
   * @param context The value of 'this' inside the callback
   */
  public on(name: string, callback: Callback, context?: any) {
    this.events = this.events || {}
    const events = this.events[name] || []
    this.events[name] = events

    events.push({
      callback: callback,
      context: context,
      ctx: context || this,
    })
    return this
  }

  /**
   * Bind an event to only be triggered a single time. After the first time the callback is invoked, it will be removed.
   * @param name The name of the event
   * @param callback The function to call when the even fires
   * @param context The value of 'this' inside the callback
   */
  public once(name: string, callback: Callback, context?: any) {
    // tslint:disable-next-line
    const once: any = function () {
      if (once.called) { return }
      once.called = true
      once.parent.off(name, once)
      callback.apply(context, arguments)
    }
    once.parent = this
    once._callback = callback
    return this.on(name, once)
  }

  /**
   * Remove one or many callbacks. If `context` is null, removes all
   * callbacks with that function. If `callback` is null, removes all
   * callbacks for the event. If `name` is null, removes all bound
   * callbacks for all events.
   * @param name The name of the event to unbind from
   * @param callback The function to unbind
   * @param [context]
   */
  public off(name?: string, callback?: Callback, context?: any) {
    if (!this.events) {
      return this
    }
    if (!name && !callback && !context) {
      this.events = {}
      return this
    }
    for (name of Object.keys(this.events)) {
      const events = this.events[name] || []
      const retain = events.filter((ev) => {
        return (callback && callback !== ev.callback && callback !== (ev.callback as any)._callback) || (context && context !== ev.context)
      })
      if (retain.length) {
        this.events[name] = retain
      } else {
        delete this.events[name]
      }
    }
    return this
  }

  /**
   * Trigger one or many events, firing all bound callbacks. Callbacks are
   * passed the same arguments as `trigger` is, apart from the event name
   * (unless you're listening on `"all"`, which will cause your callback to
   * receive the true name of the event as the first argument).
   * @method trigger
   * @param name The name of the event to trigger
   * @return {*}
   */
  public trigger(name: string, ...args: any[]) {
    if (!this.events) {
      return this
    }
    const events = this.events[name]
    if (events) {
      triggerEvents(events, args)
    }
    const allEvents = this.events.all
    if (allEvents) {
      triggerEvents(allEvents, args)
    }
    return this
  }
}
