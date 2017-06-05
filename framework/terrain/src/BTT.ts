// tslint:disable no-bitwise
// tslint:disable max-classes-per-file
import { highestBit } from '@glib/core'
import * as Graphics from '@glib/graphics'
import { IVec3, Vec3 } from '@glib/math'
import { HeightMap } from './HeightMap'

/// http://www.gamedevelopment.com/view/feature/130171/binary_triangle_trees_for_terrain_.php?page=2

export class BTTRoot {
  public device: Graphics.Device
  public heightMap: HeightMap
  public patchSize: number
  public lodScale: number
  public indexBuffers: Graphics.Buffer[][]
  public patches: BTTPatch[]
  public model: Graphics.Model

  constructor(device: Graphics.Device, options: {
    heightMap: HeightMap,
    patchSize?: number,
    lodScale?: number,
    materials?: Graphics.ShaderEffect[]|Graphics.ShaderEffectOptions[],
  }) {
    this.device = device

    this.heightMap = options.heightMap
    this.patchSize = Number(options.patchSize) || 64
    this.lodScale = Number(options.lodScale) | 0 || 2

    const maxLod = highestBit(this.patchSize) * 2
    const iBuffers: Graphics.Buffer[][] = this.indexBuffers = []
    for (let i = 0; i <= maxLod; i++) {
      iBuffers[i] = []
      for (let j = 0; j < 15; j++) {
        if ((i % 2 === 0) && j > 0) {
          iBuffers[i][j] = iBuffers[i][0]
        } else {
          const data = BTTPatch.createIndices(i, j, this.patchSize + 1)
          iBuffers[i][j] = new Graphics.Buffer(device, {
            data: data,
            dataType: 'ushort',
            type: 'IndexBuffer',
          })
        }
      }
    }

    const patches = []
    const meshes = []
    for (let y = 0; y < this.heightMap.height; y += this.patchSize) {
      for (let x = 0; x < this.heightMap.width; x += this.patchSize) {
        const patch = new BTTPatch(device, {
          parent: this,
          startX: x,
          startY: y,
        })
        patches.push(patch)
        meshes.push(patch.mesh)
      }
    }

    this.patches = patches
    this.model = device.createModel({
      materials: options.materials,
      meshes: meshes,
    })
  }

  public updateLod(viewPos: IVec3) {
    BTTPatch.updateLod(viewPos, this.patches)
  }
}

export class BTTPatch {

  public static createVertices(heightmap: HeightMap, startX: number, startY: number, size: number): number[] {
    const normal = { x: 0, y: 0, z: 0 }
    const vertices: any = []
    for (let y = startY; y < startY + size; y++) {
      for (let x = startX; x < startX + size; x++) {

        // position
        vertices.push(x)
        vertices.push(heightmap.heightAt(x, y))
        vertices.push(y)

        // normal
        heightmap.normalAt(x, y, normal)
        vertices.push(normal.x)
        vertices.push(normal.y)
        vertices.push(normal.z)

        // texture
        vertices.push(x / (heightmap.width))
        vertices.push(y / (heightmap.height))
      }
    }
    return vertices
  }

  public static createIndices(level: number, version: number, size: number) {

    const list = []
    if (level === 0) {
      list.push(0)
      list.push(size - 1)
      list.push(size * size - 1)

      list.push(0)
      list.push(size * size - 1)
      list.push(size * size - size)
      return list
    }

    const isEven = (level % 2) === 0
    const density = Math.pow(2, Math.floor(level / 2.0))
    const step = Math.ceil((size - 1) / density) | 0
    const halfStep = step / 2 || 0

    let vIndex = 0
    for (let z = 0; z < size - 1; z += step) {
      for (let x = 0; x < size - 1; x += step) {
        vIndex = x + z * size

        if (isEven) {
          const mod = 2 * step
          if (((x % mod) === 0 && (z % mod) === 0) || ((x % mod) !== 0 && (z % mod) !== 0)) {
            // a--b---
            // |\ | /|
            // | \|/ |
            // c--d--*
            // | /|\ |
            // |/ | \|
            // ---*--*

            list.push(vIndex)
            list.push(vIndex + step)
            list.push(vIndex + size * step + step)

            list.push(vIndex)
            list.push(vIndex + size * step + step)
            list.push(vIndex + size * step)

          } else {
            // ---a--b
            // |\ | /|
            // | \|/ |
            // *--c--d
            // | /|\ |
            // |/ | \|
            // *--*---

            list.push(vIndex)
            list.push((vIndex + step))
            list.push((vIndex + size * step))

            list.push((vIndex + step))
            list.push((vIndex + size * step + step))
            list.push((vIndex + size * step))
          }
        } else {
          // a--d--g
          // |\ | /|
          // | \|/ |
          // b--e--h
          // | /|\ |
          // |/ | \|
          // c--f--i

          const a = vIndex
          const b = vIndex + size * halfStep
          const c = vIndex + size * step
          const d = a + halfStep
          const e = b + halfStep
          const f = c + halfStep
          const g = a + step
          const h = b + step
          const i = c + step

          let order: number[] = []
          const top = 0
          const bot = (size - 1) - step
          const left = 0
          const right = (size - 1) - step

          let mask = 0
          mask |= (z === top ? 1 : 0)
          mask |= (x === right ? 2 : 0)
          mask |= (z === bot ? 4 : 0)
          mask |= (x === left ? 8 : 0)
          mask &= version

          if (mask & 1) {
            order = order.concat([ e, a, d, e, d, g ])
          } else {
            order = order.concat([ e, a, g ])
          }

          if (mask & 2) {
            order = order.concat([ e, g, h, e, h, i ])
          } else {
            order = order.concat([ e, g, i ])
          }

          if (mask & 4) {
            order = order.concat([ e, i, f, e, f, c ])
          } else {
            order = order.concat([ e, i, c ])
          }

          if (mask & 8) {
            order = order.concat([ e, c, b, e, b, a ])
          } else {
            order = order.concat([ e, c, a ])
          }

          for (const k of order) {
            list.push(order[k])
          }
        }
      }
    }

    return list
  }

