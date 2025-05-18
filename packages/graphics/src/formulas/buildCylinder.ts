import { getOption } from '@gglib/utils'
import type { GeometryBuilder } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildCylinder} function
 *
 * @public
 */
export interface BuildCylinderOptions {
  /**
   * The height of the cylinder. Defaults to `1.0`.
   */
  height?: number
  /**
   * The offset along the y axis. Defaults to `-0.5`.
   */
  offset?: number
  /**
   * Radius of the cylinder. Defaults to `0.5`.
   */
  radius?: number
  /**
   * The tesselation. Defaults to `32`.
   */
  tesselation?: number
}

/**
 * Builds a cylinder shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildCylinder(builder: GeometryBuilder, options: BuildCylinderOptions = {}) {
  const r = options.radius ?? 0.5
  const h = options.height ?? 1.0
  const o = options.offset ?? -0.5
  const t = options.tesselation ?? 32
  buildParametricSurface(builder, {
    f: (u: number, v: number) => {
      return {
        x: r * Math.sin(u),
        y: v,
        z: r * Math.cos(u),
      }
    },
    n: (u: number, v: number) => {
      return {
        x: Math.sin(u),
        y: 0,
        z: Math.cos(u),
      }
    },
    tu: t,
    tv: t,
    u0: 0,
    u1: Math.PI * 2,
    v0: o + h,
    v1: o,
  })
}
