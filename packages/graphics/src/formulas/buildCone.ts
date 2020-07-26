import { getOption } from '@gglib/utils'
import type { ModelBuilder } from '../model/ModelBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildCone} function
 *
 * @public
 */
export interface BuildConeOptions {
  /**
   * The height of the cone
   * @remarks
   * defaults to `1.0`
   */
  height?: number,
  /**
   * The bottom radius of the cone
   * @remarks
   * defaults to `0.5`
   */
  lowerRadius?: number,
  /**
   * The top radius of the cone
   * @remarks
   * defaults to `0.0`
   */
  upperRadius?: number,
  /**
   * The tesselation factor
   */
  tesselation?: number,
}

/**
 * Builds a cone shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildCone(builder: ModelBuilder, options: BuildConeOptions = {}) {

  const r1 = getOption(options, 'lowerRadius', 0.5)
  const r2 = getOption(options, 'upperRadius', 0)
  const h = getOption(options, 'height', 1.0)

  buildParametricSurface(builder, {
    f: (u: number, v: number) => {
      u = 1 - u
      v = 1 - v
      const s = (h - v * h) / h
      const r = r1 * s + r2 * ( 1 - s)
      return {
        x: r * Math.cos(Math.PI * 2 * u),
        y: v * h,
        z: r * Math.sin(Math.PI * 2 * u),
      }
    },
    tu: getOption(options, 'tesselation', 32),
    tv: getOption(options, 'tesselation', 32),
  })
}
