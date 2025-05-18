import type { GeometryBuilder } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildDisc} function
 *
 * @public
 */
export interface BuildDiscOptions {
  /**
   * The offset along the y axis
   */
  offset?: number
  /**
   * The outer radius
   */
  outerRadius?: number
  /**
   * The inner radius
   */
  innerRadius?: number
  /**
   * The tesselation
   */
  tesselation?: number
}

/**
 * Builds a disc shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildDisc(builder: GeometryBuilder, options: BuildDiscOptions = {}) {
  const h = options?.offset ?? 0.0
  const r1 = options?.outerRadius ?? 0.5
  const r2 = options?.innerRadius ?? 0.25

  buildParametricSurface(builder, {
    f: (u: number, v: number) => {
      return {
        x: v * Math.sin(u),
        y: h,
        z: v * Math.cos(u),
      }
    },
    n: (u: number, v: number) => {
      return {
        x: 0,
        y: 1,
        z: 0,
      }
    },
    tu: options?.tesselation ?? 32,
    tv: options?.tesselation ?? 32,
    u0: 0,
    u1: Math.PI * 2,
    v0: r2,
    v1: r1,
  })
}
