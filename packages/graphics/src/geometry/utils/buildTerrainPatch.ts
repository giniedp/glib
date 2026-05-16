import { PrimitiveType } from '../../enums'
import type { Device } from '../../Device'
import { Geometry } from '../Geometry'
import { beginGeometry, type GeometryBuilder } from '../GeometryBuilder'

export const BuildTerrainPatchDefaults: BuildTerranPatchOptions = {
  size: 32,
  tesselation: 32,
  lodSeamTop: false,
  lodSeamBottom: false,
  lodSeamLeft: false,
  lodSeamRight: false,
  getPosition: (x: number, y: number, z: number) => [x, y, z],
}

export interface BuildTerranPatchOptions {
  /**
   * Width and height in units
   */
  size?: number
  /**
   * Number of segments per side
   *
   * @remarks
   * Number of vertices is `tesselation + 1`
   */
  tesselation?: number
  /**
   * Creates transition to low level variant at the top
   */
  lodSeamTop?: boolean
  /**
   * Creates transition to low level variant at the bottom
   */
  lodSeamBottom?: boolean
  /**
   * Creates transition to low level variant at the left
   */
  lodSeamLeft?: boolean
  /**
   * Creates transition to low level variant at the right
   */
  lodSeamRight?: boolean
  /**
   * Starts with odd pattern
   */
  oddPattern?: boolean
  /**
   * Gets transformed position
   */
  getPosition?: (x: number, y: number, z: number) => readonly [number, number, number]
  /**
   *
   */
  materialId?: number
  /**
   *
   */
  primitiveType?: PrimitiveType
}

export function terrainPatchGeometry(device: Device, options?: BuildTerranPatchOptions): Geometry {
  return beginGeometry().append(buildTerrainPatch, options).calculateBoundings().endGeometry(device, {
    name: 'terrain patch',
    materialId: options?.materialId,
    primitiveType: options?.primitiveType,
  })
}

export function buildTerrainPatch(builder: GeometryBuilder, options?: BuildTerranPatchOptions) {
  const tesselation = options?.tesselation ?? BuildTerrainPatchDefaults.tesselation
  const size = options?.size ?? tesselation
  const getPosition = options?.getPosition ?? BuildTerrainPatchDefaults.getPosition
  for (let y = 0; y <= tesselation; y++) {
    for (let x = 0; x <= tesselation; x++) {
      builder.addVertex({
        position: getPosition(size * (x / tesselation), 0, size * (y / tesselation)),
        normal: [0, 1, 0],
        texture: [x / tesselation, y / tesselation],
      })
    }
  }

  let i = 0
  let evenPattern = !options?.oddPattern
  const stride = tesselation + 1
  for (let y = 0; y < tesselation; y++) {
    let even = evenPattern
    for (let x = 0; x < tesselation; x++) {
      i = y * stride + x

      const a = i
      const b = i + 1
      const c = i + stride
      const d = i + stride + 1

      if (even) {
        // a--b
        // |\ |
        // | \|
        // c--d
        builder.addIndex(a)
        builder.addIndex(b)
        builder.addIndex(d)

        builder.addIndex(a)
        builder.addIndex(d)
        builder.addIndex(c)
      } else {
        // a--b
        // | /|
        // |/ |
        // c--d
        builder.addIndex(a)
        builder.addIndex(b)
        builder.addIndex(c)

        builder.addIndex(c)
        builder.addIndex(b)
        builder.addIndex(d)
      }
      even = !even
    }
    evenPattern = !evenPattern
  }
}
