import { ModelBuilder } from '../ModelBuilder'
import { addParametricSurface } from './addParametricSurface'
import { formulas } from './formulas'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

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
 * @public
 */
export function buildDisc(builder: ModelBuilder, options: BuildDiscOptions = {}) {

  const h = withDefault(options.offset, 0.0)
  const r1 = withDefault(options.outerRadius, 0.5)
  const r2 = withDefault(options.innerRadius, 0.25)

  addParametricSurface(builder, {
    f: (u: number, v: number) => {
      return {
        x: v * Math.sin(u),
        y: h,
        z: v * Math.cos(u),
      }
    },
    tu: withDefault(options.tesselation, 32),
    tv: withDefault(options.tesselation, 32),
    u0: 0,
    u1: Math.PI * 2,
    v0: r2,
    v1: r1,
  })
}

formulas['Disc'] = buildDisc
