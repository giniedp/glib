module Glib.Graphics {

  let propertyKeys = ['enable','x','y','width','height']

  export interface ScissorStateOptions {
    enable?: boolean
    x?: number
    y?: number
    width?: number
    height?: number
  }

  export class ScissorState implements ScissorStateOptions {
    device:Device
    gl:WebGLRenderingContext
    private enableField:boolean = false
    private xField:number = 0
    private yField:number = 0
    private widthField:number = 0
    private heightField:number = 0
    private hasChanged:boolean = false
    private changes:ScissorStateOptions = {}

    constructor(device:Device, state?:ScissorStateOptions) {
      this.device = device
      this.gl = device.context
      this.resolve()
      if (state) this.assign(state)
    }

    get enable():boolean {
      return this.enableField
    }

    set enable(value:boolean) {
      if (this.enableField !== value) {
        this.enableField = value
        this.changes.enable = value
        this.hasChanged = true
      }
    }

    get x():number {
      return this.xField
    }

    set x(value:number) {
      if (this.xField !== value) {
        this.xField = value
        this.changes.x = value
        this.hasChanged = true
      }
    }

    get y():number {
      return this.yField
    }

    set y(value:number) {
      if (this.yField !== value) {
        this.yField = value
        this.changes.y = value
        this.hasChanged = true
      }
    }

    get width():number {
      return this.widthField
    }

    set width(value:number) {
      if (this.widthField !== value) {
        this.widthField = value
        this.changes.width = value
        this.hasChanged = true
      }
    }

    get height():number {
      return this.heightField
    }

    set height(value:number) {
      if (this.heightField !== value) {
        this.heightField = value
        this.changes.height = value
        this.hasChanged = true
      }
    }

    assign(state:ScissorStateOptions={}):ScissorState {
      for (let key of propertyKeys) {
        if (state.hasOwnProperty(key)) this[key] = state[key]
      } 
      return this
    }

    commit(state?:ScissorStateOptions):ScissorState {
      if (state) this.assign(state)
      if (!this.hasChanged) return this
      let changes = this.changes
      let gl = this.gl
      if (changes.enable === true) {
        gl.enable(gl.SCISSOR_TEST)
      }
      if (changes.enable === false) {
        gl.disable(gl.SCISSOR_TEST)
      }
      if (changes.x != null || changes.y != null || changes.width != null || changes.height != null) {
        gl.scissor(this.x, this.y, this.width, this.height)
      }
      this.clearChanges()
      return this
    }

    resolve():ScissorState {
      ScissorState.resolve(this.gl, this)
      this.clearChanges()
      return this
    }

    copy(out:any={}):ScissorStateOptions {
      for (let key of propertyKeys) out[key] = this[key]
      return out
    }

    private clearChanges(){
      this.hasChanged = false
      for (let key of propertyKeys) this.changes[key] = undefined
    }

    static commit(gl:any, state:ScissorStateOptions) {
      var x = state.x
      var y = state.y
      var width = state.width
      var height = state.height
      var enable = state.enable
      if (enable === true) {
        gl.enable(gl.SCISSOR_TEST)
      }
      if (enable === false) {
        gl.disable(gl.SCISSOR_TEST)
      }
      if (x != null && y != null && width != null && height != null) {
        gl.scissor(x, y, width, height)
      }
    }

    static resolve(gl:WebGLRenderingContext, out:any={}):ScissorStateOptions {
      out.enable = gl.getParameter(gl.SCISSOR_TEST)
      var scissor = gl.getParameter(gl.SCISSOR_BOX)
      out.x = scissor[0]
      out.y = scissor[1]
      out.width = scissor[2]
      out.height = scissor[3]
      return out
    }

    static Default = Object.freeze({
      enable: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0
    })
  }
}
