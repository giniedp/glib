module Glib.Graphics {

  let propertyKeys = [
    'offsetEnable',
    'offsetFactor',
    'offsetUnits'
  ]

  export interface OffsetStateOptions {
    offsetEnable?: boolean
    offsetFactor?: number
    offsetUnits?: number
  }

  export class OffsetState implements OffsetStateOptions {
    device:Device
    gl:WebGLRenderingContext
    private offsetEnableField:boolean = false
    private offsetFactorField:number = 0
    private offsetUnitsField:number = 0
    private hasChanged:boolean = false
    private changes:OffsetStateOptions = {}

    constructor(device:Device, state?:OffsetStateOptions) {
      this.device = device
      this.gl = device.context
      this.resolve()
      if (state) this.assign(state)
    }

    get offsetEnable():boolean {
      return this.offsetEnableField
    }

    set offsetEnable(value:boolean) {
      if (this.offsetEnableField !== value) {
        this.offsetEnableField = value
        this.changes.offsetEnable = value
        this.hasChanged = true
      }
    }

    get offsetFactor():number {
      return this.offsetFactorField
    }

    set offsetFactor(value:number) {
      if (this.offsetFactorField !== value) {
        this.offsetFactorField = value
        this.changes.offsetFactor = value
        this.hasChanged = true
      }
    }

    get offsetUnits():number {
      return this.offsetUnitsField
    }

    set offsetUnits(value:number) {
      if (this.offsetUnitsField !== value) {
        this.offsetUnitsField = value
        this.changes.offsetUnits = value
        this.hasChanged = true
      }
    }

    assign(state:OffsetStateOptions):OffsetState {
      for (let key of propertyKeys) {
        if (state.hasOwnProperty(key)) this[key] = state[key]
      } 
      return this
    }

    commit(state?:OffsetStateOptions):OffsetState {
      if (state) this.assign(state)
      if (!this.hasChanged) return this
      let changes = this.changes
      let gl = this.gl
      if (this.changes.offsetEnable === true) {
        gl.enable(gl.POLYGON_OFFSET_FILL)
      }
      if (this.changes.offsetEnable === false) {
        gl.disable(gl.POLYGON_OFFSET_FILL)
      }
      if (this.changes.offsetFactor !== null || this.changes.offsetUnits !== null) {
        gl.polygonOffset(this.offsetFactor, this.offsetUnits)
      }
      this.clearChanges()
      return this
    }

    copy(out:any={}):OffsetStateOptions {
      for (let key of propertyKeys) out[key] = this[key]
      return out
    }

    resolve():OffsetState {
      OffsetState.resolve(this.gl, this)
      this.clearChanges()
      return this
    }

    private clearChanges(){
      this.hasChanged = false
      for (let key of propertyKeys) this.changes[key] = undefined
    }

    static convert(state:any):OffsetStateOptions {
      if (typeof state === 'string') {
        state = OffsetState[state]
      }
      return state
    }

    static resolve(gl:any, out:any={}):OffsetStateOptions {
      out.offsetEnable = gl.getParameter(gl.POLYGON_OFFSET_FILL)
      out.offsetFactor = gl.getParameter(gl.POLYGON_OFFSET_FACTOR)
      out.offsetUnits = gl.getParameter(gl.POLYGON_OFFSET_UNITS)
      return out
    }

    static Default = Object.freeze({
      offsetEnable: false,
      offsetFactor: 0,
      offsetUnits: 0
    })
  }
}
