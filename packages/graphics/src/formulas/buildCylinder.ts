import { ModelBuilder } from '../ModelBuilder'
import { addParametricSurface } from './addParametricSurface'
import { formulas } from './formulas'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

export interface BuildCylinderOptions {
  /**
   * The height of the cylinder
   */
  height?: number,
  /**
   * The offset along the y axis
   */
  offset?: number,
  /**
   * Radius of the cylinder
   */
  radius?: number,
  /**
   * The tesselation
   */
  tesselation?: number,
}

/**
 * @public
 */
export function buildCylinder(builder: ModelBuilder, options: {
  height?: number,
  offset?: number,
  radius?: number,
  tesselation?: number,
} = {}) {

  const r = withDefault(options.radius, 0.5)
  const h = withDefault(options.height, 1.0)
  const o = withDefault(options.offset, -0.5)

  addParametricSurface(builder, {
    f: (u: number, v: number) => {
      return {
        x: r * Math.sin(u),
        y: v,
        z: r * Math.cos(u),
      }
    },
    tu: withDefault(options.tesselation, 32),
    tv: withDefault(options.tesselation, 32),
    u0: 0,
    u1: Math.PI * 2,
    v0: o + h,
    v1: o,
  })
}

formulas['Cylinder'] = buildCylinder
