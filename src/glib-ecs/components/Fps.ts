module Glib.Components {

  export class Fps implements Component {
    node:Entity;
    name:string = 'Fps';
    enabled:boolean = true;
    service:boolean = true;

    frames:number;
    fps:number;
    fpsTimer:number;
    fpsCounter:number;

    time:Time;

    constructor() {
      this.reset();
    }

    setup() {
      this.time = this.node.root.getService('Time');
    }

    reset() {
      this.frames = 0;
      this.fps = 0;
      this.fpsTimer = 0;
      this.fpsCounter = 0;
    }

    update() {
      this.frames += 1;
      this.fpsTimer += this.time.elapsedMsInReal;
      this.fpsCounter += 1;
      if (this.fpsTimer >= 1000) {
        this.fps = this.fpsCounter * this.fpsTimer * 0.001;
        this.fpsCounter = 0;
        while (this.fpsTimer >= 1000) {
          this.fpsTimer -= 1000;
        }
      }
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`,
        `  fps: ${this.fps.toPrecision(5)}`
      ].join("\n")
    }
  }
}
