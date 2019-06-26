import { getOption } from '@gglib/utils'
import { ModelBuilder } from '../ModelBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildSphere} function
 *
 * @public
 */
export interface BuildSphereOptions {
  /**
   * The sphere radius
   */
  radius?: number,
  /**
   * The tesselation
   */
  tesselation?: number,
}

/**
 * Builds a sphere shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildSphere(builder: ModelBuilder, options: BuildSphereOptions = {}) {
  const r = getOption(options, 'radius', 0.5)

  buildParametricSurface(builder, {
    f: (phi: number, theta: number) => {
      return {
        x: r * Math.sin(theta) * Math.sin(phi),
        y: r * Math.cos(theta),
        z: r * Math.sin(theta) * Math.cos(phi),
      }
    },
    tu: getOption(options, 'tesselation', 32),
    tv: getOption(options, 'tesselation', 32),
    u0: 0,
    u1: Math.PI * 2,
    v0: 0,
    v1: Math.PI,
  })
}
