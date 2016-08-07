module Glib.Input {
  import extend = Glib.utils.extend;

  function touchStartHandler(e:TouchEvent) {
    let list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      let touch = list[i] 
      if (touch.target != this.el) continue 
      this.state[touch.identifier] = copyState(touch, this.el, this.state[touch.identifier] || {})  
    }
    if (this.preventDefault) e.preventDefault()
    this.trigger('changed', this, e);
  }
  function touchCancelHandler(e:TouchEvent) {
    let list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      let touch = list[i] 
      delete this.state[touch.identifier]  
    }
    if (this.preventDefault) e.preventDefault()
    this.trigger('changed', this, e);
  }
  function touchMoveHandler(e:TouchEvent) {
    let list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      let touch = list[i] 
      if (touch.target != this.el) continue
      this.state[touch.identifier] = copyState(touch, this.element, this.state[touch.identifier] || {})  
    }
    if (this.preventDefault) e.preventDefault()
    this.trigger('changed', this, e);
  }
  function touchEndHandler(e:TouchEvent) {
    let list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      let touch = list[i] 
      delete this.state[touch.identifier]  
    }
    if (this.preventDefault) e.preventDefault()
    this.trigger('changed', this, e);
  }
  
  function copyState(t: Touch, el: any, out: any): TouchState {
    out.identifier = t.identifier
    out.pageX = t.pageX
    out.pageY = t.pageY
    out.screenX = t.screenX
    out.screenY = t.screenY
    out.clientX = t.clientX
    out.clientY = t.clientY
    out.x = t.clientX;
    out.y = t.clientY;
    if (el.getBoundingClientRect) {
      let rect = el.getBoundingClientRect()
      out.x = t.clientX - rect.left;
      out.y = t.clientY - rect.top;
    }
    return out
  }

  export interface TouchState {
    identifier: number
    pageX:number
    pageY:number
    screenX:number
    screenY:number
    clientX:number
    clientY:number
    x:number
    y:number
  }

  export class TouchPane extends Glib.Events  {
    element:EventTarget = document
    state = {}
    preventDefault = false
    protected onTouchCancel:(e:TouchEvent) => void
    protected onTouchStart:(e:TouchEvent) => void
    protected onTouchMove:(e:TouchEvent) => void
    protected onTouchEnd:(e:TouchEvent) => void

    constructor(options:any = {}) {
      super()
      extend(this, options)
      this.onTouchCancel = touchCancelHandler.bind(this)
      this.onTouchStart = touchStartHandler.bind(this)
      this.onTouchMove = touchMoveHandler.bind(this)
      this.onTouchEnd = touchEndHandler.bind(this)
      this.activate()
    }

    activate() {
      this.deactivate()
      this.element.addEventListener('touchcancel', this.onTouchCancel)
      this.element.addEventListener('touchstart', this.onTouchStart)
      this.element.addEventListener('touchmove', this.onTouchMove)
      this.element.addEventListener('touchend', this.onTouchEnd)
    }

    deactivate() {
      this.element.removeEventListener('touchcancel', this.onTouchCancel)
      this.element.removeEventListener('touchstart', this.onTouchStart)
      this.element.removeEventListener('touchmove', this.onTouchMove)
      this.element.removeEventListener('touchend', this.onTouchEnd)
    }

    getState(id:number, out:any={}):TouchState {
      let state = this.state[id]
      if (!state){
        out.identifier = id
        out.active = false
        return out
      }
      out.identifier = id
      out.active = true
      out.pageX = state.pageX
      out.pageY = state.pageY
      out.screenX = state.screenX
      out.screenY = state.screenY
      out.clientX = state.clientX
      out.clientY = state.clientY
      out.x = state.clientX
      out.y = state.clientY
      return out
    }
  }
}