  public static updateLod(viewPos: IVec3, patches: BTTPatch[]) {
    const vPos = BTTPatch.tmpV3
    vPos.x = viewPos.x
    vPos.y = 0
    vPos.z = viewPos.z
    for (const patch of patches) {
      patch.updateLod(vPos)
    }
    for (const patch of patches) {
      patch.updateVersion()
    }
  }

  private static tmpV3 = { x: 0, y: 0, z: 0 }

  public device: Graphics.Device

  /**
   * The current level of detail. Higher values means higher details.
   * The lowest detail is 0 and shows the patch with only 2 triangles.
   * @property currentLOD
   * @type {number}
   */
  public currentLOD: number = 0

  /**
   * The neighbor LOD code. The value should be in range [0,14].
   * This has the influence of how the patch is aligned to the neighbors, so gaps
   * between patches are closed.
   * @property currentVersion
   * @type {number}
   */
  public currentVersion: number = 0

  public parent: BTTRoot
  public mesh: Graphics.ModelMesh
  public startX: number
  public startY: number
  public patchSize: number
  public center: IVec3

  constructor(device: Graphics.Device, options: {
    parent: BTTRoot,
    startX: number,
    startY: number,
  }) {
    this.device = device

    this.parent = options.parent
    this.startX = options.startX
    this.startY = options.startY

    this.patchSize = this.parent.patchSize
    this.center = {
      x: this.startX + (this.patchSize - 1) / 2,
      y: 0,
      z: this.startY + (this.patchSize - 1) / 2,
    }

    this.mesh = new Graphics.ModelMesh(device, {
      indexBuffer: this.parent.indexBuffers[0][0],
      vertexBuffer: device.createVertexBuffer({
        data: BTTPatch.createVertices(
          this.parent.heightMap,
          this.startX,
          this.startY,
          this.patchSize + 1),
        dataType: 'float',
        layout: Graphics.VertexLayout.create('PositionNormalTexture'),
      }),
    })
  }

  public updateLod(viewPos: IVec3) {
    const maxLOD = this.parent.indexBuffers.length - 1

    const d = Vec3.distance(viewPos, this.center)
    const max = this.patchSize * maxLOD * this.parent.lodScale
    const t = 1 - Math.min(Math.max(d / max, 0), 1)

    this.currentLOD = Math.ceil(t * maxLOD)
    this.mesh.indexBuffer = this.parent.indexBuffers[this.currentLOD][this.currentVersion]
  }

  public getSibling(x: number, y: number) {
    const parent = this.parent
    const pCount = Math.floor(parent.heightMap.width / this.patchSize)
    const index = parent.patches.indexOf(this) + x + y * pCount
    return parent.patches[index]
  }

  public updateVersion() {
    const lod = this.currentLOD
    if (lod & 1) {
      const t = (this.getSibling( 0, -1) || this).currentLOD
      const r = (this.getSibling( 1,  0) || this).currentLOD
      const b = (this.getSibling( 0,  1) || this).currentLOD
      const l = (this.getSibling(-1,  0) || this).currentLOD

      let version = 0
      version |= t > lod ? 1 : version
      version |= r > lod ? 2 : version
      version |= b > lod ? 4 : version
      version |= l > lod ? 8 : version
      this.currentVersion = version
    }
    this.mesh.indexBuffer = this.parent.indexBuffers[this.currentLOD][this.currentVersion]
  }
}