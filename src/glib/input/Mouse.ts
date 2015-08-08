module Glib.Input {

  import extend = Glib.utils.extend;

  export interface MouseState {
    x:number;
    y:number;
    wheel:number;
    buttons:boolean[];
  }

  function updatePosition(e:MouseEvent) {
    this.state.x = e.clientX;
    this.state.y = e.clientY;
    this.trigger('changed', this, e);
  }

  function updateButton(e:MouseEvent) {
    var isDown = e.type === 'mousedown';
    if (e.which !== undefined) {
      this.state.buttons[e.which - 1] = isDown;
    } else if (e.button !== undefined) {
      this.state.buttons[e.button] = isDown;
    }
    this.trigger('changed', this, e);
  }

  function updateWheel(e:any) {
    if (e.detail) {
      this.state.wheel = -1 * e.detail;
    } else if (e.wheelDelta) {
      this.state.wheel = e.wheelDelta / 120;
    } else {
      this.state.wheel = 0;
    }
    this.trigger('changed', this, e);
  }

  export class Mouse extends Glib.Events {
    el:any = document;
    state:MouseState = {x: 0, y: 0, wheel: 0, buttons: [false, false, false]};

    _onMouseWheel:(e:MouseEvent) => void;
    _onMouseMove:(e:MouseEvent) => void;
    _onMouseDown:(e:MouseEvent) => void;
    _onMouseUp:(e:MouseEvent) => void;

    constructor(options:any = {}) {
      super();
      extend(this, options);

      this._onMouseWheel = updateWheel.bind(this);
      this._onMouseMove = updatePosition.bind(this);
      this._onMouseDown = updateButton.bind(this);
      this._onMouseUp = updateButton.bind(this);
      this.activate();
    }

    activate() {
      this.deactivate();
      this.el.addEventListener('mousewheel', this._onMouseWheel);
      this.el.addEventListener('mousemove', this._onMouseMove);
      this.el.addEventListener('mousedown', this._onMouseDown);
      this.el.addEventListener('mouseup', this._onMouseUp);
    }

    deactivate() {
      this.el.removeEventListener('mousewheel', this._onMouseWheel);
      this.el.removeEventListener('mousemove', this._onMouseMove);
      this.el.removeEventListener('mousedown', this._onMouseDown);
      this.el.removeEventListener('mouseup', this._onMouseUp);
    }

    getState(out:any = {}):MouseState {
      out.x = this.state.x;
      out.y = this.state.y;
      out.wheelValue = this.state.wheel;
      out.buttons = out.buttons || [];
      out.buttons.length = 3;
      out.buttons[0] = this.state.buttons[0];
      out.buttons[1] = this.state.buttons[1];
      out.buttons[2] = this.state.buttons[2];
      return out;
    }
  }

  export var MouseButton = {
    Left : 0,
    Middle : 1,
    Right : 2
  };

  export var MouseButtonName = {};
  for (var name in MouseButton) {
    MouseButtonName[MouseButton[name]] = name;
  }
}