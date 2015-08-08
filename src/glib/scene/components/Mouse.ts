module Glib.Components {

  export class Mouse implements Component {
    node:Entity;
    name:string = 'Mouse';
    service:boolean = true;
    enabled:boolean = true;

    mouse:Input.Mouse;
    newState: Input.MouseState;
    oldState: Input.MouseState;

    constructor(options:any={}){
      this.mouse = new Input.Mouse({ el: options.el || document });
      Glib.utils.extend(this, options);
      this.newState = this.mouse.getState({});
      this.oldState = this.mouse.getState({});
    }

    update(){
      var toUpdate = this.oldState;
      this.oldState = this.newState;
      this.newState = toUpdate;
      this.mouse.getState(toUpdate);
    }

    get x() {
      return this.newState.x;
    }

    get y() {
      return this.newState.y;
    }

    get xDelta() {
      return this.newState.x - this.oldState.x;
    }

    get yDelta() {
      return this.newState.y - this.oldState.y;
    }

    get wheel(){
      return this.newState.wheel;
    }

    get wheelDelta(){
      return this.newState.wheel - this.oldState.wheel;
    }

    get leftButtonIsPressed():boolean {
      return this.newState.buttons[0];
    }

    get leftButtonJustPressed():boolean {
      return !this.oldState.buttons[0] && this.newState.buttons[0];
    }

    get leftButtonIsReleased():boolean {
      return this.newState.buttons[0];
    }

    get leftButtonJustReleased():boolean {
      return this.oldState.buttons[0] && !this.newState.buttons[0];
    }


    get middleButtonIsPressed():boolean {
      return this.newState.buttons[1];
    }

    get middleButtonJustPressed():boolean {
      return !this.oldState.buttons[1] && this.newState.buttons[1];
    }

    get middleButtonIsReleased():boolean {
      return this.newState.buttons[1];
    }

    get middleButtonJustReleased():boolean {
      return this.oldState.buttons[1] && !this.newState.buttons[1];
    }


    get rightButtonIsPressed():boolean {
      return this.newState.buttons[2];
    }

    get rightButtonJustPressed():boolean {
      return !this.oldState.buttons[2] && this.newState.buttons[2];
    }

    get rightButtonIsReleased():boolean {
      return this.newState.buttons[2];
    }

    get rightButtonJustReleased():boolean {
      return this.oldState.buttons[2] && !this.newState.buttons[2];
    }


    buttonIsPressed(button:number):boolean {
      return this.newState.buttons[button];
    }

    buttonJustPressed(button):boolean {
      return !this.oldState.buttons[button] && this.newState.buttons[button];
    }

    buttonIsReleased(button):boolean {
      return this.newState.buttons[button];
    }

    buttonJustReleased(button):boolean {
      return this.oldState.buttons[button] && !this.newState.buttons[button];
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`,
        `  buttons: ${this.newState.buttons}`,
        `  wheel: ${this.newState.wheel}`,
        `  x: ${this.newState.x.toPrecision(5)}, y: ${this.newState.y.toPrecision(5)}`,
        `  dx: ${this.xDelta.toPrecision(5)}, dy: ${this.yDelta.toPrecision(5)}`,
      ].join("\n")
    }
  }
}
