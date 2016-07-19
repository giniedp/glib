module Glib {

  var triggerEvents = function (events, args) {
    var e, i;
    for (i = 0; i < events.length; i += 1) {
      (e = events[i]).callback.apply(e.ctx, args);
    }
  };

  export interface EventsInterface {
    on: (name:string, callback:(...args:any[])=>void, context?:any) => void
    off: (name:string, callback:(...args:any[])=>void, context?:any) => void
    once: (name:string, callback:(...args:any[])=>void, context?:any) => void
    trigger: (name:string, ...args:any[]) => void
  }

  /**
   * Implements logic for binding and unbinding methods to and from events.
   * The code is taken from https://github.com/jashkenas/backbone
   * @class Gin.Events
   * @module Core
   */
  export class Events implements EventsInterface {
    
    private _events:any = {};

    /**
     * Bind an event to a `callback` function. Passing `"all"` will bind the callback to all events fired.
     * @param name The name of the event
     * @param callback The function to call when the even fires
     * @param context The value of 'this' inside the callback
     */
    on(name:string, callback:(...args:any[])=>void, context?:any) {
      if (!this._events) {
        this._events = {};
      }
      var events = this._events[name];
      if (!events) {
        events = this._events[name] = [];
      }
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    }

    /**
     * Bind an event to only be triggered a single time. After the first time the callback is invoked, it will be removed.
     * @param name The name of the event
     * @param callback The function to call when the even fires
     * @param context The value of 'this' inside the callback
     */
    once(name:string, callback:(...args:any[])=>void, context?:any) {
      var self = this;
      var once:any = function () {
        if (!this.called) {
          self.off(name, once);
          callback.apply(this, arguments);
          this.called = true;
        }
      };
      once._callback = callback;
      return this.on(name, once, context);
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
    off(name:string, callback:(...args:any[])=>void, context?:any) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events) {
        return this;
      }
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }
      names = name ? [name] : Object.keys(this._events);
      for (i = 0, l = names.length; i < l; i += 1) {
        name = names[i];
        events = this._events[name];
        if (events) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j += 1) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) {
            delete this._events[name];
          }
        }
      }

      return this;
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
    trigger(name:string, ...argsRest:any[]) {
      if (!this._events) {
        return this;
      }
      var args = Array.prototype.slice.call(arguments, 1);
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) {
        triggerEvents(events, args);
      }
      if (allEvents) {
        triggerEvents(allEvents, arguments);
      }
      return this;
    }
  }
}
