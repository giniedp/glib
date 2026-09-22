import type { SurfaceFormat, TypedArray } from '../enums'

export abstract class DeviceOutput {
  /**
   * The width of the output surface (the canvas) in pixels.
   */
  abstract readonly width: number

  /**
   * The height of the output surface (the canvas) in pixels.
   */
  abstract readonly height: number

  /**
   * The surface format of the output.
   *
   * @webgpu this is usually 'bgra8unorm' but may also be 'rgba8unorm'
   * @webgl2 this is always 'rgba8unorm'
   */
  abstract readonly format: SurfaceFormat
  abstract resize(width: number, height: number): void
  abstract readPixels(x?: number, y?: number, width?: number, height?: number): Promise<TypedArray>

  public get aspectRatio(): number {
    return this.width / this.height
  }
}
