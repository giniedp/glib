module Glib.Input {

  function prefix(browser:string, name:string, upper:boolean):string {
    if (browser == null) return null
    if (browser == '') return name
    if (upper) {
      name = name[0] + name.substr(1)
    }
    return browser + name
  }
  let browser = function() {
    for (let browser of ['', 'moz', 'webkit', 'ms', 'o']) {
      let pref = prefix(browser, 'exitPointerLock', true)
      if (pref in document) return browser
    }
  }();
  let cross = {
    requestPointerLock: prefix(browser, 'requestPointerLock', true),
    exitPointerLock: prefix(browser, 'exitPointerLock', true),
    pointerlockchange: prefix(browser, 'pointerlockchange', false),
    pointerlockerror: prefix(browser, 'pointerlockerror', false),
    pointerLockElement: prefix(browser, 'pointerLockElement', true),

    movementX: prefix(browser, 'movementX', true),
    movementY: prefix(browser, 'movementY', true),
  }
  let hasPointerlockApi = !!cross.requestPointerLock

  /**
   * Mouse constructor options
   */
  export interface IMouseOptions {
    element?: EventTarget,
    events?: string[]
  }
  
  /**
   * The captured Mouse state
   */
  export interface IMouseState {
    pageX:number
    pageY:number
    screenX:number
    screenY:number
    clientX:number
    clientY:number
    x:number
    y:number
    movementX: number
    movementY: number
    wheel:number
    buttons:boolean[]
  }

  /**
   * The Mouse class allows to capture the mouse state. It does so by listening to various mouse events 
   * and tracks the position and pressed buttons. On each recoginzed  state change the ```changed``` event is triggered. 
   */
  export class Mouse extends Glib.Events {
    /**
     * The target element on which to listen for mouse events. 
     */
    protected element:EventTarget = document
    
    /**
     * The tracked Mouse state
     */
    state:IMouseState = {
      pageX: 0, 
      pageY: 0,
      screenX: 0, 
      screenY: 0,
      clientX: 0, 
      clientY: 0,
      x: 0, 
      y: 0, 
      wheel: 0,
      movementX: 0,
      movementY: 0,
      buttons: [false, false, false],
    };

    /**
     * Collection of html events that are delegated (triggered) on this instance. 
     */
    protected delegatedEvents = [
      'click', 
      'contextmenu', 
      'dblclick', 
      'mousedown', 
      'mouseenter', 
      'mouseleave', 
      'mousemove', 
      'mouseout', 
      'mouseover', 
      'mouseup', 
      'show',
      'mousewheel'
    ]

    /**
     * Is called on the ```mousewheel``` event and captures the mouse wheel state
     */
    protected onMouseWheel:EventListener = this.handleWheel.bind(this)
    /**
     * Is called on the ```mousemove``` event and captures the movement state
     */
    protected onMouseMove:EventListener = this.handleMouseMove.bind(this)
    /**
     * Is called on the ```mousedown``` event and captures the button state
     */
    protected onMouseDown:EventListener = this.handleButton.bind(this)
    /**
     * Is called on the ```mouseup``` event and captures the button state
     */
    protected onMouseUp:EventListener = this.handleButton.bind(this)
    /**
     * Triggers the ```e.type``` event on this instance
     */
    protected onEvent:EventListener = (e) => this.trigger(e.type, this, e)
    /**
     * Is called when ```document``` or ```window``` loose focus (e.g. user switches to another tab or application)
     * and clears the button and wheel states.
     */
    protected onClearButtons:EventListener = this.clearButtons.bind(this)

    /**
     * Initializes the Mouse with given options and activates the captrue listeners 
     */
    constructor(options?:IMouseOptions) {
      super();
      if (options) {
        this.element = (options.element || this.element)
        this.delegatedEvents = (options.events || this.delegatedEvents)
      }
      this.activate()
    }

    /**
     * Activates the captrue listeners
     */
    activate() {
      this.deactivate()
      // update state events
      this.element.addEventListener('mousewheel', this.onMouseWheel)
      this.element.addEventListener('mousemove', this.onMouseMove)
      this.element.addEventListener('mousedown', this.onMouseDown)
      this.element.addEventListener('mouseup', this.onMouseUp)
      // visibility events
      utils.onDocumentVisibilityChange(this.onClearButtons)
      document.addEventListener('blur', this.onClearButtons)
      window.addEventListener('blur', this.onClearButtons)
      // delegated events
      for (let name of this.delegatedEvents) {
        this.element.addEventListener(name, this.onEvent)
      }
      // pointerlock events
      if (hasPointerlockApi) {
        document.addEventListener(cross.pointerlockchange, this.onEvent)
        document.addEventListener(cross.pointerlockerror, this.onEvent)
      }
    }

    /**
     * Deactivates the captrue listeners
     */
    deactivate() {
      // update logic events
      this.element.removeEventListener('mousewheel', this.onMouseWheel)
      this.element.removeEventListener('mousemove', this.onMouseMove)
      this.element.removeEventListener('mousedown', this.onMouseDown)
      this.element.removeEventListener('mouseup', this.onMouseUp)
      // visibility events
      utils.offDocumentVisibilityChange(this.onClearButtons)
      document.removeEventListener('blur', this.onClearButtons)
      window.removeEventListener('blur', this.onClearButtons)
      // delegated events
      for (let name of this.delegatedEvents) {
        this.element.removeEventListener(name, this.onEvent)
      }
      // pointerlock events
      if (hasPointerlockApi) {
        document.removeEventListener(cross.pointerlockchange, this.onEvent)
        document.removeEventListener(cross.pointerlockerror, this.onEvent)
      }
    }

    /**
     * Gets a copy of the captured state
     * @param [out={}] Where the state is written to
     */
    copyState(out:any = {}):IMouseState {
      out.x = this.state.x
      out.y = this.state.y
      out.wheelValue = this.state.wheel
      out.buttons = out.buttons || []
      out.buttons.length = 3
      out.buttons[0] = this.state.buttons[0]
      out.buttons[1] = this.state.buttons[1]
      out.buttons[2] = this.state.buttons[2]
      return out
    }

    /**
     * Locks the mouse to the current element. The mouse cursor is then not visible
     * and only the ```movementX``` and ```movementY``` state properties are updated.
     */
    lock() {
      if (!hasPointerlockApi) {
        utils.warn('[Mouse] pointerlock api is not available')
        return
      } 
      if (this.element === document[cross.pointerLockElement]) {
        return
      }
      if (this.element instanceof Element) {
        this.element[cross.requestPointerLock]()
      } else {
        utils.warn('[Mouse] lock() is only available for elements of type "Element"')
      }
    }
    /** 
     * Checks whether the mouse is already locked to any element 
     */
    isLocked():boolean {
      return Mouse.isLocked()
    }
    /**
     * Releases any locked Mouse
     */
    unlock() {
      return Mouse.unlock()
    }
    /** 
     * Checks whether the mouse is already locked to any element 
     */
    static isLocked():boolean {
      return !!document[cross.pointerLockElement]
    }
    /**
     * Releases any locked Mouse
     */
    static unlock() {
      if (hasPointerlockApi) {
        document[cross.exitPointerLock]()
      } else {
        utils.warn('[Mouse] pointerlock api is not available')
      }
    }

    /**
     * Updates the movement state from given event
     */
    protected handleMouseMove(e:MouseEvent) {
      let s = this.state
      s.pageX = e.pageX
      s.pageY = e.pageY
      s.screenX = e.screenX
      s.screenY = e.screenY
      s.clientX = e.clientX
      s.clientY = e.clientY
      s.movementX = e[cross.movementX]
      s.movementY = e[cross.movementY]
      s.x = e.clientX
      s.y = e.clientY
      if (this.element['getBoundingClientRect']) {
        let rect = this.element['getBoundingClientRect']()
        s.x = e.clientX - rect.left;
        s.y = e.clientY - rect.top;
      }
      this.trigger('changed', this, e);
    }

    /**
     * Updates the button states from given event
     */
    protected handleButton(e:MouseEvent) {
      var isDown = e.type === 'mousedown';
      if (e.which !== undefined) {
        this.state.buttons[e.which - 1] = isDown;
      } else if (e.button !== undefined) {
        this.state.buttons[e.button] = isDown;
      }
      this.trigger('changed', this, e);
    }

    /**
     * Updates the wheel state from given event
     */
    protected handleWheel(e:MouseEvent) {
      let state = this.state
      state.wheel = state.wheel || 0
      if (e.detail) {
        state.wheel += -1 * e.detail;
      } else if (e['wheelDelta']) {
        state.wheel += e['wheelDelta'] / 120;
      } else {
        state.wheel += 0;
      }
      this.trigger('changed', this, e);
    }

    /**
     * clears the button and wheel states
     */
    protected clearButtons() {
      this.state.wheel = 0
      this.state.buttons.length = 3
      this.state.buttons[0] = false
      this.state.buttons[1] = false
      this.state.buttons[2] = false
      this.trigger('changed', this, null)
    }
  }

  export var MouseButton = {
    Left: 0,
    Middle: 1,
    Right: 2
  };

  export var MouseButtonName = {}
  for (var name in MouseButton) {
    MouseButtonName[MouseButton[name]] = name
  }
}
