import { ModelBuilder } from '../ModelBuilder'
import { addParametricSurface } from './addParametricSurface'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

const sin = Math.sin
const cos = Math.cos

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
 * @public
 */
export function buildSphere(builder: ModelBuilder, options: BuildSphereOptions = {}) {
  const r = withDefault(options.radius, 0.5)

  addParametricSurface(builder, {
    f: (phi: number, theta: number) => {
      return {
        x: r * sin(theta) * sin(phi),
        y: r * cos(theta),
        z: r * sin(theta) * cos(phi),
      }
    },
    tu: withDefault(options.tesselation, 32),
    tv: withDefault(options.tesselation, 32),
    u0: 0,
    u1: Math.PI * 2,
    v0: 0,
    v1: Math.PI,
  })
}
