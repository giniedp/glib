module Glib.Input {

  /**
   * 
   */
  export interface IKeyboardOptions {
    element?: Element,
    events?: string[]
  }
  /**
   * 
   */
  export interface IKeyboardState {
    pressedKeys:number[];
  }

  /**
   * 
   */
  export class Keyboard extends Glib.Events {
    element:EventTarget = document
    state:IKeyboardState = {pressedKeys: []}

    /**
     * Collection of event to listen for on element and fire on this instance
     */
    delegatedEvents = [
      'keypress', 
      'keydown', 
      'keyup'
    ]

    /**
     * Is called on the elements 'keypress' event and marks a 'keyCode' as pressed 
     */
    protected onKeyPress = (e:KeyboardEvent) => this.setKeyPressed(e.keyCode)
    /**
     * Is called on the elements 'keypress' event and marks a 'keyCode' as pressed 
     */
    protected onKeyDown = (e:KeyboardEvent) => this.setKeyPressed(e.keyCode)
    /**
     * Is called on the elements 'keyup' event and marks a 'keyCode' as released 
     */
    protected onKeyUp = (e:KeyboardEvent) => this.setKeyReleased(e.keyCode)
    /**
     * Is called when document/window lost focus e.g. user switches to another tab or application 
     */
    protected onNeedsClear = () => this.clearState()
    /**
     * Triggers the Event that occurred on the element
     */
    protected onEvent:EventListener = (e:Event) => this.trigger(e.type, this, e)

    /**
     * 
     */
    constructor(options?:IKeyboardOptions) {
      super();
      if (options) {
        this.element = (options.element || this.element)
        this.delegatedEvents = (options.events || this.delegatedEvents)
      }
      this.activate()
    }

    /**
     * Activates the update listeners
     */
    activate() {
      this.deactivate()
      // update state events
      this.element.addEventListener('keypress', this.onKeyPress)
      this.element.addEventListener('keydown', this.onKeyDown)
      this.element.addEventListener('keyup', this.onKeyUp)
      // visibility events
      utils.onDocumentVisibilityChange(this.onNeedsClear)
      document.addEventListener('blur', this.onNeedsClear)
      window.addEventListener('blur', this.onNeedsClear)
      // delegated events
      for (let name of this.delegatedEvents) {
        this.element.addEventListener(name, this.onEvent)
      }
    }

    /**
     * Deactivates the update listeners
     */
    deactivate() {
      // update state events
      this.element.removeEventListener('keypress', this.onKeyPress)
      this.element.removeEventListener('keydown', this.onKeyDown)
      this.element.removeEventListener('keyup', this.onKeyUp)
      // visibility events
      utils.offDocumentVisibilityChange(this.onNeedsClear)
      document.removeEventListener('blur', this.onNeedsClear)
      window.removeEventListener('blur', this.onNeedsClear)
      // delegated events
      for (let name of this.delegatedEvents) {
        this.element.removeEventListener(name, this.onEvent)
      }
    }

    /**
     * Gets a copy of the current keyboard state.
     */
    getState(out:any = {}):IKeyboardState {
      var inKeys = this.state.pressedKeys
      var outKeys = out.keys || []

      outKeys.length = inKeys.length
      for (var i = 0; i < inKeys.length; i++) {
        outKeys[i] = inKeys[i]
      }

      out.pressedKeys = outKeys
      return out
    }
    /**
     * Marks the keyCode state of given event as pressed and triggers the 'changed' event
     */
    setKeyPressed(keycode:number) {
      var index = this.state.pressedKeys.indexOf(keycode)
      if (index < 0) this.state.pressedKeys.push(keycode)
      this.trigger('changed', this)
    }
    /**
     * Marks the keyCode state of given event as released and triggers the 'changed' event
     */
    setKeyReleased(keyCode:number) {
      var index = this.state.pressedKeys.indexOf(keyCode)
      if (index >= 0) this.state.pressedKeys.splice(index)
      this.trigger('changed', this)
    }
    /**
     * Clears the state of given Keyboard instance and trigger 'changed' event 
     */
    clearState() {
      this.state.pressedKeys.length = 0
      this.trigger('changed', this)
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
    Space : 32,
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
