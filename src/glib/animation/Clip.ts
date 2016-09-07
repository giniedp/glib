module Glib.Animation {
  export class Clip {
    name:string
    duration: number
    frames: Keyframe[]

    constructor() {

    }

    updateDuration() {
      if (this.frames.length == 0) {
        this.duration = 0
        return
      }
      
      let start = this.frames[0].time
      let end = this.frames[this.frames.length-1].time
      this.duration = end - start
    }
  } 
}