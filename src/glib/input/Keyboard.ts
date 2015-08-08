module Glib.Input {

  import extend = Glib.utils.extend;
  import debug = Glib.utils.debug;

  export interface KeyboardState {
    pressedKeys:number[];
  }

  function setKeyPressed(e:KeyboardEvent) {
    var index = this.state.pressedKeys.indexOf(e.keyCode);
    if (index < 0) {
      debug(`Key pressed '${e.keyCode}' '${KeyCodeName[e.keyCode]}'`);
      this.state.pressedKeys.push(e.keyCode);
    }
    this.trigger('changed', e, this)
  }

  function setKeyReleased(e:KeyboardEvent) {
    var index = this.state.pressedKeys.indexOf(e.keyCode);
    if (index >= 0) {
      debug(`Key released '${e.keyCode}' '${KeyCodeName[e.keyCode]}'`);
      this.state.pressedKeys.splice(index);
    }
    this.trigger('changed', e, this)
  }

  export class Keyboard extends Glib.Events {
    el:any = document;
    state:KeyboardState = {pressedKeys: []};

    _onKeyPress:(e:KeyboardEvent) => void;
    _onKeyDown:(e:KeyboardEvent) => void;
    _onKeyUp:(e:KeyboardEvent) => void;

    constructor(options:any = {}) {
      super();
      extend(this, options);
      this._onKeyPress = setKeyPressed.bind(this);
      this._onKeyDown = setKeyPressed.bind(this);
      this._onKeyUp = setKeyReleased.bind(this);
      this.activate();
    }

    /**
     * Activates the update listeners
     */
    activate() {
      this.el.addEventListener('keypress', this._onKeyPress);
      this.el.addEventListener('keydown', this._onKeyDown);
      this.el.addEventListener('keyup', this._onKeyUp);
    }

    /**
     * Deactivates the update listeners
     */
    deactivate() {
      this.el.removeEventListener('keypress', this._onKeyPress);
      this.el.removeEventListener('keydown', this._onKeyDown);
      this.el.removeEventListener('keyup', this._onKeyUp);
    }

    /**
     * Gets a copy of the current keyboard state.
     */
    getState(out:any = {}):KeyboardState {
      var inKeys = this.state.pressedKeys;
      var outKeys = out.keys || [];

      outKeys.length = inKeys.length;
      for (var i = 0; i < inKeys.length; i++) {
        outKeys[i] = inKeys[i];
      }

      out.pressedKeys = outKeys;
      return out;
    }
  }

  export var KeyCode = {
    Back : 8,
    Tab : 9,
    Enter : 13,
    Shift : 16,
    Ctrl : 17,
    Alt : 18,
    Pause : 19,
    CapsLock : 20,
    Escape : 27,
    PageUp : 33,
    PageDown : 34,
    End : 35,
    Home : 36,
    LeftArrow : 37,
    UpArrow : 38,
    RightArrow : 39,
    DownArrow : 40,
    Insert : 45,
    Delete : 46,
    D0 : 48,
    D1 : 49,
    D2 : 50,
    D3 : 51,
    D4 : 52,
    D5 : 53,
    D6 : 54,
    D7 : 55,
    D8 : 56,
    D9 : 57,
    A : 65,
    B : 66,
    C : 67,
    D : 68,
    E : 69,
    F : 70,
    G : 71,
    H : 72,
    I : 73,
    J : 74,
    K : 75,
    L : 76,
    M : 77,
    N : 78,
    O : 79,
    P : 80,
    Q : 81,
    R : 82,
    S : 83,
    T : 84,
    U : 85,
    V : 86,
    W : 87,
    X : 88,
    Y : 89,
    Z : 90,
    LeftWindows : 91,
    RightWindows : 92,
    SelectKey : 93,
    NumPad0 : 96,
    NumPad1 : 97,
    NumPad2 : 98,
    NumPad3 : 99,
    NumPad4 : 100,
    NumPad5 : 101,
    NumPad6 : 102,
    NumPad7 : 103,
    NumPad8 : 104,
    NumPad9 : 105,
    Multiply : 106,
    Add : 107,
    Subtract : 109,
    Decimal : 110,
    Divide : 111,
    F1 : 112,
    F2 : 113,
    F3 : 114,
    F4 : 115,
    F5 : 116,
    F6 : 117,
    F7 : 118,
    F8 : 119,
    F9 : 120,
    F10 : 121,
    F11 : 122,
    F12 : 123,
    NumLock : 144,
    Scroll : 145,
    Semicolon : 186,
    EqualSign : 187,
    Comma : 188,
    Dash : 189,
    Period : 190,
    ForwardSlash : 191,
    GraveAccent : 192,
    OpenBracket : 219,
    Backslash : 220,
    CloseBracket : 221,
    SingleQuote : 222
  };

  export var KeyCodeName = {};
  for (var name in KeyCode) {
    KeyCodeName[KeyCode[name]] = name;
  }
}
