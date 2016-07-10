module Glib.Components {

  export class Touch implements Component {
    node:Entity
    name:string = 'Touch'
    service:boolean = true
    enabled:boolean = true

    touch: Input.TouchPane
    touchIds: number[]

    oldStates: any
    newStates: any

    constructor(options:any={}){
      this.touch = new Input.TouchPane({ el: options.el || document })
      this.touchIds = []
      Glib.utils.extend(this, options)
      this.newStates = {}
      this.oldStates = {}
    }

    update(){
      let ids = this.touchIds
      ids.length = 0
      for (let id in this.touch.state) {
        ids.push(Number(id))
      }
      for (let id in ids) {
        let tmp = this.oldStates[id] || {}
        this.oldStates = this.newStates[id] || {}
        this.newStates = tmp
        this.touch.getState(Number(id), tmp)
      }
    }

    x(id: number) {
      let n = this.newStates[id]
      if (n) return n.x
    }

    y(id: number) {
      let n = this.newStates[id]
      if (n) return n.y
    }

    xDelta(id: number) {
      let n = this.newStates[id]
      let o = this.oldStates[id]
      if (n && o && n.active && o.active) {
        return n.x - o.x
      }
      return 0
    }

    yDelta(id: number) {
      let n = this.newStates[id]
      let o = this.oldStates[id]
      if (n && o && n.active && o.active) {
        return n.y - o.y
      }
      return 0
    }

    isActive(id: number) {
      let n = this.newStates[id]
      let o = this.oldStates[id]
      return n && o && n.active && o.active
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  enabled: ${this.enabled}`
      ].join("\n")
    }
  }
}
