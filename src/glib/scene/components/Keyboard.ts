module Glib.Components {

  export class Keyboard implements Component {
    node:Entity;
    name:string ='Keyboard';
    service:boolean = true;
    enabled:boolean = true;

    keyboard: Input.Keyboard;
    newState: Input.KeyboardState;
    oldState: Input.KeyboardState;

    constructor(options:any={}){
      this.keyboard = new Input.Keyboard({ el: options.el || document });
      Glib.utils.extend(this, options);
      this.newState = this.keyboard.getState({});
      this.oldState = this.keyboard.getState({});
    }

    update(){
      var toUpdate = this.oldState;
      this.oldState = this.newState;
      this.newState = toUpdate;
      this.keyboard.getState(toUpdate);
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
