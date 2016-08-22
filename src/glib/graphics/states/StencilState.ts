module Glib.Graphics {

  let propertyKeys = [
    'enable',
    'stencilFunction',
    'stencilReference',
    'stencilMask',
    'stencilFail',
    'stencilDepthFail',
    'stencilDepthPass',
    'stencilBackFunction',
    'stencilBackReference',
    'stencilBackMask',
    'stencilBackFail',
    'stencilBackDepthFail',
    'stencilBackDepthPass'
  ]

  export interface StencilStateOptions {
    enable?: boolean
    stencilFunction?: number
    stencilReference?: number
    stencilMask?: number
    stencilFail?: number
    stencilDepthFail?: number
    stencilDepthPass?: number
    stencilBackFunction?: number
    stencilBackReference?: number
    stencilBackMask?: number
    stencilBackFail?: number
    stencilBackDepthFail?: number
    stencilBackDepthPass?: number
  }

  export class StencilState implements StencilStateOptions {
    device:Device
    gl:WebGLRenderingContext
    private enableField:boolean = false
    private stencilFunctionField:number = CompareFunction.Always
    private stencilReferenceField:number = 0
    private stencilMaskField:number = 0xffffffff
    private stencilFailField:number = StencilOperation.Keep
    private stencilDepthFailField:number = StencilOperation.Keep
    private stencilDepthPassField:number = StencilOperation.Keep
    private stencilBackFunctionField:number = CompareFunction.Always
    private stencilBackReferenceField:number = 0
    private stencilBackMaskField:number = 0xffffffff
    private stencilBackFailField:number = StencilOperation.Keep
    private stencilBackDepthFailField:number = StencilOperation.Keep
    private stencilBackDepthPassField:number = StencilOperation.Keep
    private changes:StencilStateOptions = {}
    private hasChanged:boolean = false

    constructor(device:Device, state?:StencilStateOptions) {
      this.device = device
      this.gl = device.context
      this.resolve()
      if (state) this.assign(state)
    }

    get stencilFunction():number {
      return this.stencilFunctionField
    }

    get stencilFunctionName():string {
      return CompareFunctionName[this.stencilFunctionField]
    }

    set stencilFunction(value:number) {
      if (this.stencilFunctionField !== value) {
        this.stencilFunctionField = value
        this.changes.stencilFunction = value
        this.hasChanged = true
      }
    }

    get stencilBackFunction():number {
      return this.stencilBackFunctionField
    }

    get stencilBackFunctionName():string {
      return CompareFunctionName[this.stencilBackFunctionField]
    }

    set stencilBackFunction(value:number) {
      if (this.stencilBackFunctionField !== value) {
        this.stencilBackFunctionField = value
        this.changes.stencilBackFunction = value
        this.hasChanged = true
      }
    }

    get stencilFail():number {
      return this.stencilFailField
    }

    get stencilFailName():string {
      return CompareFunctionName[this.stencilFailField]
    }

    set stencilFail(value:number) {
      if (this.stencilFailField !== value) {
        this.stencilFailField = value
        this.changes.stencilFail = value
        this.hasChanged = true
      }
    }

    get stencilDepthFail():number {
      return this.stencilDepthFailField
    }

    get stencilDepthFailName():string {
      return CompareFunctionName[this.stencilDepthFailField]
    }

    set stencilDepthFail(value:number) {
      if (this.stencilDepthFailField !== value) {
        this.stencilDepthFailField = value
        this.changes.stencilDepthFail = value
        this.hasChanged = true
      }
    }

    get stencilDepthPass():number {
      return this.stencilDepthPassField
    }

    get stencilDepthPassName():string {
      return CompareFunctionName[this.stencilDepthPassField]
    }

    set stencilDepthPass(value:number) {
      if (this.stencilDepthPassField !== value) {
        this.stencilDepthPassField = value
        this.changes.stencilDepthPass = value
        this.hasChanged = true
      }
    }

    get stencilBackFail():number {
      return this.stencilBackFailField
    }

    get stencilBackFailName():string {
      return CompareFunctionName[this.stencilBackFailField]
    }

    set stencilBackFail(value:number) {
      if (this.stencilBackFailField !== value) {
        this.stencilBackFailField = value
        this.changes.stencilBackFail = value
        this.hasChanged = true
      }
    }

    get stencilBackDepthFail():number {
      return this.stencilBackDepthFailField
    }

    get stencilBackDepthFailName():string {
      return CompareFunctionName[this.stencilBackDepthFailField]
    }

    set stencilBackDepthFail(value:number) {
      if (this.stencilBackDepthFailField !== value) {
        this.stencilBackDepthFailField = value
        this.changes.stencilBackDepthFail = value
        this.hasChanged = true
      }
    }

    get stencilBackDepthPass():number {
      return this.stencilBackDepthPassField
    }

    get stencilBackDepthPassName():string {
      return CompareFunctionName[this.stencilBackDepthPassField]
    }

    set stencilBackDepthPass(value:number) {
      if (this.stencilBackDepthPassField !== value) {
        this.stencilBackDepthPassField = value
        this.changes.stencilBackDepthPass = value
        this.hasChanged = true
      }
    }

    get stencilReference():number {
      return this.stencilReferenceField
    }

    set stencilReference(value:number) {
      if (this.stencilReferenceField !== value) {
        this.stencilReferenceField = value
        this.changes.stencilReference = value
        this.hasChanged = true
      }
    }

    get stencilMask():number {
      return this.stencilMaskField
    }

    set stencilMask(value:number) {
      if (this.stencilMaskField !== value) {
        this.stencilMaskField = value
        this.changes.stencilMask = value
        this.hasChanged = true
      }
    }

    get stencilBackReference():number {
      return this.stencilBackReferenceField
    }

    set stencilBackReference(value:number) {
      if (this.stencilBackReferenceField !== value) {
        this.stencilBackReferenceField = value
        this.changes.stencilBackReference = value
        this.hasChanged = true
      }
    }

    get stencilBackMask():number {
      return this.stencilBackMaskField
    }

    set stencilBackMask(value:number) {
      if (this.stencilBackMaskField !== value) {
        this.stencilBackMaskField = value
        this.changes.stencilBackMask = value
        this.hasChanged = true
      }
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

    assign(state:StencilStateOptions={}):StencilState {
      for (let key of propertyKeys) {
        if (state.hasOwnProperty(key)) this[key] = state[key]
      } 
      return this
    }

    commit(state?:StencilStateOptions):StencilState {
      if (state) this.assign(state)
      if (!this.hasChanged) return this

      let gl = this.gl
      let changes = this.changes;

      var enable = changes.enable
      if (enable === true) {
        gl.enable(gl.STENCIL_TEST)
      } else if (enable === false) {
        gl.disable(gl.STENCIL_TEST)
      }

      if (changes.stencilFunction !== null || changes.stencilReference !== null || changes.stencilMask !== null) {
        gl.stencilFuncSeparate(CullMode.Front, this.stencilFunction, this.stencilReference, this.stencilMask)
      }

      if (changes.stencilFail !== null || changes.stencilDepthFail !== null || changes.stencilDepthPass !== null) {
        gl.stencilOpSeparate(CullMode.Front, this.stencilFail, this.stencilDepthFail, this.stencilDepthPass)
      }

      if (changes.stencilBackFunction !== null || changes.stencilBackReference !== null || changes.stencilBackMask !== null) {
        gl.stencilFuncSeparate(CullMode.Back, this.stencilBackFunction, this.stencilBackReference, this.stencilBackMask)
      }

      if (changes.stencilBackFail !== null || changes.stencilBackDepthFail !== null || changes.stencilBackDepthPass !== null) {
        gl.stencilOpSeparate(CullMode.Back, this.stencilBackFail, this.stencilBackDepthFail, this.stencilBackDepthPass)
      }

      this.clearChanges()
      return this
    }

    resolve():StencilState {
      StencilState.resolve(this.gl, this)
      this.clearChanges()
      return this
    }

    copy(out:any={}):StencilStateOptions {
      for (let key of propertyKeys) out[key] = this[key]
      return out
    }

    private clearChanges(){
      this.hasChanged = false
      for (let key of propertyKeys) this.changes[key] = undefined
    }

    static convert(state:any):StencilStateOptions {
      if (typeof state === 'string') {
        state = StencilState[state];
      }
      if (!state) {
        return state
      }
      if (state.stencilFunction) {
        state.stencilFunction = CompareFunction[state.stencilFunction]
      }
      if (state.stencilBackFunction) {
        state.stencilBackFunction = CompareFunction[state.stencilBackFunction]
      }

      if (state.stencilFail) {
        state.stencilFail = StencilOperation[state.stencilFail]
      }
      if (state.stencilDepthFail) {
        state.stencilDepthFail = StencilOperation[state.stencilDepthFail]
      }
      if (state.stencilDepthPass) {
        state.stencilDepthPass = StencilOperation[state.stencilDepthPass]
      }

      if (state.stencilBackFail) {
        state.stencilBackFail = StencilOperation[state.stencilBackFail]
      }
      if (state.stencilBackDepthFail) {
        state.stencilBackDepthFail = StencilOperation[state.stencilBackDepthFail]
      }
      if (state.stencilBackDepthPass) {
        state.stencilBackDepthPass = StencilOperation[state.stencilBackDepthPass]
      }
      return state;
    }

    static resolve(gl, out:any={}):StencilStateOptions {
      out.enable = gl.getParameter(gl.STENCIL_TEST)

      out.stencilFunction = gl.getParameter(gl.STENCIL_FUNC)
      out.stencilReference = gl.getParameter(gl.STENCIL_REF)
      out.stencilMask = gl.getParameter(gl.STENCIL_VALUE_MASK)

      out.stencilFail = gl.getParameter(gl.STENCIL_FAIL)
      out.stencilDepthFail = gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL)
      out.stencilDepthPass = gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS)

      out.stencilBackFunction = gl.getParameter(gl.STENCIL_BACK_FUNC)
      out.stencilBackReference = gl.getParameter(gl.STENCIL_BACK_REF)
      out.stencilBackMask = gl.getParameter(gl.STENCIL_BACK_VALUE_MASK)

      out.stencilBackFail = gl.getParameter(gl.STENCIL_BACK_FAIL)
      out.stencilBackDepthFail = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_FAIL)
      out.stencilBackDepthPass = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_PASS)
      return out
    }

    static Default = Object.freeze({
      enable: false,

      // front face stencil
      stencilFunction: CompareFunction.Always,
      stencilReference: 0,
      stencilMask: 0xffffffff,

      stencilFail: StencilOperation.Keep,
      stencilDepthFail: StencilOperation.Keep,
      stencilDepthPass: StencilOperation.Keep,

      // back face stencil
      stencilBackFunction: CompareFunction.Always,
      stencilBackReference: 0,
      stencilBackMask: 0xffffffff,

      stencilBackFail: StencilOperation.Keep,
      stencilBackDepthFail: StencilOperation.Keep,
      stencilBackDepthPass: StencilOperation.Keep
    })
  }
}
