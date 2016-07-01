module Glib.Components {

  import extend = Glib.utils.extend;
  import requestFrame = Glib.utils.requestFrame;
  import debug = Glib.utils.debug;

  export class GameLoop implements Component {
    node:Entity;
    name:string = 'GameLoop';
    service:boolean = true;
    enabled:boolean = true;

    preferTimeout:boolean = true;
    fixedTimeStep:number = 20;
    isFixedTimeStep:boolean = true;

    recursiveSetup:boolean = true;
    recursiveUpdate:boolean = true;
    recursiveDraw:boolean = true;

    _tickFunction:() => void;
    _time:number = 0;
    _timeRest:number = 0;

    constructor(params:any={}){
      extend(this, params);
    }

    run(){
      this._tickFunction = () => { this._tick(); };
      this._tick();
    }
    pause(){
      this._tickFunction = () => { };
    }
    stop(){
      this._tickFunction = () => { };
    }

    _tick(){
      var time = Glib.utils.getTime();
      var dt = time - this._time;
      this._time = time;

      if (this.isFixedTimeStep) {

        if (dt >= (this.fixedTimeStep - this._timeRest)) {
          this._onFrame(this.fixedTimeStep);
          this._timeRest = 0;
        }
        while (dt > this.fixedTimeStep) {
          dt -= this.fixedTimeStep;
        }
        this._timeRest += dt;
      } else {
        this._onFrame(dt);
      }

      if (this.preferTimeout) {
        self.setTimeout(this._tickFunction, 1);
      } else {
        requestFrame(this._tickFunction);
      }
    }

    _onFrame(dt:number) {
      var node = this.node;
      node._initializeComponents(this.recursiveSetup);
      node._updateComponents(dt, this.recursiveUpdate);
      node._drawComponents(dt, this.recursiveDraw);
      return this;
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`
      ].join("\n")
    }
  }
}
