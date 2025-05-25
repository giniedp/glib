import type { GeometryBuilder } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

export const BuildTorusDefaults = {
  outerRadius: 0.5,
  innerRadius: 0.25,
  tesselation: 32,
}

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
export function buildTorus(builder: GeometryBuilder, options?: BuildTorusOptions) {
  const t = options?.tesselation ?? BuildTorusDefaults.tesselation
  const ri = options?.innerRadius ?? BuildTorusDefaults.innerRadius
  const ro = options?.outerRadius ?? BuildTorusDefaults.outerRadius

  const r1 = ri + (ro - ri) * 0.5
  const r2 = r1 - ri

  buildParametricSurface(builder, {
    position: (phi: number, theta: number) => {
      return {
        x: (r1 + r2 * Math.sin(theta)) * Math.sin(phi),
        y: r2 * Math.cos(theta),
        z: (r1 + r2 * Math.sin(theta)) * Math.cos(phi),
      }
    },
    normal: (phi: number, theta: number) => {
      return {
        x: Math.sin(theta) * Math.sin(phi),
        y: Math.cos(theta),
        z: Math.sin(theta) * Math.cos(phi),
      }
    },
    uSteps: t,
    vSteps: t,
    uStart: 0,
    uEnd: Math.PI * 2,
    vStart: 0,
    vEnd: Math.PI * 2,
  })
}
