module Glib.Input {
  import extend = Glib.utils.extend;

  function updateTouches(e:TouchEvent, state:any) {
    state.targetTouches = e.targetTouches;
    state.touches = e.touches;
  }

  export class TouchPane {
    el:any = document;
    state: {
      targetTouches:TouchList,
      touches:TouchList
    };
    _onTouchCancel:(e:TouchEvent) => void;
    _onTouchStart:(e:TouchEvent) => void;
    _onTouchMove:(e:TouchEvent) => void;
    _onTouchEnd:(e:TouchEvent) => void;

    constructor(options:any = {}) {
      extend(this, options);
      this._onTouchCancel = (e:TouchEvent) => updateTouches(e, this.state);
      this._onTouchStart = (e:TouchEvent) => updateTouches(e, this.state);
      this._onTouchMove = (e:TouchEvent) => updateTouches(e, this.state);
      this._onTouchEnd = (e:TouchEvent) => updateTouches(e, this.state);
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

    getState(out:any={}):any{
      out.targetTouches = this.state.targetTouches;
      out.touches = this.state.touches;
      return out;
    }
  }
}