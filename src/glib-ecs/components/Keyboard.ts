module Glib.Components {

  export class Keyboard implements Component {
    node:Entity;
    name:string ='Keyboard';
    service:boolean = true;
    enabled:boolean = true;

    keyboard: Input.Keyboard;
    newState: Input.IKeyboardState;
    oldState: Input.IKeyboardState;

    constructor(options:any={}){
      this.keyboard = new Input.Keyboard();
      Glib.utils.extend(this, options);
      this.newState = this.keyboard.copyState({});
      this.oldState = this.keyboard.copyState({});
    }

    update(){
      var toUpdate = this.oldState;
      this.oldState = this.newState;
      this.newState = toUpdate;
      this.keyboard.copyState(toUpdate);
    }

    isPressed(key:number):boolean {
      return this.newState.pressedKeys.indexOf(key) >= 0;
    }

    justPressed(key):boolean {
      return (this.oldState.pressedKeys.indexOf(key) < 0) && (this.newState.pressedKeys.indexOf(key) >= 0);
    }

    isReleased(key):boolean {
      return (this.newState.pressedKeys.indexOf(key) >= 0);
    }

    justReleased(key):boolean {
      return (this.oldState.pressedKeys.indexOf(key) >= 0) && (this.newState.pressedKeys.indexOf(key) < 0);
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`,
        `  keys: ${this.newState.pressedKeys}`
      ].join("\n")
    }
  }
}
