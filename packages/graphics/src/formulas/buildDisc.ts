import { getOption } from '@gglib/utils'
import type { ModelBuilder } from '../model/ModelBuilder'
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
  offset?: number,
  /**
   * The outer radius
   */
  outerRadius?: number,
  /**
   * The inner radius
   */
  innerRadius?: number,
  /**
   * The tesselation
   */
  tesselation?: number,
}

/**
 * Builds a disc shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildDisc(builder: ModelBuilder, options: BuildDiscOptions = {}) {

  const h = getOption(options, 'offset', 0.0)
  const r1 = getOption(options, 'outerRadius', 0.5)
  const r2 = getOption(options, 'innerRadius', 0.25)

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
    tu: getOption(options, 'tesselation', 32),
    tv: getOption(options, 'tesselation', 32),
    u0: 0,
    u1: Math.PI * 2,
    v0: r2,
    v1: r1,
  })
}
