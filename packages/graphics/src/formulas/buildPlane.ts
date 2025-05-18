import type { GeometryBuilder } from '../model/GeometryBuilder'
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

/**
 * Builds a plane shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildPlane(builder: GeometryBuilder, options: BuildPlaneOptions = {}) {
  const size = options?.size ?? 1
  buildParametricSurface(builder, {
    f: (u: number, v: number) => {
      return {
        x: (u - 0.5) * size,
        y: 0,
        z: (v - 0.5) * size,
      }
    },
    n: (u: number, v: number) => {
      return {
        x: 0,
        y: 1,
        z: 0,
      }
    },
    tu: options?.tesselation ?? 1,
    tv: options?.tesselation ?? 1,
  })
}
