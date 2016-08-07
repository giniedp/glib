module Glib.Input {

  function prefix(browser:string, name:string, upper:boolean):string {
    if (browser == null) return null
    if (browser == '') return name
    if (upper) name[0] = name[0].toUpperCase()
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
   * 
   */
  export interface IMouseOptions {
    element?: Element,
    events?: string[]
  }
  /**
   * 
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
   * 
   */
  export class Mouse extends Glib.Events {
    element:Element|Document = document
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
     * Collection of event names that are captured on the mouse element
     * and retriggered on the Mouse instance
     */
    delegatedEvents = [
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
     * Updates the mouse wheel state with given MouseEvent
     */
    protected onMouseWheel:EventListener = (e:MouseEvent) => Mouse.updateWheel(this, e)
    /**
     * Updates the mouse movement states with given MouseEvent
     */
    protected onMouseMove:EventListener = (e:MouseEvent) => Mouse.updateMovement(this, e)
    /**
     * Updates the mouse button states with given MouseEvent
     */
    protected onMouseDown:EventListener = (e:MouseEvent) => Mouse.updateButton(this, e)
    /**
     * Updates the mouse button states with given MouseEvent
     */
    protected onMouseUp:EventListener = (e:MouseEvent) => Mouse.updateButton(this, e)
    /**
     * Triggers the MouseEvent that occurred on the element
     */
    protected onEvent:EventListener = (e) => Mouse.delegate(this, e)
    /**
     * Clears the wheel and button states
     */
    protected onClearButtons:EventListener = () => Mouse.clearButtons(this)

    /**
     * Creates a new Mouse instance that captures the mouse state
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
     * Activates the capturing of the IMouseState
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
     * Deactivates the capturing of the IMouseState
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
     * Gets a copy of the captured IMouseState
     * @param [out={}] Where the state is written to
     */
    getState(out:any = {}):IMouseState {
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
     * and only the movementX/movementY state properties are updated
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

    static updateMovement(mouse: Mouse, e:MouseEvent) {
      let s = mouse.state
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
      if (mouse.element['getBoundingClientRect']) {
        let rect = mouse.element['getBoundingClientRect']()
        s.x = e.clientX - rect.left;
        s.y = e.clientY - rect.top;
      }
      mouse.trigger('changed', mouse, e);
    }

    protected static updateButton(mouse: Mouse, e:MouseEvent) {
      var isDown = e.type === 'mousedown';
      if (e.which !== undefined) {
        mouse.state.buttons[e.which - 1] = isDown;
      } else if (e.button !== undefined) {
        mouse.state.buttons[e.button] = isDown;
      }
      mouse.trigger('changed', mouse, e);
    }

    protected static updateWheel(mouse: Mouse, e:any) {
      if (e.detail) {
        mouse.state.wheel = -1 * e.detail;
      } else if (e.wheelDelta) {
        mouse.state.wheel = e.wheelDelta / 120;
      } else {
        mouse.state.wheel = 0;
      }
      mouse.trigger('changed', mouse, e);
    }

    protected static clearButtons(mouse: Mouse) {
      mouse.state.wheel = 0
      mouse.state.buttons.length = 3
      mouse.state.buttons[0] = false
      mouse.state.buttons[1] = false
      mouse.state.buttons[2] = false
      mouse.trigger('changed', mouse, null)
    }

    protected static delegate(mouse: Mouse, e:Event){
      mouse.trigger(e.type, mouse, e);
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
