module Glib.Components {

  export class Keyboard implements Component {
    public node: Entity
    public name: string = 'Keyboard'
    public service: boolean = true
    public enabled: boolean = true

    public keyboard: Input.Keyboard
    public newState: Input.IKeyboardState
    public oldState: Input.IKeyboardState

    constructor(options: any= {}) {
      this.keyboard = new Input.Keyboard()
      Glib.utils.extend(this, options)
      this.newState = this.keyboard.copyState({})
      this.oldState = this.keyboard.copyState({})
    }

    public update() {
      const toUpdate = this.oldState
      this.oldState = this.newState
      this.newState = toUpdate
      this.keyboard.copyState(toUpdate)
    }

    public isPressed(key: number): boolean {
      return this.newState.pressedKeys.indexOf(key) >= 0
    }

    public justPressed(key): boolean {
      return (this.oldState.pressedKeys.indexOf(key) < 0) && (this.newState.pressedKeys.indexOf(key) >= 0)
    }

    public isReleased(key): boolean {
      return (this.newState.pressedKeys.indexOf(key) >= 0)
    }

    public justReleased(key): boolean {
      return (this.oldState.pressedKeys.indexOf(key) >= 0) && (this.newState.pressedKeys.indexOf(key) < 0)
    }

    public debug(): string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`,
        `  keys: ${this.newState.pressedKeys}`
      ].join('\n')
    }
  }
}
