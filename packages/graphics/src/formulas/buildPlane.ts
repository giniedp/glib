import { Device } from '../Device'
import { Geometry } from '../model'
import { beginGeometry, type GeometryBuilder } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildPlane} function
 *
 * @public
 */
export interface BuildPlaneOptions {
  /**
   * The uniform size (width, height) of the plane
   * @remarks
   * defaults to 1
   */
  size?: number
  /**
   * The tesselation factor
   * @remarks
   * defaults to 1
   */
  tesselation?: number
}

export function planeGeometry(device: Device, options?: BuildPlaneOptions): Geometry {
  return beginGeometry().append(buildPlane, options).endGeometry(device, {
    name: 'plane',
  })
}

/**
 * Builds a plane shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildPlane(builder: GeometryBuilder, options: BuildPlaneOptions = {}) {
  const size = options?.size ?? 1
  buildParametricSurface(builder, {
    position: (u: number, v: number) => {
      return {
        x: (u - 0.5) * size,
        y: 0,
        z: (v - 0.5) * size,
      }
    },
    normal: (u: number, v: number) => {
      return {
        x: 0,
        y: 1,
        z: 0,
      }
    },
    uSteps: options?.tesselation ?? 1,
    vSteps: options?.tesselation ?? 1,
  })
}
