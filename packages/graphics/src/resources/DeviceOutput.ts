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
   * @webgpu this is usually 'BGRA8_UNORM' but may also be 'RGBA8_UNORM'
   * @webgl2 this is always 'RGBA8_UNORM'
   */
  abstract readonly format: SurfaceFormat
  abstract resize(width: number, height: number): void
  abstract readPixels(x?: number, y?: number, width?: number, height?: number): Promise<TypedArray>

  public get aspectRatio(): number {
    return this.width / this.height
  }
}
