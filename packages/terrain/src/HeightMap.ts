// tslint:disable: no-bitwise
import { IVec3, Vec3 } from '@gglib/math'

let canvas: HTMLCanvasElement = null

/**
 * Extracts image data from an {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement | HTMLImageElement}
 *
 * @public
 */
export function getImageData(image: HTMLImageElement, width?: number, height?: number) {
  if (!image.complete) {
    throw new Error('image must be completed')
  }
  canvas = canvas || document.createElement('canvas')
  canvas.width = width || image.naturalWidth
  canvas.height = height || image.naturalHeight

  let ctx = canvas.getContext('2d')

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let data = imgData.data
  let result: number[] = []
  result.length = data.length / 4
  for (let i = 0; i < result.length; i++) {
    const r = data[i * 4 + 0]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]

    if (r === g && r === b) {
      result[i] = r
    } else if (b) {
      result[i] = 255 + 255 + b
    } else if (g) {
      result[i] = 255 + g
    } else if (r) {
      result[i] = r
    } else {
      result[i] = 0
    }
  }
  return result
}

/**
 * Constructor options for the {@link HeightMap}
 *
 * @public
 */
export interface HeightMapOptions {
  width: number
  height: number
  heights?: Float32Array|number[]
  normals?: Float32Array|number[]
  smooth?: number
}

/**
 * Provides image based hight map utilities
 *
 * @public
 */
export class HeightMap {

  public static fromImage(image: HTMLImageElement, width?: number, height?: number) {
    return new HeightMap({
      height: height || image.naturalHeight,
      heights: getImageData(image, width, height),
      width: width || image.naturalWidth,
    })
  }

  public readonly width: number
  public readonly height: number
  public readonly heights: Float32Array
  public readonly normals: Float32Array

  constructor(options: HeightMapOptions) {
    this.width = options.width
    this.height = options.height

    const heights: any = options.heights
    if (Array.isArray(heights)) {
      this.heights = new Float32Array(heights)
    } else {
      this.heights = new Float32Array(this.width * this.height)
    }

    if (options.smooth) {
      this.smooth(options.smooth)
    }

    const normals: any = options.normals
    if (Array.isArray(normals)) {
      this.normals = new Float32Array(normals)
    } else {
      this.normals = new Float32Array(this.width * this.height * 3)
      this.calculateNormals()
    }
  }

  /**
   * Gets the value at given pixel coordinate
   *
   * @param x - The x coordinate
   * @param y - The y coordinate
   */
  public heightAt(x: number, y: number): number {
    x = Math.max(Math.min(x, this.width - 1), 0) | 0
    y = Math.max(Math.min(y, this.height - 1), 0) | 0
    return this.heights[(x + y * this.width) || 0]
  }

  /**
   * Gets the pre calculated normal at given pixel coordinate
   *
   * @param x - The x coordinate
   * @param y - The y coordinate
   */
  public normalAt(x: number, y: number): Vec3
  /**
   * Gets the pre calculated normal at given pixel coordinate
   *
   * @param x - The x coordinate
   * @param y - The y coordinate
   * @param out - Where the result should be written to
   */
  public normalAt<T>(x: number, y: number, out: T): T & IVec3
  public normalAt(x: number, y: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    x = Math.max(Math.min(x, this.width - 1), 0)
    y = Math.max(Math.min(y, this.height - 1), 0)
    if (x >= 0 && y >= 0) {
      const index = (x + y * this.width) * 3
      out.x = this.normals[index]
      out.y = this.normals[index + 1]
      out.z = this.normals[index + 2]
    } else {
      out.x = 0
      out.y = 1
      out.z = 0
    }
    return out
  }

  /**
   * Pre calculates all normals based on available height map data
   */
  public calculateNormals(): this {
    const normal = Vec3.createZero()
    let index = 0
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.calculateNormalAt(x, y, normal).toArray(this.normals, index)
        index += 3
      }
    }
    return this
  }

  /**
   * Calculates the normal at given pixel coordinate
   *
   * @param x - The x coordinate
   * @param y - The y coordinate
   * @param out - Where the result should be written to
   */
  public calculateNormalAt(x: number, y: number, out: Vec3) {
    const w1 = 0.5
    const w2 = 1.0
    const width = this.width
    let sIndex = x + y * width
    const field = this.heights
    out = out || Vec3.createZero()

    sIndex -= width
    const tl = (field[sIndex - 1] || 0) * w1
    const t =  (field[sIndex    ] || 0) * w2
    const tr = (field[sIndex + 1] || 0) * w1

    sIndex += width
    const l =  (field[sIndex - 1] || 0) * w2
    const r =  (field[sIndex + 1] || 0) * w2

    sIndex += width
    const bl = (field[sIndex - 1] || 0) * w1
    const b =  (field[sIndex    ] || 0) * w2
    const br = (field[sIndex + 1] || 0) * w1

    const dx = tl + l + bl - tr - r - br
    const dy = tl + t + tr - bl - b - br

    return out.init(dx, 1, dy).normalize()
  }

  public rescale(scale: number): HeightMap {
    let index = 0
    let nIndex = 0
    const normal = Vec3.createZero()

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.heights[index] *= scale
        this.normals[nIndex + 1] /= scale
        normal.initFromArray(this.normals, nIndex).normalize().toArray(this.normals, nIndex)
        index += 1
        nIndex += 3
      }
    }
    return this
  }

  public smooth(steps: number = 1): HeightMap {
    if (steps <= 0) {
      return
    }
    const w = this.width
    const h = this.height
    const data = this.heights
    const data1 = new Float32Array(data.length)

    for (let i = 0; i < data.length; i++) {
      data1[i] = data[i]
    }

    while (steps > 0) {
      steps--
      for (let x = 1; x < w - 1; x++) {
        for (let y = 1; y < h - 1; y++) {
          const i = x + y * w

          data1[i] = data[i] * 4
          data1[i] += data[i + w] * 2
          data1[i] += data[i - w] * 2
          data1[i] += data[i + 1] * 2
          data1[i] += data[i - 1] * 2
          data1[i] += data[i + w + 1] * 1
          data1[i] += data[i + w - 1] * 1
          data1[i] += data[i - w + 1] * 1
          data1[i] += data[i - w - 1] * 1

          data1[i] = data1[i] / 16
        }
      }
      for (let i = 0; i < data.length; i++) {
        data[i] = data1[i]
      }
    }

    return this
  }
}
