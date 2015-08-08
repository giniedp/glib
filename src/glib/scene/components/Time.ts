module Glib.Components {

  import getTime = Glib.utils.getTime;

  export class Time {
    node:Entity;
    name:string = 'Time';
    service: boolean = true;
    enabled: boolean = true;

    current: number;
    elapsedMsInGame:number;
    totalMsInGame:number;
    elapsedMsInReal:number;
    totalMsInReal:number;

    constructor(params:any = {}) {
      Glib.utils.extend(this, params);
      this.reset();
    }

    reset() {
      this.current = getTime();
      this.elapsedMsInGame = 0;
      this.totalMsInGame = 0;
      this.elapsedMsInReal = 0;
      this.totalMsInReal = 0;
    }

    update(ms) {
      var time = getTime();
      this.elapsedMsInGame = ms;
      this.totalMsInGame += this.elapsedMsInGame;
      this.elapsedMsInReal = time - this.current;
      this.totalMsInReal += this.elapsedMsInReal;
      this.current = time;
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`,
        `  elapsed gameTime: ${this.elapsedMsInGame.toPrecision(5)}`,
        `  total gameTime: ${this.totalMsInGame}`,
        `  elapsed realTime: ${this.elapsedMsInReal.toPrecision(5)}`,
        `  total realTime: ${this.totalMsInReal}`
      ].join("\n")
    }
  }
}
