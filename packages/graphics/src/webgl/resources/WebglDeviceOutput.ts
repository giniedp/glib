import type { SurfaceFormat, TypedArray } from '../../enums'
import { DeviceOutput } from '../../resources'
import type { WebglDevice } from '../WebglDevice'

export class WebglDeviceOutput extends DeviceOutput {
  public readonly device: WebglDevice
  public get width(): number {
    return this.device.context.canvas.width
  }
  public get height(): number {
    return this.device.context.canvas.height
  }
  public get format(): SurfaceFormat {
    return 'RGBA8_UNORM'
  }

  public constructor(device: WebglDevice) {
    super()
    this.device = device
  }

  public resize(width: number, height: number): boolean {
    if (this.width === width && this.height === height) {
      return false
    }
    this.device.context.canvas.width = width
    this.device.context.canvas.height = height
    return true
  }

  public async readPixels(
    x: number = 0,
    y: number = 0,
    width: number = this.width,
    height: number = this.height,
  ): Promise<TypedArray> {
    const gl = this.device.context

    const restoreRead = this.device.framebuffer.read
    const restoreDraw = this.device.framebuffer.draw
    this.device.framebuffer.activate(null)

    // TODO: resolve data type from format
    const data = new Uint8Array(width * height * 4)
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data)

    this.device.framebuffer.restore(restoreRead, restoreDraw)
    return data
  }
}
