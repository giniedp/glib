import { Events, offDocumentVisibilityChange, onDocumentVisibilityChange } from '@gglib/core'

/**
 * Keybord constructor options
 */
export interface IKeyboardOptions {
  element?: Element,
  events?: string[]
}

/**
 * The captured Keyboard state
 */
export interface IKeyboardState {
  pressedKeys: number[]
}

/**
 * The Keyboard class allows to capture the keyboards state. It does so by listening to
 * the ```keypress```, ```keydown``` and ```keyup``` events and tracks the pressed buttons. On each recoginzed
 * state change the ```changed``` event is triggered.
 */
export class Keyboard extends Events {
  /**
   * The target element on which to listen for keyboard events.
   */
  protected element: EventTarget = document

  /**
   * The tracked keyboard state
   */
  public state: IKeyboardState = {pressedKeys: []}

  /**
   * Collection of html events that are delegated (triggered) on this instance.
   */
  protected delegatedEvents = [
    'keypress',
    'keydown',
    'keyup',
  ]

  /**
   * Is called on the ```keypress``` event and marks the ```event.keyCode``` as pressed
   */
  protected onKeyPress = (e: KeyboardEvent) => { /* */ }
  /**
   * Is called on the ```keypress``` event and marks the ```event.keyCode``` as pressed
   */
  protected onKeyDown = (e: KeyboardEvent) => this.setKeyPressed(Keyboard.getCode(e))
  /**
   * Is called on the ```keyup``` event and marks the ```event.keyCode``` as released
   */
  protected onKeyUp = (e: KeyboardEvent) => this.setKeyReleased(Keyboard.getCode(e))
  /**
   * Is called when ```document``` or ```window``` loose focus e.g. user switches to another tab or application
   */
  protected onNeedsClear = () => this.clearState()
  /**
   * Triggers the Event that occurred on the element
   */
  protected onEvent: EventListener = (e: Event) => this.trigger(e.type, this, e)

  /**
   * Initializes the Keyboard with given options and activates the captrue listeners
   */
  constructor(options?: IKeyboardOptions) {
    super()
    if (options) {
      this.element = (options.element || this.element)
      this.delegatedEvents = (options.events || this.delegatedEvents)
    }
    this.activate()
  }

  /**
   * Activates the captrue listeners
   */
  public activate() {
    this.deactivate()
    // update state events
    this.element.addEventListener('keypress', this.onKeyPress)
    this.element.addEventListener('keydown', this.onKeyDown)
    this.element.addEventListener('keyup', this.onKeyUp)
    // visibility events
    onDocumentVisibilityChange(this.onNeedsClear)
    document.addEventListener('blur', this.onNeedsClear)
    window.addEventListener('blur', this.onNeedsClear)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.element.addEventListener(name, this.onEvent)
    }
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    // update state events
    this.element.removeEventListener('keypress', this.onKeyPress)
    this.element.removeEventListener('keydown', this.onKeyDown)
    this.element.removeEventListener('keyup', this.onKeyUp)
    // visibility events
    offDocumentVisibilityChange(this.onNeedsClear)
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
  public copyState(out: any = {}): IKeyboardState {
    let inKeys = this.state.pressedKeys
    let outKeys = out.keys || []

    outKeys.length = inKeys.length
    for (let i = 0; i < inKeys.length; i++) {
      outKeys[i] = inKeys[i]
    }

    out.pressedKeys = outKeys
    return out
  }
  /**
   * Marks the given ```code``` as being pressed and triggers the ```changed``` event
   */
  public setKeyPressed(code: number) {
    let index = this.state.pressedKeys.indexOf(code)
    if (index < 0) {
      this.state.pressedKeys.push(code)
      this.trigger('changed', this)
    }
  }
  /**
   * Marks the given ```keyCode``` as not being pressed and triggers the ```changed``` event
   */
  public setKeyReleased(code: number) {
    let index = this.state.pressedKeys.indexOf(code)
    if (index >= 0) {
      this.state.pressedKeys.splice(index)
      this.trigger('changed', this)
    }
  }
  /**
   * Clears the state and triggers the ```changed``` event
   */
  public clearState() {
    if (!this.state.pressedKeys.length) { return }
    this.state.pressedKeys.length = 0
    this.trigger('changed', this)
  }

  public static getCode(e: KeyboardEvent) {
    let code = e['code']
    if (code !== void 0) { return Keys[code] }
    return KeyCodeToKey[e.keyCode]
  }
}

export enum Keys {
  // Alphanumeric Section

  Backquote = 1,
  Backslash,
  Backspace,
  BracketLeft,
  BracketRight,
  Comma,
  Digit0 = 48,
  Digit1,
  Digit2,
  Digit3,
  Digit4,
  Digit5,
  Digit6,
  Digit7,
  Digit8,
  Digit9,
  Equal,
  IntlBackslash,
  IntlRo,
  IntlYen,
  KeyA = 65,
  KeyB,
  KeyC,
  KeyD,
  KeyE,
  KeyF,
  KeyG,
  KeyH,
  KeyI,
  KeyJ,
  KeyK,
  KeyL,
  KeyM,
  KeyN,
  KeyO,
  KeyP,
  KeyQ,
  KeyR,
  KeyS,
  KeyT,
  KeyU,
  KeyV,
  KeyW,
  KeyX,
  KeyY,
  KeyZ,
  Minus,
  Period,
  Quote,
  Semicolon,
  Slash,

  AltLeft,
  AltRight,
  CapsLock,
  ContextMenu,
  ControlLeft,
  ControlRight,
  Enter,
  MetaLeft,
  MetaRight,
  ShiftLeft,
  ShiftRight,
  Space,
  Tab,

