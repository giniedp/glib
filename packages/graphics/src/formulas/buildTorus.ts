import { ModelBuilder } from '../ModelBuilder'
import { addParametricSurface } from './addParametricSurface'
import { formulas } from './formulas'

const option = (opt: any, fallback: any) => opt == null ? fallback : opt
const cos = Math.cos
const sin = Math.sin

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
  tesselation?: number,
}

/**
 * @public
 */
export function buildTorus(builder: ModelBuilder, options: BuildTorusOptions = {}) {
  const ri = option(options.innerRadius, 0.25)
  const ro = option(options.outerRadius, 0.5)

  const r1 = ri + (ro - ri) * 0.5
  const r2 = r1 - ri

  addParametricSurface(builder, {
    f: (phi: number, theta: number) => {
      return {
        x: (r1 + r2 * sin(theta)) * sin(phi),
        y: (r2 * cos(theta)),
        z: (r1 + r2 * sin(theta)) * cos(phi),
      }
    },
    tu: option(options.tesselation, 32),
    tv: option(options.tesselation, 32),
    u0: 0,
    u1: Math.PI * 2,
    v0: 0,
    v1: Math.PI * 2,
  })
}

formulas['Torus'] = buildTorus
