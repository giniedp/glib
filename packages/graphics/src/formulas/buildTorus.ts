import type { GeometryBuilder } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildTorus} function
 *
 * @public
 */
export interface BuildTorusOptions {
  /**
   * The outerRadius
   * @remarks
   * defaults to `0.5`
   */
  outerRadius?: number
  /**
   * The innerRadius
   * @remarks
   * defaults to `0.25`
   */
  innerRadius?: number
  /**
   * The tesselation factor
   * @remarks
   * defaults to `32`
   */
  tesselation?: number
}

/**
 * Builds a torus shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildTorus(builder: GeometryBuilder, options: BuildTorusOptions = {}) {
  const ri = options?.innerRadius ?? 0.25
  const ro = options?.outerRadius ?? 0.5

  const r1 = ri + (ro - ri) * 0.5
  const r2 = r1 - ri

  buildParametricSurface(builder, {
    f: (phi: number, theta: number) => {
      return {
        x: (r1 + r2 * Math.sin(theta)) * Math.sin(phi),
        y: r2 * Math.cos(theta),
        z: (r1 + r2 * Math.sin(theta)) * Math.cos(phi),
      }
    },
    n: (phi: number, theta: number) => {
      return {
        x: Math.sin(theta) * Math.sin(phi),
        y: Math.cos(theta),
        z: Math.sin(theta) * Math.cos(phi),
      }
    },
    tu: options?.tesselation ?? 32,
    tv: options?.tesselation ?? 32,
    u0: 0,
    u1: Math.PI * 2,
    v0: 0,
    v1: Math.PI * 2,
  })
}
