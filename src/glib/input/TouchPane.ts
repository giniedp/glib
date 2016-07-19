module Glib.Input {
  import extend = Glib.utils.extend;

  function _touchStartHandler(e:TouchEvent) {
    let list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      let touch = list[i] 
      if (touch.target != this.el) continue 
      this.state[touch.identifier] = copyState(touch, this.el, this.state[touch.identifier] || {})  
    }
    if (this.preventDefault) e.preventDefault()
    this.trigger('changed', this, e);
  }
  function _touchCancelHandler(e:TouchEvent) {
    let list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      let touch = list[i] 
      delete this.state[touch.identifier]  
    }
    if (this.preventDefault) e.preventDefault()
    this.trigger('changed', this, e);
  }
  function _touchMoveHandler(e:TouchEvent) {
    let list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      let touch = list[i] 
      if (touch.target != this.el) continue
      this.state[touch.identifier] = copyState(touch, this.el, this.state[touch.identifier] || {})  
    }
    if (this.preventDefault) e.preventDefault()
    this.trigger('changed', this, e);
  }
  function _touchEndHandler(e:TouchEvent) {
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
    el:any = document
    state = {}
    preventDefault = false
    private _onTouchCancel:(e:TouchEvent) => void;
    private _onTouchStart:(e:TouchEvent) => void;
    private _onTouchMove:(e:TouchEvent) => void;
    private _onTouchEnd:(e:TouchEvent) => void;

    constructor(options:any = {}) {
      super()
      extend(this, options);
      this._onTouchCancel = _touchCancelHandler.bind(this);
      this._onTouchStart = _touchStartHandler.bind(this);
      this._onTouchMove = _touchMoveHandler.bind(this);
      this._onTouchEnd = _touchEndHandler.bind(this);
      this.activate();
    }

    activate() {
      this.el.addEventListener('touchcancel', this._onTouchCancel);
      this.el.addEventListener('touchstart', this._onTouchStart);
      this.el.addEventListener('touchmove', this._onTouchMove);
      this.el.addEventListener('touchend', this._onTouchEnd);
    }

    deactivate() {
      this.el.removeEventListener('touchcancel', this._onTouchCancel);
      this.el.removeEventListener('touchstart', this._onTouchStart);
      this.el.removeEventListener('touchmove', this._onTouchMove);
      this.el.removeEventListener('touchend', this._onTouchEnd);
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
