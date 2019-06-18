import { ModelBuilder } from '../ModelBuilder'
import { addParametricSurface } from './addParametricSurface'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

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
 * @public
 */
export function buildCone(builder: ModelBuilder, options: BuildConeOptions = {}) {

  const r1 = withDefault(options.lowerRadius, 0.5)
  const r2 = withDefault(options.upperRadius, 0)
  const h = withDefault(options.height, 1.0)

  addParametricSurface(builder, {
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
    tu: withDefault(options.tesselation, 32),
    tv: withDefault(options.tesselation, 32),
  })
}
