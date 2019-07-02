import { getOption } from '@gglib/utils'
import { ModelBuilder } from '../ModelBuilder'
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
  height?: number,
  /**
   * The offset along the y axis. Defaults to `-0.5`.
   */
  offset?: number,
  /**
   * Radius of the cylinder. Defaults to `0.5`.
   */
  radius?: number,
  /**
   * The tesselation. Defaults to `32`.
   */
  tesselation?: number,
}

/**
 * Builds a cylinder shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildCylinder(builder: ModelBuilder, options: BuildCylinderOptions = {}) {

  const r = getOption(options, 'radius', 0.5)
  const h = getOption(options, 'height', 1.0)
  const o = getOption(options, 'offset', -0.5)

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
    tu: getOption(options, 'tesselation', 32),
    tv: getOption(options, 'tesselation', 32),
    u0: 0,
    u1: Math.PI * 2,
    v0: o + h,
    v1: o,
  })
}
