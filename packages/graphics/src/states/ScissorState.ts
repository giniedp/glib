import { Device } from './../Device'

const paramNames: Array<keyof ScissorStateParams> = ['enable', 'x', 'y', 'width', 'height']

/**
 * The ScissorState parameters
 *
 * @public
 */
export interface ScissorStateParams {
  enable?: boolean
  x?: number
  y?: number
  width?: number
  height?: number
}

/**
 * @public
 */
export class ScissorState implements ScissorStateParams {
  public device: Device
  public gl: WebGLRenderingContext
  private enableField: boolean = false
  private xField: number = 0
  private yField: number = 0
  private widthField: number = 0
  private heightField: number = 0
  private hasChanged: boolean = false
  private changes: ScissorStateParams = {}

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, state?: ScissorStateParams) {
    this.device = device
    this.gl = device.context
    this.resolve()
    if (state) { this.assign(state) }
  }

  public get enable(): boolean {
    return this.enableField
  }

  public set enable(value: boolean) {
    if (this.enableField !== value) {
      this.enableField = value
      this.changes.enable = value
      this.hasChanged = true
    }
  }

  public get x(): number {
    return this.xField
  }

  public set x(value: number) {
    if (this.xField !== value) {
      this.xField = value
      this.changes.x = value
      this.hasChanged = true
    }
  }

  public get y(): number {
    return this.yField
  }

  public set y(value: number) {
    if (this.yField !== value) {
      this.yField = value
      this.changes.y = value
      this.hasChanged = true
    }
  }

  public get width(): number {
    return this.widthField
  }

  public set width(value: number) {
    if (this.widthField !== value) {
      this.widthField = value
      this.changes.width = value
      this.hasChanged = true
    }
  }

  public get height(): number {
    return this.heightField
  }

  public set height(value: number) {
    if (this.heightField !== value) {
      this.heightField = value
      this.changes.height = value
      this.hasChanged = true
    }
  }

  /**
   * Assings state variable
   *
   * @param state - the state variables to assign
   */
  public assign(state: ScissorStateParams= {}): ScissorState {
    for (const key of paramNames) {
      if (state.hasOwnProperty(key)) {
        this[key as any] = state[key]
      }
    }
    return this
  }

  /**
   * Commits the changed state variables to the GPU
   *
   * @param state - the state variables to assing before commit
   */
  public commit(state?: ScissorStateParams): ScissorState {
    if (state) { this.assign(state) }
    if (!this.hasChanged) { return this }
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

  /**
   * Resolves the GPU state
   */
  public resolve(): ScissorState {
    ScissorState.resolve(this.gl, this)
    this.clearChanges()
    return this
  }

  public copy(out: any= {}): ScissorStateParams {
    for (const key of paramNames) {
      out[key] = this[key]
    }
    return out
  }

  private clearChanges() {
    this.hasChanged = false
    for (const key of paramNames) {
      this.changes[key as any] = undefined
    }
  }

  public static commit(gl: WebGLRenderingContext | WebGL2RenderingContext, state: ScissorStateParams) {
    const x = state.x
    const y = state.y
    const width = state.width
    const height = state.height
    const enable = state.enable
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

  public static resolve(gl: WebGLRenderingContext | WebGL2RenderingContext, out: ScissorStateParams= {}): ScissorStateParams {
    out.enable = gl.getParameter(gl.SCISSOR_TEST)
    const scissor = gl.getParameter(gl.SCISSOR_BOX)
    out.x = scissor[0]
    out.y = scissor[1]
    out.width = scissor[2]
    out.height = scissor[3]
    return out
  }

  public static Default = Object.freeze<ScissorStateParams>({
    enable: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
}
