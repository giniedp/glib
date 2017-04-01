// tslint:disable:no-bitwise

module Glib.Terrain {

  export interface HeightMapOptions {
    width: number
    height: number
    heights?: Float32Array|number[]
    normals?: Float32Array|number[]
  }

  export class HeightMap {

    public static fromImage(image, width, height) {
      return new HeightMap({
        height: height || image.naturalHeight,
        heights: Glib.utils.getImageData(image, width, height),
        width: width || image.naturalWidth
      })
    }

    public width: number
    public height: number
    public heights: Float32Array
    public normals: Float32Array

    constructor(options: HeightMapOptions) {
      this.width = options.width
      this.height = options.height

      const heights: any = options.heights
      if (Array.isArray(heights)) {
        this.heights = new Float32Array(heights)
      } else {
        this.heights = new Float32Array(this.width * this.height)
      }

      const normals: any = options.normals
      if (Array.isArray(normals)) {
        this.normals = new Float32Array(normals)
      } else {
        this.normals = new Float32Array(this.width * this.height * 3)
        this.calculateNormals()
      }
    }

    public heightAt(x: number, y: number): number {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        return this.heights[(x + y * this.width) | 0]
      }
      return 0
    }

    public normalAt(x: number, y: number, out?: IVec3): IVec3 {
      out = out || new Glib.Vec3()
      x = Math.min(x, this.width - 1)
      y = Math.min(y, this.height - 1)
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

    public calculateNormals(): HeightMap {
      const normal = Glib.Vec3.zero()
      let index = 0
      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          this.calculateNormalAt(x, y, normal).copyTo(this.normals, index)
          index += 3
        }
      }
      return this
    }

    public calculateNormalAt(x, z, out) {
      const w1 = 0.5
      const w2 = 1.0
      const width = this.width
      let sIndex = x + z * width
      const field = this.heights
      out = out || Glib.Vec3.zero()

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

      return out.init(dx, 1, dy).selfNormalize()
    }

    public rescale(scale: number): HeightMap {
      let index = 0
      let nIndex = 0
      const normal = Glib.Vec3.zero()

      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          this.heights[index] *= scale
          this.normals[nIndex + 1] /= scale
          normal.initFromBuffer(this.normals, nIndex).normalize().copyTo(this.normals, nIndex)
          index += 1
          nIndex += 3
        }
      }
      return this
    }
  }
}