  Convert,
  KanaMode,
  Lang1,
  Lang2,
  Lang3,
  Lang4,
  Lang5,
  NonConvert,

  //  Control Pad Section

  Delete,
  End,
  Help,
  Home,
  Insert,
  PageDown,
  PageUp,

  // Arrow Pad Section

  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,

  // Numpad Section

  NumLock,
  Numpad0,
  Numpad1,
  Numpad2,
  Numpad3,
  Numpad4,
  Numpad5,
  Numpad6,
  Numpad7,
  Numpad8,
  Numpad9,
  NumpadAdd,
  NumpadBackspace,
  NumpadClear,
  NumpadClearEntry,
  NumpadComma,
  NumpadDecimal,
  NumpadDivide,
  NumpadEnter,
  NumpadEqual,
  NumpadHash,
  NumpadMemoryAdd,
  NumpadMemoryClear,
  NumpadMemoryRecall,
  NumpadMemoryStore,
  NumpadMemorySubtract,
  NumpadMultiply,
  NumpadParenLeft,
  NumpadParenRight,
  NumpadStar,
  NumpadSubtract,

  // Function Section

  Escape,
  F1,
  F2,
  F3,
  F4,
  F5,
  F6,
  F7,
  F8,
  F9,
  F10,
  F11,
  F12,
  Fn,
  FnLock,
  PrintScreen,
  ScrollLock,
  Pause,

  // Media Keys

  BrowserBack,
  BrowserFavorites,
  BrowserForward,
  BrowserHome,
  BrowserRefresh,
  BrowserSearch,
  BrowserStop,
  Eject,
  LaunchApp1,
  LaunchApp2,
  LaunchMail,
  MediaPlayPause,
  MediaSelect,
  MediaStop,
  MediaTrackNext,
  MediaTrackPrevious,
  Power,
  Sleep,
  AudioVolumeDown,
  AudioVolumeMute,
  AudioVolumeUp,
  WakeUp,
}

export const KeyCodeToKey = Object.freeze({
  8 : Keys.Backspace,
  9 : Keys.Tab,
  13 : Keys.Enter,
  16 : Keys.ShiftLeft,
  17 : Keys.ControlLeft,
  18 : Keys.AltLeft,
  19 : Keys.Pause,
  20 : Keys.CapsLock,
  27 : Keys.Escape,
  32 : Keys.Space,
  33 : Keys.PageUp,
  34 : Keys.PageDown,
  35 : Keys.End,
  36 : Keys.Home,
  37 : Keys.ArrowLeft,
  38 : Keys.ArrowUp,
  39 : Keys.ArrowRight,
  40 : Keys.ArrowDown,
  45 : Keys.Insert,
  46 : Keys.Delete,
  48 : Keys.Digit0,
  49 : Keys.Digit1,
  50 : Keys.Digit2,
  51 : Keys.Digit3,
  52 : Keys.Digit4,
  53 : Keys.Digit5,
  54 : Keys.Digit6,
  55 : Keys.Digit7,
  56 : Keys.Digit8,
  57 : Keys.Digit9,
  65 : Keys.KeyA,
  66 : Keys.KeyB,
  67 : Keys.KeyC,
  68 : Keys.KeyD,
  69 : Keys.KeyE,
  70 : Keys.KeyF,
  71 : Keys.KeyG,
  72 : Keys.KeyH,
  73 : Keys.KeyI,
  74 : Keys.KeyJ,
  75 : Keys.KeyK,
  76 : Keys.KeyL,
  77 : Keys.KeyM,
  78 : Keys.KeyN,
  79 : Keys.KeyO,
  80 : Keys.KeyP,
  81 : Keys.KeyQ,
  82 : Keys.KeyR,
  83 : Keys.KeyS,
  84 : Keys.KeyT,
  85 : Keys.KeyU,
  86 : Keys.KeyV,
  87 : Keys.KeyW,
  88 : Keys.KeyX,
  89 : Keys.KeyY,
  90 : Keys.KeyZ,
  91 : Keys.MetaLeft,
  92 : Keys.MetaRight,
  93 : Keys.MediaSelect,
  96 :  Keys.Numpad0,
  97 :  Keys.Numpad1,
  98 :  Keys.Numpad2,
  99 :  Keys.Numpad3,
  100 : Keys.Numpad4,
  101 : Keys.Numpad5,
  102 : Keys.Numpad6,
  103 : Keys.Numpad7,
  104 : Keys.Numpad8,
  105 : Keys.Numpad9,
  106 : Keys.NumpadMultiply,
  107 : Keys.NumpadAdd,
  109 : Keys.NumpadSubtract,
  110 : Keys.NumpadDecimal,
  111 : Keys.NumpadDivide,
  112 : Keys.F1,
  113 : Keys.F2,
  114 : Keys.F3,
  115 : Keys.F4,
  116 : Keys.F5,
  117 : Keys.F6,
  118 : Keys.F7,
  119 : Keys.F8,
  120 : Keys.F9,
  121 : Keys.F10,
  122 : Keys.F11,
  123 : Keys.F12,
  144 : Keys.NumLock,
  145 : Keys.ScrollLock,
  186 : Keys.Semicolon,
  187 : Keys.Equal,
  188 : Keys.Comma,
  189 : Keys.Minus,
  190 : Keys.Period,
  191 : Keys.Slash,
  192 : Keys.Backquote,
  219 : Keys.BracketLeft,
  220 : Keys.Backslash,
  221 : Keys.BracketRight,
  222 : Keys.IntlRo,
})
