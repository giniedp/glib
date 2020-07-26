import { getOption } from '@gglib/utils'
import type { ModelBuilder } from '../model/ModelBuilder'
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
  size?: number,
  /**
   * The tesselation factor
   * @remarks
   * defaults to 1
   */
  tesselation?: number,
}

/**
 * Builds a plane shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildPlane(builder: ModelBuilder, options: BuildPlaneOptions = {}) {
  const size = getOption(options, 'size', 1)
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
    tu: getOption(options, 'tesselation', 1),
    tv: getOption(options, 'tesselation', 1),
  })
}
