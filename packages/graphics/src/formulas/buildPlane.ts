import { ModelBuilder } from '../ModelBuilder'
import { addParametricSurface } from './addParametricSurface'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

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
 * @public
 */
export function buildPlane(builder: ModelBuilder, options: BuildPlaneOptions = {}) {
  const size = withDefault(options.size, 1)
  addParametricSurface(builder, {
    f: (u: number, v: number) => {
      return {
        x: (u - 0.5) * size,
        y: 0,
        z: (v - 0.5) * size,
      }
    },
    tu: withDefault(options.tesselation, 1),
    tv: withDefault(options.tesselation, 1),
  })
}
